const crypto = require("crypto");
const express = require("express");
const router = express.Router();
const db = require("../db");
const { authenticateToken, optionalAuth } = require("../middleware/auth");

function publicCarpool(carpool) {
  if (!carpool) return carpool;
  const { driverPhone, ...safe } = carpool;
  return safe;
}

// 1. GET /api/carpools - List carpools with filters (Public / Optional Auth)
router.get("/", optionalAuth, (req, res) => {
  const { from, to } = req.query;
  const store = db.read();
  let carpools = store.carpools || [];

  if (from) {
    const fLower = String(from).toLowerCase().trim();
    carpools = carpools.filter((c) => c.fromCity.toLowerCase().includes(fLower));
  }
  if (to) {
    const tLower = String(to).toLowerCase().trim();
    carpools = carpools.filter((c) => c.toCity.toLowerCase().includes(tLower));
  }

  res.json({ carpools: carpools.map(publicCarpool) });
});

// 2. POST /api/carpools - Publish an intercity carpool (Authenticated: driver sets own price)
router.post("/", authenticateToken, (req, res) => {
  try {
    const {
      fromCity,
      fromPoint,
      toCity,
      toPoint,
      departureTime,
      carModel,
      totalSeats = 3,
      pricePerSeat,
      features = [],
      notes = ""
    } = req.body;

    if (!fromCity || !toCity || !pricePerSeat) {
      return res.status(400).json({ error: "fromCity, toCity and pricePerSeat are required" });
    }

    const seats = Number(totalSeats);
    if (!Number.isInteger(seats) || seats < 1 || seats > 6) {
      return res.status(400).json({ error: "totalSeats must be a whole number between 1 and 6" });
    }

    const seatPrice = Number(pricePerSeat);
    if (!Number.isFinite(seatPrice) || seatPrice <= 0 || seatPrice > 100000) {
      return res.status(400).json({ error: "pricePerSeat must be a positive number below 100000" });
    }

    const cleanFeatures = Array.isArray(features)
      ? features.filter((f) => typeof f === "string").slice(0, 10).map((f) => f.slice(0, 40))
      : String(features || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 10);

    const driverId = req.user.id;
    const driverName = req.user.name;
    const driverPhone = req.user.phone;

    let newCarpoolId = null;

    const newCarpool = {
      id: null,
      driverId,
      driverName,
      driverPhone,
      driverRating: 5.0,
      driverAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      fromCity: String(fromCity).slice(0, 80),
      fromPoint: String(fromPoint || `${fromCity} Central`).slice(0, 160),
      toCity: String(toCity).slice(0, 80),
      toPoint: String(toPoint || `${toCity} Central`).slice(0, 160),
      departureTime: String(departureTime || "Tomorrow, 07:00 AM").slice(0, 80),
      carModel: String(carModel || "Standard Sedan - KA 04 MD 8821").slice(0, 120),
      totalSeats: seats,
      availableSeats: seats,
      pricePerSeat: seatPrice,
      features: cleanFeatures,
      notes: String(notes || "Leaving on time. Comfortable ride.").slice(0, 500),
      isSelfPublished: true,
      createdAt: new Date().toISOString()
    };

    db.transaction((data) => {
      if (!Array.isArray(data.carpools)) data.carpools = [];
      do {
        newCarpoolId = `CP-${crypto.randomInt(1000, 10000)}`;
      } while (data.carpools.some((c) => c.id === newCarpoolId));
      newCarpool.id = newCarpoolId;
      data.carpools.unshift(newCarpool);
    });

    res.status(201).json({ success: true, carpool: publicCarpool(newCarpool) });
  } catch (err) {
    console.error("Publish Carpool Error:", err);
    res.status(500).json({ error: "Failed to publish carpool" });
  }
});

// 3. POST /api/carpools/:id/book - Reserve seats (Authenticated: bound to passenger)
router.post("/:id/book", authenticateToken, (req, res) => {
  const { seats = 1 } = req.body;
  const passengerId = req.user.id;
  const passengerName = req.user.name;
  const passengerPhone = req.user.phone;

  let bookedCarpool = null;
  let bookingRecord = null;
  let totalCost = 0;
  let errorMsg = null;

  db.transaction((data) => {
    const cp = data.carpools.find((c) => c.id === req.params.id);
    if (!cp) {
      errorMsg = "Carpool ride not found";
      return;
    }

    const numSeats = Number(seats);
    if (!Number.isInteger(numSeats) || numSeats < 1 || numSeats > 6) {
      errorMsg = "Seats must be a whole number between 1 and 6";
      return;
    }

    if (cp.driverId === passengerId) {
      errorMsg = "You cannot book your own carpool";
      return;
    }

    if (cp.availableSeats < numSeats) {
      errorMsg = `Only ${cp.availableSeats} seat(s) remaining`;
      return;
    }

    totalCost = cp.pricePerSeat * numSeats;

    // Check user wallet
    if (!data.wallets) data.wallets = {};
    if (!Array.isArray(data.walletLedger)) data.walletLedger = [];
    if (!data.wallets[passengerId]) {
      data.wallets[passengerId] = {
        userId: passengerId,
        balance: 0.0,
        currency: "INR",
        updatedAt: new Date().toISOString()
      };
    }

    const userWallet = data.wallets[passengerId];
    if (userWallet.balance < totalCost) {
      errorMsg = `Insufficient wallet balance. Required ₹${totalCost}, but wallet balance is ₹${userWallet.balance}. Please recharge.`;
      return;
    }

    userWallet.balance = +(userWallet.balance - totalCost).toFixed(2);
    userWallet.updatedAt = new Date().toISOString();

    data.walletLedger.unshift({
      id: `tx-cp-${crypto.randomUUID()}`,
      walletId: passengerId,
      rideId: null,
      type: "DEBIT",
      amount: totalCost,
      description: `Carpool Booking: ${cp.fromCity} to ${cp.toCity} (${numSeats} seats)`,
      idempotencyKey: `cp-book-${cp.id}-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString()
    });

    cp.availableSeats -= numSeats;
    bookedCarpool = cp;

    bookingRecord = {
      bookingId: `CP-BK-${crypto.randomUUID()}`,
      carpoolId: cp.id,
      passengerId,
      seats: numSeats,
      totalCost,
      passengerName,
      passengerPhone,
      fromCity: cp.fromCity,
      toCity: cp.toCity,
      departureTime: cp.departureTime,
      createdAt: new Date().toISOString()
    };

    if (!data.carpoolBookings) data.carpoolBookings = [];
    data.carpoolBookings.unshift(bookingRecord);
  });

  if (errorMsg) {
    return res.status(400).json({ error: errorMsg });
  }

  const latestStore = db.read();
  res.json({
    success: true,
    booking: bookingRecord,
    carpool: bookedCarpool,
    wallet: latestStore.wallets?.[passengerId] || latestStore.wallet
  });
});

module.exports = router;
