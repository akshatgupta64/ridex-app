import { getAuthToken } from "./api";

// Connection States
export const WS_STATUS = {
  CONNECTING: "CONNECTING",
  CONNECTED: "CONNECTED",
  RECONNECTING: "RECONNECTING",
  DISCONNECTED: "DISCONNECTED"
};

class RideXWebSocketClient {
  constructor() {
    this.ws = null;
    this.status = WS_STATUS.DISCONNECTED;
    this.listeners = new Map(); // eventType -> Set<callback>
    this.statusListeners = new Set();
    this.activeSubscriptions = new Set(); // Set<rideId>
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.baseDelay = 1000;
    this.reconnectTimer = null;
    this.forcedClose = false;
  }

  getWsUrl() {
    const explicit = process.env.REACT_APP_WS_URL;
    if (explicit) {
      return explicit;
    }

    const isHttps = window.location.protocol === "https:";
    const protocol = isHttps ? "wss:" : "ws:";

    if (process.env.NODE_ENV === "production") {
      return `${protocol}//${window.location.host}/ws`;
    }

    const host = window.location.hostname || "localhost";
    return `${protocol}//${host}:5001/ws`;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.forcedClose = false;
    this.setStatus(this.reconnectAttempts > 0 ? WS_STATUS.RECONNECTING : WS_STATUS.CONNECTING);

    try {
      const url = this.getWsUrl();
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.setStatus(WS_STATUS.CONNECTED);

        // Authenticate immediately if token exists and was not passed in url
        const token = getAuthToken();
        if (token) {
          this.send("authenticate", null, { token });
        }

        // Resubscribe to any active rides
        this.activeSubscriptions.forEach((rideId) => {
          this.send("subscribe_ride", rideId);
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.dispatch(msg.type, msg);
          if (msg.rideId) {
            this.dispatch(`${msg.type}:${msg.rideId}`, msg);
          }
        } catch (e) {
          console.error("WS Parse error on client:", e);
        }
      };

      this.ws.onclose = () => {
        this.setStatus(WS_STATUS.DISCONNECTED);
        if (!this.forcedClose) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (err) => {
        console.warn("WebSocket connection warning:", err);
        if (this.ws) this.ws.close();
      };
    } catch (err) {
      console.error("WebSocket init error:", err);
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn("Max WebSocket reconnect attempts reached.");
      return;
    }

    const delay = Math.min(10000, this.baseDelay * Math.pow(1.5, this.reconnectAttempts));
    this.reconnectAttempts++;
    this.setStatus(WS_STATUS.RECONNECTING);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  setStatus(newStatus) {
    this.status = newStatus;
    this.statusListeners.forEach((cb) => {
      try {
        cb(newStatus);
      } catch (e) {}
    });
  }

  onStatusChange(cb) {
    this.statusListeners.add(cb);
    cb(this.status);
    return () => this.statusListeners.delete(cb);
  }

  send(type, rideId = null, payload = {}) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    const token = getAuthToken();
    const message = JSON.stringify({
      type,
      rideId,
      payload,
      token,
      timestamp: new Date().toISOString()
    });
    this.ws.send(message);
    return true;
  }

  subscribeRide(rideId) {
    if (!rideId) return;
    this.activeSubscriptions.add(rideId);
    this.send("subscribe_ride", rideId);
  }

  unsubscribeRide(rideId) {
    if (!rideId) return;
    this.activeSubscriptions.delete(rideId);
    this.send("unsubscribe_ride", rideId);
  }

  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);
    return () => {
      const set = this.listeners.get(eventType);
      if (set) set.delete(callback);
    };
  }

  dispatch(eventType, data) {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`Error in WS event listener for ${eventType}:`, e);
        }
      });
    }
  }

  disconnect() {
    this.forcedClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.activeSubscriptions.clear();
    this.setStatus(WS_STATUS.DISCONNECTED);
  }
}

const socketClient = new RideXWebSocketClient();

export default socketClient;
