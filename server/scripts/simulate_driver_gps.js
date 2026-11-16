/**
 * RideX Driver GPS Simulator (Local Testing Utility)
 * 
 * Simulates a driver's mobile device transmitting real-time GPS telemetry
 * over WebSockets to the RideX Mobility Server.
 * 
 * Usage:
 *   node server/scripts/simulate_driver_gps.js [rideId] [driverEmail] [driverPassword]
 */

const WebSocket = require("ws");
const http = require("http");
const db = require("../db");

const WS_URL = process.env.WS_URL || "ws://localhost:5000/ws";
const API_PORT = process.env.PORT || 5000;

function loginDriver(email = "driver@ridex.com", password = "Driver@123") {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ email, password });
    const req = http.request(
      {
        hostname: "localhost",
        port: API_PORT,
        path: "/api/auth/login",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData)
        }
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            const data = JSON.parse(body);
            if (res.statusCode === 200 && data.token) {
              resolve(data);
            } else {
              reject(new Error(data.error || "Driver login failed"));
            }
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

async function startSimulator() {
  const args = process.argv.slice(2);
  let targetRideId = args[0];
  const driverEmail = args[1] || "driver@ridex.com";
  const driverPassword = args[2] || "Driver@123";

  console.log("=================================================");
  console.log("🚗 RideX Controlled Driver GPS Simulator Started");
  console.log("=================================================");

  // 1. Authenticate driver to acquire legitimate session JWT
  console.log(`[AUTH] Authenticating driver: ${driverEmail}...`);
  let authData;
  try {
    authData = await loginDriver(driverEmail, driverPassword);
    console.log(`[AUTH] Authenticated as ${authData.user.name} (${authData.user.id})`);
  } catch (err) {
    console.error(`[AUTH_ERROR] Could not log in: ${err.message}`);
    process.exit(1);
  }

  // 2. Select ride
  const store = db.read();
  let ride;
  if (targetRideId) {
    ride = store.rides.find((r) => r.id === targetRideId);
  } else {
    // Find the latest ride in ASSIGNED or IN_PROGRESS state
    ride = store.rides.find((r) => r.status === "ASSIGNED" || r.status === "IN_PROGRESS" || r.status === "BIDDING");
  }

  if (!ride) {
    console.error("[ERROR] No active or assigned ride found to simulate. Please create and accept a ride first.");
    process.exit(1);
  }

  targetRideId = ride.id;
  console.log(`[RIDE] Target Ride: #${targetRideId} (Status: ${ride.status})`);
  console.log(`[ROUTE] Pickup: ${ride.pickupAddress} ➔ Destination: ${ride.dropAddress}`);

  // Build interpolation coordinates
  const waypoints = ride.waypoints && ride.waypoints.length > 1
    ? ride.waypoints
    : [ride.pickupCoords || [12.9784, 77.6408], ride.dropCoords || [12.9352, 77.6245]];

  // 3. Connect to WebSocket Gateway with authenticated token
  const socketUrl = `${WS_URL}?token=${authData.token}`;
  console.log(`[WS] Connecting to ${WS_URL}...`);
  const ws = new WebSocket(socketUrl);

  ws.on("open", () => {
    console.log("[WS] Connected to RideX Real-Time Gateway!");

    // Subscribe to ride to receive status changes (e.g. if cancelled/completed)
    ws.send(
      JSON.stringify({
        type: "subscribe_ride",
        rideId: targetRideId
      })
    );

    let step = 0;
    const totalSteps = 20; // 20 intervals from start to finish
    const p1 = waypoints[0];
    const p2 = waypoints[waypoints.length - 1];

    console.log(`[SIMULATED_GPS_TELEMETRY] Starting transmission. Broadcasting 1 update every 1200ms...`);

    const timer = setInterval(() => {
      step++;
      const fraction = Math.min(1.0, step / totalSteps);

      // Interpolate GPS
      const currentLat = +(p1[0] + (p2[0] - p1[0]) * fraction).toFixed(6);
      const currentLng = +(p1[1] + (p2[1] - p1[1]) * fraction).toFixed(6);
      const remainingKm = +((1.0 - fraction) * (ride.distanceKm || 5.0)).toFixed(2);
      const remainingEta = Math.max(1, Math.round((1.0 - fraction) * (ride.durationMins || 15)));

      const telemetryPayload = {
        type: "driver_location_updated",
        rideId: targetRideId,
        payload: {
          coords: [currentLat, currentLng],
          heading: Math.round(fraction * 360) % 360,
          speedKmH: Math.round(25 + Math.random() * 15),
          etaMins: remainingEta,
          distanceRemainingKm: remainingKm,
          isSimulated: true,
          deviceSource: "SIMULATED_GPS_HARDWARE"
        }
      };

      ws.send(JSON.stringify(telemetryPayload));
      console.log(
        `[SIMULATED_GPS_TELEMETRY] Step ${step}/${totalSteps} -> Coords: [${currentLat}, ${currentLng}] | ETA: ${remainingEta} min | Dist: ${remainingKm} km`
      );

      if (step >= totalSteps) {
        clearInterval(timer);
        console.log("[SIMULATED_GPS_TELEMETRY] Reached destination coordinates. Simulation complete.");
        setTimeout(() => {
          ws.close();
          process.exit(0);
        }, 1000);
      }
    }, 1200);
  });

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === "ride_status_changed" && (msg.payload.status === "COMPLETED" || msg.payload.status === "CANCELLED")) {
        console.log(`[WS] Ride state changed to ${msg.payload.status}. Stopping location updates.`);
        ws.close();
        process.exit(0);
      }
    } catch (e) {}
  });

  ws.on("error", (err) => {
    console.error(`[WS_ERROR] ${err.message}`);
  });
}

if (require.main === module) {
  startSimulator();
}

module.exports = { startSimulator, loginDriver };
