const os = require("os");
const path = require("path");
const fs = require("fs");

const TEST_DB_FILE = path.join(
  os.tmpdir(),
  `ridex-auth-test-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.json`
);
process.env.RIDEX_DB_FILE = TEST_DB_FILE;
process.env.JWT_SECRET = "test-only-secret";
process.env.SIGNUP_BONUS = "100";

const request = require("supertest");
const { app } = require("../index");

afterAll(() => {
  try {
    if (fs.existsSync(TEST_DB_FILE)) fs.unlinkSync(TEST_DB_FILE);
  } catch (err) {
    // best-effort cleanup
  }
});

describe("Phase 1: RideX Auth, RBAC & Resource Ownership Test Suite", () => {
  const timestamp = Date.now();
  const passengerAData = {
    name: "Aanya Sharma",
    email: `aanya.${timestamp}@test.com`,
    phone: "+91 91234 56789",
    password: "Password@123",
    role: "rider"
  };

  const passengerBData = {
    name: "Bhavin Patel",
    email: `bhavin.${timestamp}@test.com`,
    phone: "+91 92345 67890",
    password: "Password@123",
    role: "rider"
  };

  const driverData = {
    name: "Dinesh Rao",
    email: `dinesh.${timestamp}@test.com`,
    phone: "+91 93456 78901",
    password: "Password@123",
    role: "driver",
    vehicleType: "bike",
    model: "TVS Apache RTR 160",
    plateNumber: "KA 03 EQ 4412"
  };

  let tokenPassengerA = "";
  let userPassengerA = null;
  let tokenPassengerB = "";
  let userPassengerB = null;
  let tokenDriver = "";
  let userDriver = null;

  // 1. Registration tests
  test("1. Passenger A registers successfully with hashed password (no password in response)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(passengerAData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(passengerAData.email.toLowerCase());
    expect(res.body.user.role).toBe("rider");
    // CRITICAL: password and passwordHash must NEVER be exposed
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.user.passwordHash).toBeUndefined();

    tokenPassengerA = res.body.token;
    userPassengerA = res.body.user;
  });

  test("2. Driver registers successfully and driver profile is registered", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(driverData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe("driver");
    expect(res.body.user.passwordHash).toBeUndefined();

    tokenDriver = res.body.token;
    userDriver = res.body.user;
  });

  test("3. Registering with duplicate email is rejected (409 Conflict)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(passengerAData);

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already exists/i);
  });

  // 2. Login tests
  test("4. Passenger A logs in with correct credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: passengerAData.email,
        password: passengerAData.password
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(passengerAData.email.toLowerCase());
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  test("5. Login with invalid password fails (401 Unauthorized)", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: passengerAData.email,
        password: "WrongPassword999!"
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid email or password/i);
  });

  // 3. Protected endpoint authentication checks
  test("6. Protected endpoints reject unauthenticated requests (401)", async () => {
    const meRes = await request(app).get("/api/auth/me");
    expect(meRes.status).toBe(401);

    const walletRes = await request(app).get("/api/wallet");
    expect(walletRes.status).toBe(401);

    const rideCreateRes = await request(app).post("/api/rides").send({
      pickupCoords: [12.9784, 77.6408],
      dropCoords: [12.9352, 77.6245]
    });
    expect(rideCreateRes.status).toBe(401);
  });

  test("7. GET /api/auth/me returns current user data with valid Bearer token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${tokenPassengerA}`);

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(userPassengerA.id);
    expect(res.body.wallet).toBeDefined();
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  // 4. Register Passenger B for isolation & ownership verification
  test("8. Register Passenger B for resource ownership testing", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(passengerBData);

    expect(res.status).toBe(201);
    tokenPassengerB = res.body.token;
    userPassengerB = res.body.user;
  });

  // 5. Ride creation and Ownership enforcement
  let createdRideId = "";
  let sampleBidId = "";

  test("9. Passenger A creates a ride request: bound to Passenger A identity", async () => {
    const res = await request(app)
      .post("/api/rides")
      .set("Authorization", `Bearer ${tokenPassengerA}`)
      .send({
        pickupAddress: "Indiranagar Metro Station",
        dropAddress: "MG Road Metro Station",
        pickupCoords: [12.9784, 77.6408],
        dropCoords: [12.9756, 77.6066],
        vehicleType: "bike",
        proposedFare: 50
      });

    expect(res.status).toBe(201);
    expect(res.body.ride).toBeDefined();
    expect(res.body.ride.riderId).toBe(userPassengerA.id);
    expect(res.body.bids.length).toBeGreaterThan(0);

    createdRideId = res.body.ride.id;
    sampleBidId = res.body.bids[0].bidId;
  });

  test("10. Passenger B CANNOT accept a bid on Passenger A's ride (403 Forbidden)", async () => {
    const res = await request(app)
      .post(`/api/rides/${createdRideId}/accept-bid`)
      .set("Authorization", `Bearer ${tokenPassengerB}`)
      .send({ bidId: sampleBidId });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/unauthorized/i);
  });

  test("11. Passenger A (owner) CAN accept bid on their ride", async () => {
    const res = await request(app)
      .post(`/api/rides/${createdRideId}/accept-bid`)
      .set("Authorization", `Bearer ${tokenPassengerA}`)
      .send({ bidId: sampleBidId });

    expect(res.status).toBe(200);
    expect(res.body.ride.status).toBe("ASSIGNED");
    expect(res.body.bid.status).toBe("ACCEPTED");
  });

  test("12. Passenger B CANNOT cancel Passenger A's ride (403 Forbidden)", async () => {
    const res = await request(app)
      .post(`/api/rides/${createdRideId}/cancel`)
      .set("Authorization", `Bearer ${tokenPassengerB}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/unauthorized/i);
  });

  test("13. Passenger A (owner) CAN cancel their own ride", async () => {
    const res = await request(app)
      .post(`/api/rides/${createdRideId}/cancel`)
      .set("Authorization", `Bearer ${tokenPassengerA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify ride is now CANCELLED
    const rideRes = await request(app)
      .get(`/api/rides/${createdRideId}`)
      .set("Authorization", `Bearer ${tokenPassengerA}`);
    expect(rideRes.body.ride.status).toBe("CANCELLED");
  });

  // 6. Wallet isolation and authorized simulated top-up
  test("14. Passenger A tops up wallet: credited strictly to Passenger A", async () => {
    const res = await request(app)
      .post("/api/wallet/topup")
      .set("Authorization", `Bearer ${tokenPassengerA}`)
      .send({ amount: 200 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.wallet.balance).toBeGreaterThanOrEqual(200);
    expect(res.body.entry.isSimulated).toBe(true);

    // Verify Passenger B's wallet is not affected
    const walletBRes = await request(app)
      .get("/api/wallet")
      .set("Authorization", `Bearer ${tokenPassengerB}`);

    expect(walletBRes.body.wallet.userId).toBe(userPassengerB.id);
    expect(walletBRes.body.wallet.balance).toBe(100.0); // Initial signup bonus only
  });
});
