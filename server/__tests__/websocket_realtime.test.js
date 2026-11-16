const os = require("os");
const path = require("path");
const fs = require("fs");

const TEST_DB_FILE = path.join(
  os.tmpdir(),
  `ridex-ws-test-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.json`
);
process.env.RIDEX_DB_FILE = TEST_DB_FILE;
process.env.JWT_SECRET = "test-only-secret";

const WebSocket = require("ws");
const http = require("http");
const request = require("supertest");
const { app } = require("../index");
const { initWebSocketServer, closeAllConnections, rideSubscribers } = require("../services/websocket");
const { generateToken } = require("../utils/auth");
const db = require("../db");

describe("Phase 2: RideX Real-Time WebSocket Integration Test Suite", () => {
  let server;
  let serverPort;
  let wsUrl;

  const timestamp = Date.now();
  const riderUser = {
    id: `usr-ws-rider-${timestamp}`,
    name: "Rider Test",
    email: `rider.ws.${timestamp}@test.com`,
    role: "rider",
    phone: "+91 99999 11111"
  };

  const driverUser = {
    id: `drv-ws-${timestamp}`,
    name: "Driver Test",
    email: `driver.ws.${timestamp}@test.com`,
    role: "driver",
    phone: "+91 99999 22222",
    driverProfileId: `drv-ws-${timestamp}`
  };

  const bystanderUser = {
    id: `usr-ws-bystander-${timestamp}`,
    name: "Bystander Rider",
    email: `bystander.ws.${timestamp}@test.com`,
    role: "rider",
    phone: "+91 99999 33333"
  };

  const imposterDriver = {
    id: `drv-ws-imposter-${timestamp}`,
    name: "Imposter Driver",
    email: `imposter.ws.${timestamp}@test.com`,
    role: "driver",
    phone: "+91 99999 44444"
  };

  let riderToken;
  let driverToken;
  let bystanderToken;
  let imposterDriverToken;
  let testRideId;

  beforeAll((done) => {
    // Generate test tokens
    riderToken = generateToken({ id: riderUser.id, email: riderUser.email, role: riderUser.role, name: riderUser.name });
    driverToken = generateToken({ id: driverUser.id, email: driverUser.email, role: driverUser.role, name: driverUser.name });
    bystanderToken = generateToken({ id: bystanderUser.id, email: bystanderUser.email, role: bystanderUser.role, name: bystanderUser.name });
    imposterDriverToken = generateToken({ id: imposterDriver.id, email: imposterDriver.email, role: imposterDriver.role, name: imposterDriver.name });

    // Seed test users & active ride into database
    testRideId = `RAP-WS-${timestamp}`;
    db.transaction((data) => {
      data.users.push(riderUser, driverUser, bystanderUser, imposterDriver);
      data.rides.unshift({
        id: testRideId,
        riderId: riderUser.id,
        driverId: driverUser.id,
        driverName: driverUser.name,
        service: "Bike Taxi",
        vehicleType: "bike",
        pickupAddress: "Indiranagar",
        dropAddress: "Koramangala",
        pickupCoords: [12.9784, 77.6408],
        dropCoords: [12.9352, 77.6245],
        distanceKm: 5.5,
        durationMins: 15,
        fare: 65,
        agreedFare: 65,
        status: "ASSIGNED",
        paymentMethod: "wallet",
        rideOtp: "9876",
        createdAt: new Date().toISOString()
      });
    });

    // Start dedicated test HTTP + WS server on an ephemeral free port
    server = http.createServer(app);
    initWebSocketServer(server, true);
    server.listen(0, () => {
      serverPort = server.address().port;
      wsUrl = `ws://localhost:${serverPort}/ws`;
      done();
    });
  });

  afterAll((done) => {
    closeAllConnections();
    server.close(() => {
      try {
        if (fs.existsSync(TEST_DB_FILE)) fs.unlinkSync(TEST_DB_FILE);
      } catch (err) {
        // best-effort cleanup
      }
      done();
    });
  });

  // Reliable helper that buffers messages from socket creation
  function createClient(token = null) {
    const url = token ? `${wsUrl}?token=${encodeURIComponent(token)}` : wsUrl;
    const ws = new WebSocket(url);
    const messageBuffer = [];

    ws.on("message", (raw) => {
      try {
        messageBuffer.push(JSON.parse(raw.toString()));
      } catch (e) {}
    });

    const getNextMessage = (predicate = () => true, timeoutMs = 4000) => {
      return new Promise((resolve, reject) => {
        // Check buffer first
        const existingIdx = messageBuffer.findIndex(predicate);
        if (existingIdx !== -1) {
          const [found] = messageBuffer.splice(existingIdx, 1);
          return resolve(found);
        }

        const timer = setTimeout(() => {
          ws.off("message", listener);
          reject(new Error("Timeout waiting for WebSocket message"));
        }, timeoutMs);

        const listener = (raw) => {
          try {
            const parsed = JSON.parse(raw.toString());
            if (predicate(parsed)) {
              clearTimeout(timer);
              ws.off("message", listener);
              const idx = messageBuffer.indexOf(parsed);
              if (idx !== -1) messageBuffer.splice(idx, 1);
              resolve(parsed);
            }
          } catch (e) {}
        };

        ws.on("message", listener);
      });
    };

    return new Promise((resolve, reject) => {
      ws.on("open", () => resolve({ ws, getNextMessage }));
      ws.on("error", reject);
    });
  }

  // 1. Connection & Welcome Handshake
  test("1. Connect to WebSocket server receives connection_established event", async () => {
    const { ws, getNextMessage } = await createClient(riderToken);
    const welcomeMsg = await getNextMessage((m) => m.type === "connection_established");

    expect(welcomeMsg.type).toBe("connection_established");
    expect(welcomeMsg.payload.authenticated).toBe(true);
    expect(welcomeMsg.payload.user.id).toBe(riderUser.id);
    ws.close();
  });

  // 2. Unauthenticated Subscription Rejection
  test("2. Unauthenticated socket attempting subscribe_ride is rejected with error", async () => {
    const { ws, getNextMessage } = await createClient(null); // No token
    await getNextMessage((m) => m.type === "connection_established");

    ws.send(JSON.stringify({ type: "subscribe_ride", rideId: testRideId }));

    const res = await getNextMessage((m) => m.type === "error");
    expect(res.type).toBe("error");
    expect(res.error).toMatch(/Authentication required/i);
    ws.close();
  });

  // 3. Unauthorized Private Ride Subscription
  test("3. Bystander rider cannot subscribe to another user's private ride (403 Forbidden)", async () => {
    const { ws, getNextMessage } = await createClient(bystanderToken);
    await getNextMessage((m) => m.type === "connection_established");

    ws.send(JSON.stringify({ type: "subscribe_ride", rideId: testRideId }));

    const res = await getNextMessage((m) => m.type === "error");
    expect(res.type).toBe("error");
    expect(res.error).toMatch(/Forbidden/i);
    ws.close();
  });

  // 4. Authorized Ride Subscription
  test("4. Ride owner (Rider) successfully subscribes to their own ride", async () => {
    const { ws, getNextMessage } = await createClient(riderToken);
    await getNextMessage((m) => m.type === "connection_established");

    ws.send(JSON.stringify({ type: "subscribe_ride", rideId: testRideId }));

    const res = await getNextMessage((m) => m.type === "subscription_confirmed");
    expect(res.type).toBe("subscription_confirmed");
    expect(res.rideId).toBe(testRideId);
    expect(res.payload.status).toBe("ASSIGNED");
    ws.close();
  });

  // 5. Driver Location Validation & Spoofing Protection
  test("5. Imposter driver cannot publish GPS updates for a ride they are not assigned to", async () => {
    const { ws, getNextMessage } = await createClient(imposterDriverToken);
    await getNextMessage((m) => m.type === "connection_established");

    ws.send(
      JSON.stringify({
        type: "driver_location_updated",
        rideId: testRideId,
        payload: { coords: [12.9785, 77.6409], speedKmH: 30 }
      })
    );

    const res = await getNextMessage((m) => m.type === "error");
    expect(res.type).toBe("error");
    expect(res.error).toMatch(/not assigned as the driver/i);
    ws.close();
  });

  test("6. Assigned driver sending invalid GPS coordinates is rejected", async () => {
    const { ws, getNextMessage } = await createClient(driverToken);
    await getNextMessage((m) => m.type === "connection_established");

    ws.send(
      JSON.stringify({
        type: "driver_location_updated",
        rideId: testRideId,
        payload: { coords: [999.99, 77.6409] } // Out of range latitude
      })
    );

    const res = await getNextMessage((m) => m.type === "error");
    expect(res.type).toBe("error");
    expect(res.error).toMatch(/latitude\/longitude boundaries/i);
    ws.close();
  });

  // 7. End-to-End Real-Time GPS Delivery
  test("7. Assigned driver sends GPS update -> delivered live to subscribed passenger map", async () => {
    // Connect Passenger socket and subscribe to ride
    const passenger = await createClient(riderToken);
    await passenger.getNextMessage((m) => m.type === "connection_established");
    passenger.ws.send(JSON.stringify({ type: "subscribe_ride", rideId: testRideId }));
    await passenger.getNextMessage((m) => m.type === "subscription_confirmed");

    // Connect Driver socket
    const driver = await createClient(driverToken);
    await driver.getNextMessage((m) => m.type === "connection_established");

    // Send Driver GPS update
    const targetCoords = [12.9784, 77.6408];
    driver.ws.send(
      JSON.stringify({
        type: "driver_location_updated",
        rideId: testRideId,
        payload: {
          coords: targetCoords,
          heading: 90,
          speedKmH: 42,
          etaMins: 3,
          distanceRemainingKm: 1.1
        }
      })
    );

    // Passenger receives live event
    const passengerReceived = await passenger.getNextMessage((m) => m.type === "driver_location_updated");

    expect(passengerReceived.type).toBe("driver_location_updated");
    expect(passengerReceived.rideId).toBe(testRideId);
    expect(passengerReceived.payload.coords).toEqual(targetCoords);
    expect(passengerReceived.payload.speedKmH).toBe(42);
    expect(passengerReceived.payload.etaMins).toBe(3);
    expect(passengerReceived.payload.driverId).toBe(driverUser.id);

    passenger.ws.close();
    driver.ws.close();
  });

  // 8. Real-time Bidding & REST Integration
  test("8. Bid acceptance via REST broadcasts bid_accepted to WebSocket subscribers", async () => {
    // Create new ride for bidding test
    const newRideRes = await request(app)
      .post("/api/rides")
      .set("Authorization", `Bearer ${riderToken}`)
      .send({
        pickupCoords: [12.9784, 77.6408],
        dropCoords: [12.9352, 77.6245],
        vehicleType: "bike",
        proposedFare: 60
      });

    expect(newRideRes.status).toBe(201);
    const biddingRideId = newRideRes.body.ride.id;
    const bidToAccept = newRideRes.body.bids[0];

    // Connect passenger and subscribe
    const passenger = await createClient(riderToken);
    await passenger.getNextMessage((m) => m.type === "connection_established");
    passenger.ws.send(JSON.stringify({ type: "subscribe_ride", rideId: biddingRideId }));
    await passenger.getNextMessage((m) => m.type === "subscription_confirmed");

    // Accept bid via REST
    const acceptRes = await request(app)
      .post(`/api/rides/${biddingRideId}/accept-bid`)
      .set("Authorization", `Bearer ${riderToken}`)
      .send({ bidId: bidToAccept.bidId });

    expect(acceptRes.status).toBe(200);

    // Passenger receives bid_accepted event over WebSocket
    const wsEvent = await passenger.getNextMessage((m) => m.type === "bid_accepted");

    expect(wsEvent.type).toBe("bid_accepted");
    expect(wsEvent.rideId).toBe(biddingRideId);
    expect(wsEvent.payload.ride.status).toBe("ASSIGNED");

    passenger.ws.close();
  });

  // 9. Disconnect cleanup
  test("9. Disconnecting client is cleanly removed from ride subscriber pool", async () => {
    const { ws, getNextMessage } = await createClient(riderToken);
    await getNextMessage((m) => m.type === "connection_established");
    ws.send(JSON.stringify({ type: "subscribe_ride", rideId: testRideId }));
    await getNextMessage((m) => m.type === "subscription_confirmed");

    expect(rideSubscribers.get(testRideId).size).toBeGreaterThan(0);

    ws.close();
    // Allow brief event loop cycle for close event
    await new Promise((resolve) => setTimeout(resolve, 50));

    const currentSubs = rideSubscribers.get(testRideId);
    expect(!currentSubs || !currentSubs.has(ws)).toBe(true);
  });
});
