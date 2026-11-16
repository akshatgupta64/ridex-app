const path = require("path");
const request = require("supertest");
const { app } = require("../index");
const db = require("../db");

describe("Phase 3: RideX Relational Database, Models & Bidding Tests", () => {
  let riderToken;
  let driverToken;
  let testRideId;

  beforeAll(async () => {
    // 1. Register rider
    const riderRes = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test Rider DB",
        email: `rider.db.${Date.now()}@example.com`,
        phone: "+91 99999 11111",
        password: "Password@123",
        role: "rider"
      });
    expect(riderRes.status).toBe(201);
    riderToken = riderRes.body.token;

    // 2. Register driver
    const driverRes = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test Driver DB",
        email: `driver.db.${Date.now()}@example.com`,
        phone: "+91 99999 22222",
        password: "Password@123",
        role: "driver",
        vehicleType: "bike",
        model: "Bajaj Pulsar 200",
        plateNumber: "KA 01 DB 9999"
      });
    expect(driverRes.status).toBe(201);
    driverToken = driverRes.body.token;
  });

  test("1. GET /api/database/status returns connected SQL engine and table statistics", async () => {
    const res = await request(app).get("/api/database/status");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe("CONNECTED");
    expect(res.body.engine).toBeDefined();
    expect(res.body.tables).toBeDefined();
    expect(res.body.tables.users).toBeGreaterThan(0);
    expect(res.body.tables.drivers).toBeGreaterThan(0);
  });

  test("2. Raw SQL query via db.query executes and reads from relational tables", async () => {
    const rows = await db.query("SELECT id, name, role, email FROM users LIMIT 5");
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].id).toBeDefined();
    expect(rows[0].role).toBeDefined();
  });

  test("3. Models: Wallet double-entry ledger & idempotency protection", async () => {
    const userId = "usr-01";
    const idempotencyKey = `test-idem-${Date.now()}`;

    // Credit 200
    const credit1 = await db.models.Wallet.credit(userId, 200, "Bonus Test", idempotencyKey);
    expect(credit1.duplicate).toBe(false);

    // Duplicate credit with same idempotency key must be ignored
    const credit2 = await db.models.Wallet.credit(userId, 200, "Bonus Test", idempotencyKey);
    expect(credit2.duplicate).toBe(true);

    // Ledger check
    const ledger = await db.models.Wallet.getLedger(userId);
    const found = ledger.find((e) => e.idempotencyKey === idempotencyKey);
    expect(found).toBeDefined();
    expect(found.amount).toBe(200);
  });

  test("4. Models: Carpool search and atomic seat booking", async () => {
    const carpools = await db.models.Carpool.findAll("Bengaluru", "Mysuru");
    expect(Array.isArray(carpools)).toBe(true);

    if (carpools.length > 0) {
      const target = carpools[0];
      const initialSeats = target.availableSeats;
      if (initialSeats > 0) {
        const booked = await db.models.Carpool.bookSeats(target.id, {
          riderId: "usr-01",
          riderName: "Rahul Verma",
          riderPhone: "+91 98765 00001",
          seats: 1
        });
        expect(booked.seats).toBe(1);
        expect(booked.carpool.availableSeats).toBe(initialSeats - 1);
      }
    }
  });

  test("5. Driver submits counter-bid via POST /api/rides/:id/bid", async () => {
    // Rider creates ride
    const rideRes = await request(app)
      .post("/api/rides")
      .set("Authorization", `Bearer ${riderToken}`)
      .send({
        pickupCoords: [12.9784, 77.6408],
        dropCoords: [12.9352, 77.6245],
        vehicleType: "bike",
        proposedFare: 75
      });
    expect(rideRes.status).toBe(201);
    testRideId = rideRes.body.ride.id;

    // Driver submits counter-bid of ₹85
    const bidRes = await request(app)
      .post(`/api/rides/${testRideId}/bid`)
      .set("Authorization", `Bearer ${driverToken}`)
      .send({
        driverPrice: 85,
        etaMins: 4,
        message: "Available immediately with helmet"
      });

    expect(bidRes.status).toBe(201);
    expect(bidRes.body.success).toBe(true);
    expect(bidRes.body.bid.driverPrice).toBe(85);
    expect(bidRes.body.bid.status).toBe("PENDING");

    // Rider views ride and sees the driver's new bid
    const viewRes = await request(app)
      .get(`/api/rides/${testRideId}`)
      .set("Authorization", `Bearer ${riderToken}`);

    expect(viewRes.status).toBe(200);
    const driverBid = viewRes.body.bids.find((b) => b.bidId === bidRes.body.bid.bidId);
    expect(driverBid).toBeDefined();
    expect(driverBid.driverPrice).toBe(85);
  });
});
