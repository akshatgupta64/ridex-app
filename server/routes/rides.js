const crypto = require("crypto");
const express = require("express");
const router = express.Router();
const db = require("../db");
const { getRoadRoute } = require("../services/routing");
const { authenticateToken } = require("../middleware/auth");
const { broadcastToRide } = require("../services/websocket");

const VEHICLE_TYPES = ["bike", "auto", "cab_economy", "parcel"];
const PAYMENT_METHODS = ["wallet", "cash", "upi"];

function isValidCoords(value) {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    Number.isFinite(Number(value[0])) &&
    Number.isFinite(Number(value[1])) &&
    Math.abs(Number(value[0])) <= 90 &&
    Math.abs(Number(value[1])) <= 180
  );
}

function normalizeCoords(value) {
  return [Number(value[0]), Number(value[1])];
}

function generateUniqueRideId(data) {
  let id;
  do {
    id = `RAP-${crypto.randomInt(10000, 100000)}`;
  } while (data.rides.some((ride) => ride.id === id));
  return id;
}

function generateOtp() {
  return crypto.randomInt(1000, 10000).toString();
}

// Base fare calculation rules
const VEHICLE_PRICING = {
  bike: { baseFare: 25, perKm: 9, baseKm: 1.5, name: "Bike Taxi" },
  auto: { baseFare: 35, perKm: 14, baseKm: 1.5, name: "Rapido Auto" },
  cab_economy: { baseFare: 70, perKm: 18, baseKm: 2.0, name: "Cab Economy" },
  parcel: { baseFare: 30, perKm: 11, baseKm: 1.5, name: "Rapido Parcel" }
};

function calculateSystemFare(vehicleType, distanceKm) {
  const p = VEHICLE_PRICING[vehicleType] || VEHICLE_PRICING.bike;
  const extraDist = Math.max(0, distanceKm - p.baseKm);
  return Math.round(p.baseFare + extraDist * p.perKm);
}

// 1. POST /api/rides - Create a new ride request (Protected: binds to authenticated rider)
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      pickupAddress,
      dropAddress,
      pickupCoords,
      dropCoords,
      vehicleType = "bike",
      proposedFare,
      paymentMethod = "wallet",
      parcelDetails
    } = req.body;

    if (!isValidCoords(pickupCoords) || !isValidCoords(dropCoords)) {
      return res.status(400).json({
        error: "pickupCoords and dropCoords must be valid [latitude, longitude] pairs"
      });
    }

    if (!VEHICLE_TYPES.includes(vehicleType)) {
      return res.status(400).json({ error: `vehicleType must be one of: ${VEHICLE_TYPES.join(", ")}` });
    }

    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ error: `paymentMethod must be one of: ${PAYMENT_METHODS.join(", ")}` });
    }

    let requestedFare = null;
    if (proposedFare !== undefined && proposedFare !== null && proposedFare !== "") {
      requestedFare = Number(proposedFare);
      if (!Number.isFinite(requestedFare) || requestedFare <= 0 || requestedFare > 10000) {
        return res.status(400).json({ error: "proposedFare must be a positive number below 10000" });
      }
    }

    const normalizedPickup = normalizeCoords(pickupCoords);
    const normalizedDrop = normalizeCoords(dropCoords);

    // Real road route calculation
    const routeData = await getRoadRoute(normalizedPickup, normalizedDrop);
    const recommendedFare = calculateSystemFare(vehicleType, routeData.distanceKm);
    const offerFare = requestedFare ? Math.round(requestedFare) : recommendedFare;

    // Authenticated rider identity
    const riderId = req.user.id;
    const riderName = req.user.name;
    const riderPhone = req.user.phone;

    const ride = {
      id: null,
      riderId,
      riderName,
      riderPhone,
      driverId: null,
      service: VEHICLE_PRICING[vehicleType]?.name || "Bike Taxi",
      vehicleType,
      pickupAddress: (pickupAddress || "Selected Pickup Location").slice(0, 200),
      dropAddress: (dropAddress || "Selected Destination").slice(0, 200),
      pickupCoords: normalizedPickup,
      dropCoords: normalizedDrop,
      distanceKm: routeData.distanceKm,
      durationMins: routeData.durationMins,
      waypoints: routeData.waypoints,
      recommendedFare,
      initialOfferFare: offerFare,
      agreedFare: offerFare,
      status: "BIDDING",
      paymentMethod,
      rideOtp: generateOtp(),
      parcelDetails: vehicleType === "parcel" ? parcelDetails : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let newRideId = null;

    // Save to DB and generate initial driver bids
    db.transaction((data) => {
      newRideId = generateUniqueRideId(data);
      ride.id = newRideId;
      data.rides.unshift(ride);

      // Create initial competing bids from available drivers
      const eligibleDrivers = (data.drivers || []).filter(
        (d) => d.status === "ONLINE" && (d.vehicleType === vehicleType || vehicleType === "parcel")
      );

      const driversToBid = eligibleDrivers.length > 0 ? eligibleDrivers : (data.drivers || []).slice(0, 3);

      driversToBid.forEach((driver, idx) => {
        let bidPrice = offerFare;
        let msg = "Accepts your offer! 2 mins away";

        if (idx === 1) {
          bidPrice = offerFare + 10;
          msg = "Driver counter-offer (+₹10 for 5-star priority ride)";
        } else if (idx === 2) {
          bidPrice = Math.max(20, offerFare - 5);
          msg = "Special discount bid! Nearby on Jupiter";
        }

        data.bids.push({
          bidId: `BID-${crypto.randomUUID()}`,
          rideId: newRideId,
          driverId: driver.id,
          driverName: driver.name,
          driverRating: driver.rating,
          driverTrips: driver.trips,
          driverVehicle: driver.model,
          driverPlate: driver.plateNumber,
          driverAvatar: driver.avatar,
          driverPrice: bidPrice,
          etaMins: 2 + idx,
          distanceKm: +(0.5 + idx * 0.4).toFixed(1),
          status: "PENDING",
          message: msg,
          createdAt: new Date().toISOString()
        });
      });
    });

    const store = db.read();
    const bids = store.bids.filter((b) => b.rideId === newRideId);

    // Broadcast new ride status & driver bids to WebSocket subscribers
    broadcastToRide(newRideId, {
      type: "ride_status_changed",
      rideId: newRideId,
      payload: { status: "BIDDING", ride },
      timestamp: new Date().toISOString()
    });

    bids.forEach((bid) => {
      broadcastToRide(newRideId, {
        type: "bid_created",
        rideId: newRideId,
        payload: { bid },
        timestamp: new Date().toISOString()
      });
    });

    res.status(201).json({
      success: true,
      ride,
      bids
    });
  } catch (err) {
    console.error("Create Ride Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 2. GET /api/rides/:id - Get ride details and its bids (owner, assigned driver, or admin only)
router.get("/:id", authenticateToken, (req, res) => {
  const store = db.read();
  const ride = store.rides.find((r) => r.id === req.params.id);
  if (!ride) {
    return res.status(404).json({ error: "Ride not found" });
  }

  const isRider = ride.riderId === req.user.id;
  const isDriver = ride.driverId === req.user.id || ride.driverId === req.user.driverProfileId;
  const isAdmin = req.user.role === "admin";

  if (!isRider && !isDriver && !isAdmin) {
    return res.status(403).json({ error: "Unauthorized: you do not have access to this ride" });
  }

  const bids = store.bids.filter((b) => b.rideId === req.params.id);
  res.json({ ride, bids });
});

// 3. GET /api/rides - Get ride history (scoped to the authenticated user)
router.get("/", authenticateToken, (req, res) => {
  const store = db.read();
  let rides = store.rides;

  if (req.user.role === "rider") {
    rides = rides.filter((r) => r.riderId === req.user.id);
  } else if (req.user.role === "driver") {
    rides = rides.filter((r) => r.driverId === req.user.id || r.driverId === req.user.driverProfileId);
  } else if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: unknown role" });
  }

  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 200);
  const sorted = [...rides].sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );

  res.json({ rides: sorted.slice(0, limit) });
});

// 3.1 POST /api/rides/:id/bid - Driver submits a bid/counter-offer
router.post("/:id/bid", authenticateToken, (req, res) => {
  if (req.user.role !== "driver" && req.user.role !== "admin") {
    return res.status(403).json({ error: "Only registered drivers can submit bids" });
  }

  const { driverPrice, etaMins = 3, message = "Driver counter-bid" } = req.body;
  const price = Number(driverPrice);
  if (!Number.isFinite(price) || price <= 0 || price > 10000) {
    return res.status(400).json({ error: "driverPrice must be a positive number below 10000" });
  }

  const store = db.read();
  const ride = store.rides.find((r) => r.id === req.params.id);
  if (!ride) {
    return res.status(404).json({ error: "Ride not found" });
  }
  if (ride.status !== "BIDDING") {
    return res.status(409).json({ error: "Ride is no longer open for bidding" });
  }

  const driverProfile = (store.drivers || []).find(
    (d) => d.id === req.user.id || d.id === req.user.driverProfileId || d.userId === req.user.id
  ) || {
    id: req.user.id,
    name: req.user.name,
    rating: 4.9,
    trips: 120,
    model: "Standard Vehicle",
    plateNumber: "KA 01 XX 0000",
    avatar: null
  };

  const newBid = {
    bidId: `BID-${crypto.randomUUID()}`,
    rideId: ride.id,
    driverId: driverProfile.id,
    driverName: driverProfile.name,
    driverRating: driverProfile.rating || 4.9,
    driverTrips: driverProfile.trips || 50,
    driverVehicle: driverProfile.model,
    driverPlate: driverProfile.plateNumber,
    driverAvatar: driverProfile.avatar,
    driverPrice: Math.round(price),
    etaMins: Number(etaMins) || 3,
    distanceKm: 0.8,
    status: "PENDING",
    message: String(message || "Driver counter-offer").slice(0, 150),
    createdAt: new Date().toISOString()
  };

  db.transaction((data) => {
    data.bids.push(newBid);
  });

  broadcastToRide(ride.id, {
    type: "bid_created",
    rideId: ride.id,
    payload: { bid: newBid },
    timestamp: new Date().toISOString()
  });

  res.status(201).json({ success: true, bid: newBid });
});

// 4. POST /api/rides/:id/accept-bid - Atomically accept a bid (Ownership: only the ride owner can accept)
router.post("/:id/accept-bid", authenticateToken, (req, res) => {
  const { bidId } = req.body;
  if (!bidId) {
    return res.status(400).json({ error: "bidId is required" });
  }

  const store = db.read();
  const targetRide = store.rides.find((r) => r.id === req.params.id);
  if (!targetRide) {
    return res.status(404).json({ error: "Ride not found" });
  }

  // Ownership Check: Only the rider who created the ride can accept bids
  if (targetRide.riderId !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({
      error: "Unauthorized: only the rider who requested this ride can accept bids"
    });
  }

  let updatedRide = null;
  let acceptedBid = null;

  db.transaction((data) => {
    const ride = data.rides.find((r) => r.id === req.params.id);
    if (!ride) return;

    const bid = data.bids.find((b) => b.bidId === bidId && b.rideId === req.params.id);
    if (!bid) return;

    // Mutex check: only accept if ride is in BIDDING status
    if (ride.status !== "BIDDING") {
      return;
    }

    acceptedBid = bid;
    bid.status = "ACCEPTED";

    // Expire other bids
    data.bids
      .filter((b) => b.rideId === req.params.id && b.bidId !== bidId)
      .forEach((b) => (b.status = "EXPIRED"));

    ride.status = "ASSIGNED";
    ride.driverId = bid.driverId;
    ride.driverName = bid.driverName;
    ride.driverRating = bid.driverRating;
    ride.driverVehicle = bid.driverVehicle;
    ride.driverPlate = bid.driverPlate;
    ride.driverAvatar = bid.driverAvatar;
    ride.agreedFare = bid.driverPrice;
    ride.updatedAt = new Date().toISOString();

    updatedRide = ride;
  });

  if (!updatedRide) {
    return res.status(409).json({ error: "Ride cannot be claimed or is already assigned" });
  }

  // Real-time broadcast: Bid accepted and driver assigned
  broadcastToRide(req.params.id, {
    type: "bid_accepted",
    rideId: req.params.id,
    payload: { ride: updatedRide, bid: acceptedBid },
    timestamp: new Date().toISOString()
  });

  broadcastToRide(req.params.id, {
    type: "ride_status_changed",
    rideId: req.params.id,
    payload: { status: "ASSIGNED", ride: updatedRide },
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, ride: updatedRide, bid: acceptedBid });
});

// 5. POST /api/rides/:id/start - Verify OTP and start ride (Ownership: assigned driver or rider)
router.post("/:id/start", authenticateToken, (req, res) => {
  const { otp } = req.body;

  const store = db.read();
  const targetRide = store.rides.find((r) => r.id === req.params.id);
  if (!targetRide) {
    return res.status(404).json({ error: "Ride not found" });
  }

  // Ownership check
  const isDriver = targetRide.driverId === req.user.id || targetRide.driverId === req.user.driverProfileId;
  const isRider = targetRide.riderId === req.user.id;
  const isAdmin = req.user.role === "admin";

  if (!isDriver && !isRider && !isAdmin) {
    return res.status(403).json({
      error: "Unauthorized: only the assigned driver or passenger can start this ride"
    });
  }

  if (!otp || String(otp).trim().length === 0) {
    return res.status(400).json({ error: "Security OTP is required to start the ride" });
  }

  let updatedRide = null;
  let errorMsg = null;
  let errorStatus = 400;

  db.transaction((data) => {
    const ride = data.rides.find((r) => r.id === req.params.id);
    if (!ride) {
      errorMsg = "Ride not found";
      errorStatus = 404;
      return;
    }

    if (ride.status !== "ASSIGNED" && ride.status !== "ARRIVED") {
      errorMsg = `Ride cannot be started from status ${ride.status}`;
      errorStatus = 409;
      return;
    }

    if (String(otp).trim() !== ride.rideOtp) {
      errorMsg = "Invalid Security OTP";
      errorStatus = 400;
      return;
    }

    ride.status = "IN_PROGRESS";
    ride.startedAt = new Date().toISOString();
    ride.updatedAt = new Date().toISOString();
    updatedRide = ride;
  });

  if (errorMsg) {
    return res.status(errorStatus).json({ error: errorMsg });
  }

  // Real-time broadcast: Ride started
  broadcastToRide(req.params.id, {
    type: "ride_started",
    rideId: req.params.id,
    payload: { ride: updatedRide },
    timestamp: new Date().toISOString()
  });

  broadcastToRide(req.params.id, {
    type: "ride_status_changed",
    rideId: req.params.id,
    payload: { status: "IN_PROGRESS", ride: updatedRide },
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, ride: updatedRide });
});

// 6. POST /api/rides/:id/complete - Complete ride & settle fare (Ownership: driver, rider or admin)
router.post("/:id/complete", authenticateToken, (req, res) => {
  const store = db.read();
  const targetRide = store.rides.find((r) => r.id === req.params.id);
  if (!targetRide) {
    return res.status(404).json({ error: "Ride not found" });
  }

  const isDriver = targetRide.driverId === req.user.id || targetRide.driverId === req.user.driverProfileId;
  const isRider = targetRide.riderId === req.user.id;
  const isAdmin = req.user.role === "admin";

  if (!isDriver && !isRider && !isAdmin) {
    return res.status(403).json({
      error: "Unauthorized: only the assigned driver or passenger can complete this ride"
    });
  }

  let updatedRide = null;
  let completeError = null;
  let completeStatus = 400;

  db.transaction((data) => {
    const ride = data.rides.find((r) => r.id === req.params.id);
    if (!ride) {
      completeError = "Ride not found";
      completeStatus = 404;
      return;
    }

    if (ride.status === "COMPLETED") {
      completeError = "Ride has already been completed";
      completeStatus = 409;
      return;
    }

    if (ride.status !== "IN_PROGRESS") {
      completeError = `Ride cannot be completed from status ${ride.status}`;
      completeStatus = 409;
      return;
    }

    if (!Array.isArray(data.wallets)) data.wallets = {};
    if (!Array.isArray(data.walletLedger)) data.walletLedger = [];

    const fare = Number(ride.agreedFare) || 0;
    let collectedAmount = fare;

    ride.status = "COMPLETED";
    ride.completedAt = new Date().toISOString();
    ride.updatedAt = new Date().toISOString();

    // Deduct from rider's wallet if wallet payment
    if (ride.paymentMethod === "wallet") {
      if (!data.wallets[ride.riderId]) {
        data.wallets[ride.riderId] = {
          userId: ride.riderId,
          balance: 0.0,
          currency: "INR",
          updatedAt: new Date().toISOString()
        };
      }

      const riderWallet = data.wallets[ride.riderId];
      collectedAmount = Math.min(Number(riderWallet.balance) || 0, fare);
      riderWallet.balance = +(riderWallet.balance - collectedAmount).toFixed(2);
      riderWallet.updatedAt = new Date().toISOString();
      ride.paymentStatus = collectedAmount >= fare ? "PAID" : "PARTIAL";
      ride.amountPaid = collectedAmount;

      if (data.wallet && data.wallet.userId === ride.riderId) {
        data.wallet.balance = riderWallet.balance;
      }

      data.walletLedger.unshift({
        id: `tx-${crypto.randomUUID()}`,
        walletId: ride.riderId,
        rideId: ride.id,
        type: "DEBIT",
        amount: collectedAmount,
        description: `Ride Payment: ${ride.service} (${ride.id})`,
        idempotencyKey: `ride-pay-${ride.id}`,
        createdAt: new Date().toISOString()
      });
    } else {
      ride.paymentStatus = "PAID";
      ride.amountPaid = fare;
    }

    // Credit driver earnings (85% of the amount actually collected)
    if (ride.driverId) {
      if (!data.wallets[ride.driverId]) {
        data.wallets[ride.driverId] = {
          userId: ride.driverId,
          balance: 0.0,
          currency: "INR",
          updatedAt: new Date().toISOString()
        };
      }

      const driverWallet = data.wallets[ride.driverId];
      const driverCut = +(collectedAmount * 0.85).toFixed(2);
      driverWallet.balance = +(driverWallet.balance + driverCut).toFixed(2);
      driverWallet.updatedAt = new Date().toISOString();
      ride.driverEarning = driverCut;

      data.walletLedger.unshift({
        id: `tx-${crypto.randomUUID()}`,
        walletId: ride.driverId,
        rideId: ride.id,
        type: "CREDIT",
        amount: driverCut,
        description: `Driver Earnings: ${ride.service} (${ride.id})`,
        idempotencyKey: `ride-earning-${ride.id}`,
        createdAt: new Date().toISOString()
      });

      const driver = data.drivers.find(
        (d) => d.id === ride.driverId || d.userId === ride.driverId
      );
      if (driver) {
        driver.walletEarnings = +((driver.walletEarnings || 0) + driverCut).toFixed(2);
        driver.trips = (driver.trips || 0) + 1;
      }
    }

    updatedRide = ride;
  });

  if (!updatedRide) {
    return res.status(completeStatus).json({ error: completeError || "Ride could not be completed" });
  }

  // Real-time broadcast: Ride completed
  broadcastToRide(req.params.id, {
    type: "ride_completed",
    rideId: req.params.id,
    payload: { ride: updatedRide },
    timestamp: new Date().toISOString()
  });

  broadcastToRide(req.params.id, {
    type: "ride_status_changed",
    rideId: req.params.id,
    payload: { status: "COMPLETED", ride: updatedRide },
    timestamp: new Date().toISOString()
  });

  const latestStore = db.read();
  res.json({
    success: true,
    ride: updatedRide,
    wallet: latestStore.wallets?.[req.user.id] || latestStore.wallet
  });
});

// 7. POST /api/rides/:id/rate - Submit driver rating and feedback (Ownership: rider only)
router.post("/:id/rate", authenticateToken, (req, res) => {
  const { rating = 5, feedbackTags = [], tipAmount = 0 } = req.body;

  const numericRating = Number(rating);
  if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
    return res.status(400).json({ error: "rating must be a number between 1 and 5" });
  }

  const numericTip = Number(tipAmount) || 0;
  if (!Number.isFinite(numericTip) || numericTip < 0 || numericTip > 5000) {
    return res.status(400).json({ error: "tipAmount must be between 0 and 5000" });
  }

  const tags = Array.isArray(feedbackTags)
    ? feedbackTags.filter((tag) => typeof tag === "string").slice(0, 10).map((tag) => tag.slice(0, 40))
    : [];

  const store = db.read();
  const targetRide = store.rides.find((r) => r.id === req.params.id);
  if (!targetRide) {
    return res.status(404).json({ error: "Ride not found" });
  }

  if (targetRide.riderId !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({
      error: "Unauthorized: only the rider who took this ride can submit a rating"
    });
  }

  if (targetRide.status !== "COMPLETED") {
    return res.status(409).json({ error: "Only completed rides can be rated" });
  }

  let errorMsg = null;
  let errorStatus = 400;

  db.transaction((data) => {
    const ride = data.rides.find((r) => r.id === req.params.id);
    if (!ride) {
      errorMsg = "Ride not found";
      errorStatus = 404;
      return;
    }

    if (ride.tipAmount > 0 && numericTip > 0) {
      errorMsg = "A tip has already been submitted for this ride";
      errorStatus = 409;
      return;
    }

    ride.rating = Math.round(numericRating);
    ride.feedbackTags = tags;
    ride.ratedAt = new Date().toISOString();

    if (numericTip > 0) {
      if (!ride.driverId) {
        errorMsg = "Tip cannot be processed because no driver is assigned to this ride";
        errorStatus = 400;
        return;
      }

      if (!data.wallets) data.wallets = {};
      if (!Array.isArray(data.walletLedger)) data.walletLedger = [];

      const userWallet = data.wallets[req.user.id];
      if (!userWallet || Number(userWallet.balance) < numericTip) {
        errorMsg = "Insufficient wallet balance for this tip";
        errorStatus = 400;
        return;
      }

      userWallet.balance = +(userWallet.balance - numericTip).toFixed(2);
      userWallet.updatedAt = new Date().toISOString();
      ride.tipAmount = numericTip;

      if (!data.wallets[ride.driverId]) {
        data.wallets[ride.driverId] = {
          userId: ride.driverId,
          balance: 0.0,
          currency: "INR",
          updatedAt: new Date().toISOString()
        };
      }
      const driverWallet = data.wallets[ride.driverId];
      driverWallet.balance = +(driverWallet.balance + numericTip).toFixed(2);
      driverWallet.updatedAt = new Date().toISOString();

      data.walletLedger.unshift({
        id: `tx-tip-${crypto.randomUUID()}`,
        walletId: req.user.id,
        rideId: ride.id,
        type: "DEBIT",
        amount: numericTip,
        description: `Captain Tip: ${ride.driverName || ride.driverId} (${ride.id})`,
        idempotencyKey: `tip-${ride.id}`,
        createdAt: new Date().toISOString()
      });

      data.walletLedger.unshift({
        id: `tx-tip-credit-${crypto.randomUUID()}`,
        walletId: ride.driverId,
        rideId: ride.id,
        type: "CREDIT",
        amount: numericTip,
        description: `Rider Tip (${ride.id})`,
        idempotencyKey: `tip-credit-${ride.id}`,
        createdAt: new Date().toISOString()
      });

      const driver = data.drivers.find(
        (d) => d.id === ride.driverId || d.userId === ride.driverId
      );
      if (driver) {
        driver.walletEarnings = +((driver.walletEarnings || 0) + numericTip).toFixed(2);
      }
    }
  });

  if (errorMsg) {
    return res.status(errorStatus).json({ error: errorMsg });
  }

  res.json({ success: true });
});

// 8. POST /api/rides/:id/cancel - Cancel ride (Ownership: rider, assigned driver, or admin)
router.post("/:id/cancel", authenticateToken, (req, res) => {
  const store = db.read();
  const targetRide = store.rides.find((r) => r.id === req.params.id);
  if (!targetRide) {
    return res.status(404).json({ error: "Ride not found" });
  }

  const isRider = targetRide.riderId === req.user.id;
  const isDriver = targetRide.driverId === req.user.id || targetRide.driverId === req.user.driverProfileId;
  const isAdmin = req.user.role === "admin";

  if (!isRider && !isDriver && !isAdmin) {
    return res.status(403).json({
      error: "Unauthorized: you cannot cancel a ride you do not own"
    });
  }

  let cancelError = null;
  let cancelStatus = 400;

  db.transaction((data) => {
    const ride = data.rides.find((r) => r.id === req.params.id);
    if (!ride) {
      cancelError = "Ride not found";
      cancelStatus = 404;
      return;
    }

    if (ride.status === "COMPLETED") {
      cancelError = "Completed rides cannot be cancelled";
      cancelStatus = 409;
      return;
    }

    if (ride.status === "CANCELLED") {
      cancelError = "Ride is already cancelled";
      cancelStatus = 409;
      return;
    }

    ride.status = "CANCELLED";
    ride.cancelledBy = req.user.id;
    ride.updatedAt = new Date().toISOString();
  });

  if (cancelError) {
    return res.status(cancelStatus).json({ error: cancelError });
  }

  // Real-time broadcast: Ride cancelled
  broadcastToRide(req.params.id, {
    type: "ride_cancelled",
    rideId: req.params.id,
    payload: { rideId: req.params.id, cancelledBy: req.user.id },
    timestamp: new Date().toISOString()
  });

  broadcastToRide(req.params.id, {
    type: "ride_status_changed",
    rideId: req.params.id,
    payload: { status: "CANCELLED", rideId: req.params.id },
    timestamp: new Date().toISOString()
  });

  res.json({ success: true });
});

module.exports = router;
