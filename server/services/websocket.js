const { WebSocketServer, WebSocket } = require("ws");
const url = require("url");
const { verifyToken, sanitizeUser } = require("../utils/auth");
const db = require("../db");

// Map: rideId -> Set<WebSocket>
const rideSubscribers = new Map();

// Map: WebSocket -> ClientMetadata
// metadata: { user: SanitizedUser | null, subscriptions: Set<rideId>, isAlive: boolean, lastLocationUpdate: number }
const clientMetadata = new Map();

let wssInstance = null;
let heartbeatInterval = null;

/**
 * Standard message formatter
 */
function createEventMessage(type, rideId = null, payload = {}, error = null) {
  return JSON.stringify({
    type,
    rideId,
    payload,
    error,
    timestamp: new Date().toISOString()
  });
}

/**
 * Send event to a specific client safely
 */
function sendToClient(ws, messageObj) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(typeof messageObj === "string" ? messageObj : JSON.stringify(messageObj));
    } catch (err) {
      console.error("WS Send error:", err);
    }
  }
}

/**
 * Broadcast event to authorized subscribers of a specific ride
 */
function broadcastToRide(rideId, messageObj) {
  if (!rideId) return;
  const subscribers = rideSubscribers.get(rideId);
  if (!subscribers || subscribers.size === 0) return;

  const payloadStr = typeof messageObj === "string" ? messageObj : JSON.stringify(messageObj);
  subscribers.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(payloadStr);
      } catch (e) {
        console.error(`Error sending to ride subscriber (${rideId}):`, e);
      }
    }
  });
}

/**
 * Remove a client from all active subscriptions
 */
function cleanupClient(ws) {
  const meta = clientMetadata.get(ws);
  if (meta && meta.subscriptions) {
    meta.subscriptions.forEach((rideId) => {
      const subs = rideSubscribers.get(rideId);
      if (subs) {
        subs.delete(ws);
        if (subs.size === 0) {
          rideSubscribers.delete(rideId);
        }
      }
    });
  }
  clientMetadata.delete(ws);
}

/**
 * Initialize WebSocket Server attached to HTTP server
 */
function initWebSocketServer(server, forceNew = false) {
  if (wssInstance && !forceNew) {
    return wssInstance;
  }
  if (wssInstance && forceNew) {
    closeAllConnections();
  }

  wssInstance = new WebSocketServer({ server, path: "/ws", maxPayload: 64 * 1024 });

  wssInstance.on("connection", (ws, req) => {
    // 1. Initial connection setup & heartbeat
    const meta = {
      user: null,
      subscriptions: new Set(),
      isAlive: true,
      lastLocationUpdate: 0
    };
    clientMetadata.set(ws, meta);

    ws.on("pong", () => {
      const m = clientMetadata.get(ws);
      if (m) m.isAlive = true;
    });

    // 2. Parse token from query string (if provided: /ws?token=...)
    try {
      const parsedUrl = new URL(req.url, "http://localhost");
      const token = parsedUrl.searchParams.get("token");
      if (token) {
        const decoded = verifyToken(token);
        if (decoded && decoded.id) {
          const store = db.read();
          const user = store.users.find((u) => u.id === decoded.id);
          if (user) {
            meta.user = sanitizeUser(user);
          }
        }
      }
    } catch (e) {
      console.warn("Token parse warning on WS connection:", e.message);
    }

    // 3. Welcome handshake event
    sendToClient(
      ws,
      createEventMessage("connection_established", null, {
        authenticated: !!meta.user,
        user: meta.user || null,
        message: meta.user
          ? `Welcome ${meta.user.name}! Connected to RideX Real-Time Gateway`
          : "Connected to RideX Real-Time Gateway. Please authenticate if required."
      })
    );

    // 4. Handle incoming messages from client
    ws.on("message", (rawMessage) => {
      handleIncomingMessage(ws, rawMessage);
    });

    // 5. Clean up on disconnect
    ws.on("close", () => {
      cleanupClient(ws);
    });

    ws.on("error", (err) => {
      console.error("WS Client Error:", err.message);
      cleanupClient(ws);
    });
  });

  // Heartbeat timer to detect dropped connections
  heartbeatInterval = setInterval(() => {
    if (!wssInstance) return;
    wssInstance.clients.forEach((ws) => {
      const meta = clientMetadata.get(ws);
      if (!meta) {
        ws.terminate();
        return;
      }
      if (!meta.isAlive) {
        cleanupClient(ws);
        ws.terminate();
        return;
      }
      meta.isAlive = false;
      try {
        ws.ping();
      } catch (e) {
        cleanupClient(ws);
        ws.terminate();
      }
    });
  }, 30000);

  return wssInstance;
}

/**
 * Handle and route incoming WebSocket client messages
 */
function handleIncomingMessage(ws, rawMessage) {
  const meta = clientMetadata.get(ws);
  if (!meta) return;

  let msg;
  try {
    msg = JSON.parse(rawMessage.toString());
  } catch (err) {
    sendToClient(ws, createEventMessage("error", null, null, "Invalid JSON payload"));
    return;
  }

  const { type, rideId, payload, token } = msg;

  switch (type) {
    // 1. Handshake / Explicit Authentication
    case "authenticate": {
      const authToken = token || payload?.token;
      if (!authToken) {
        sendToClient(ws, createEventMessage("error", null, null, "Authentication token is required"));
        return;
      }
      const decoded = verifyToken(authToken);
      if (!decoded || !decoded.id) {
        sendToClient(ws, createEventMessage("error", null, null, "Invalid or expired token"));
        return;
      }
      const store = db.read();
      const user = store.users.find((u) => u.id === decoded.id);
      if (!user) {
        sendToClient(ws, createEventMessage("error", null, null, "User not found"));
        return;
      }
      meta.user = sanitizeUser(user);
      sendToClient(
        ws,
        createEventMessage("authenticated", null, {
          user: meta.user,
          message: `Authenticated successfully as ${meta.user.name} (${meta.user.role})`
        })
      );
      break;
    }

    // 2. Subscribe to specific ride events
    case "subscribe_ride": {
      if (!rideId) {
        sendToClient(ws, createEventMessage("error", null, null, "rideId is required to subscribe"));
        return;
      }

      const store = db.read();
      const ride = store.rides.find((r) => r.id === rideId);
      if (!ride) {
        sendToClient(ws, createEventMessage("error", rideId, null, "Ride not found"));
        return;
      }

      // Check authentication and authorization
      if (!meta.user) {
        sendToClient(
          ws,
          createEventMessage("error", rideId, null, "Authentication required to subscribe to ride events")
        );
        return;
      }

      const isRider = ride.riderId === meta.user.id;
      const isAssignedDriver =
        ride.driverId === meta.user.id || ride.driverId === meta.user.driverProfileId;
      const isEligibleDriver = meta.user.role === "driver" && ride.status === "BIDDING";
      const isAdmin = meta.user.role === "admin";

      if (!isRider && !isAssignedDriver && !isEligibleDriver && !isAdmin) {
        sendToClient(
          ws,
          createEventMessage("error", rideId, null, "Forbidden: you are not authorized to view this ride")
        );
        return;
      }

      // Add to subscription sets
      meta.subscriptions.add(rideId);
      if (!rideSubscribers.has(rideId)) {
        rideSubscribers.set(rideId, new Set());
      }
      rideSubscribers.get(rideId).add(ws);

      sendToClient(
        ws,
        createEventMessage("subscription_confirmed", rideId, {
          rideId,
          status: ride.status,
          role: meta.user.role,
          message: `Subscribed to real-time events for ride ${rideId}`
        })
      );
      break;
    }

    // 3. Unsubscribe from ride
    case "unsubscribe_ride": {
      if (rideId) {
        meta.subscriptions.delete(rideId);
        const subs = rideSubscribers.get(rideId);
        if (subs) {
          subs.delete(ws);
          if (subs.size === 0) rideSubscribers.delete(rideId);
        }
      }
      break;
    }

    // 4. Live Driver GPS Location update
    case "driver_location_updated": {
      if (!meta.user) {
        sendToClient(ws, createEventMessage("error", rideId, null, "Authentication required"));
        return;
      }

      if (meta.user.role !== "driver" && meta.user.role !== "admin") {
        sendToClient(
          ws,
          createEventMessage("error", rideId, null, "Forbidden: only drivers can publish location updates")
        );
        return;
      }

      if (!rideId) {
        sendToClient(ws, createEventMessage("error", null, null, "rideId is required"));
        return;
      }

      const store = db.read();
      const ride = store.rides.find((r) => r.id === rideId);
      if (!ride) {
        sendToClient(ws, createEventMessage("error", rideId, null, "Ride not found"));
        return;
      }

      // Verify driver assignment
      const isAssigned =
        ride.driverId === meta.user.id ||
        ride.driverId === meta.user.driverProfileId ||
        meta.user.role === "admin";

      if (!isAssigned) {
        sendToClient(
          ws,
          createEventMessage(
            "error",
            rideId,
            null,
            "Forbidden: you are not assigned as the driver for this ride"
          )
        );
        return;
      }

      // Validate ride is in active state
      if (ride.status === "COMPLETED" || ride.status === "CANCELLED") {
        sendToClient(
          ws,
          createEventMessage(
            "error",
            rideId,
            null,
            `Cannot update location for ride with status ${ride.status}`
          )
        );
        return;
      }

      // Validate coordinates
      const coords = payload?.coords;
      if (!Array.isArray(coords) || coords.length < 2) {
        sendToClient(
          ws,
          createEventMessage("error", rideId, null, "coords must be an array of [lat, lng]")
        );
        return;
      }

      const lat = +coords[0];
      const lng = +coords[1];
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        sendToClient(
          ws,
          createEventMessage("error", rideId, null, "Invalid GPS latitude/longitude boundaries")
        );
        return;
      }

      // Rate limit check: at most 10 updates per second per socket
      const now = Date.now();
      if (now - meta.lastLocationUpdate < 100) {
        return; // drop high-frequency telemetry spam
      }
      meta.lastLocationUpdate = now;

      // Broadcast location event to all authorized subscribers of this ride
      const locationEvent = {
        type: "driver_location_updated",
        rideId,
        payload: {
          coords: [lat, lng],
          heading: typeof payload?.heading === "number" ? payload.heading : 0,
          speedKmH: typeof payload?.speedKmH === "number" ? payload.speedKmH : 25,
          etaMins: payload?.etaMins !== undefined ? payload.etaMins : null,
          distanceRemainingKm: payload?.distanceRemainingKm !== undefined ? payload.distanceRemainingKm : null,
          driverId: meta.user.id,
          driverName: meta.user.name,
          updatedAt: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };

      broadcastToRide(rideId, locationEvent);
      break;
    }

    // 5. Ping/Pong Heartbeat
    case "ping": {
      sendToClient(ws, createEventMessage("pong", null, { reply: "pong" }));
      break;
    }

    default: {
      sendToClient(
        ws,
        createEventMessage("error", null, null, `Unknown message event type: '${type}'`)
      );
      break;
    }
  }
}

/**
 * Teardown and close all connections (for tests and server restart)
 */
function closeAllConnections() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  if (wssInstance) {
    wssInstance.clients.forEach((client) => {
      cleanupClient(client);
      client.terminate();
    });
    wssInstance.close();
    wssInstance = null;
  }
  rideSubscribers.clear();
  clientMetadata.clear();
}

module.exports = {
  initWebSocketServer,
  broadcastToRide,
  createEventMessage,
  cleanupClient,
  closeAllConnections,
  rideSubscribers,
  clientMetadata
};
