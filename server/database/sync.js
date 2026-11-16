const { getSqliteDb } = require("./connection");

/**
 * Synchronizes in-memory / JSON store snapshot into SQLite relational tables
 */
function syncSnapshotToSqlite(data) {
  if (!data) return;
  const db = getSqliteDb();

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    // 1. Sync Users
    if (Array.isArray(data.users)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO users (id, name, email, phone, role, password_hash, driver_profile_id, aliases, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      data.users.forEach((u) => {
        if (!u || !u.id) return;
        const aliasesStr = Array.isArray(u.aliases) ? JSON.stringify(u.aliases) : "[]";
        stmt.run([
          u.id,
          u.name || "",
          (u.email || "").toLowerCase(),
          u.phone || "",
          u.role || "rider",
          u.passwordHash || "",
          u.driverProfileId || null,
          aliasesStr,
          u.createdAt || new Date().toISOString(),
          u.updatedAt || new Date().toISOString()
        ]);
      });
      stmt.finalize();
    }

    // 2. Sync Drivers
    if (Array.isArray(data.drivers)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO drivers (id, user_id, name, phone, rating, trips, vehicle_type, model, plate_number, avatar, latitude, longitude, status, wallet_earnings, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      data.drivers.forEach((d) => {
        if (!d || !d.id) return;
        const lat = Array.isArray(d.location) ? d.location[0] : (d.latitude || 12.9784);
        const lon = Array.isArray(d.location) ? d.location[1] : (d.longitude || 77.6408);
        stmt.run([
          d.id,
          d.userId || null,
          d.name || "",
          d.phone || "",
          d.rating || 5.0,
          d.trips || 0,
          d.vehicleType || "bike",
          d.model || "",
          d.plateNumber || "",
          d.avatar || null,
          lat,
          lon,
          d.status || "ONLINE",
          d.walletEarnings || 0.0,
          d.createdAt || new Date().toISOString(),
          d.updatedAt || new Date().toISOString()
        ]);
      });
      stmt.finalize();
    }

    // 3. Sync Wallets
    if (data.wallets && typeof data.wallets === "object") {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO wallets (user_id, balance, currency, updated_at)
        VALUES (?, ?, ?, ?)
      `);
      Object.entries(data.wallets).forEach(([userId, w]) => {
        if (!w) return;
        stmt.run([
          userId,
          Number(w.balance || 0),
          w.currency || "INR",
          w.updatedAt || new Date().toISOString()
        ]);
      });
      stmt.finalize();
    }

    // 4. Sync Wallet Ledger
    if (Array.isArray(data.walletLedger)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO wallet_ledger (id, wallet_id, ride_id, type, amount, description, idempotency_key, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      data.walletLedger.forEach((entry) => {
        if (!entry || !entry.id) return;
        stmt.run([
          entry.id,
          entry.walletId || "",
          entry.rideId || null,
          entry.type || "CREDIT",
          Number(entry.amount || 0),
          entry.description || "",
          entry.idempotencyKey || entry.id,
          entry.createdAt || new Date().toISOString()
        ]);
      });
      stmt.finalize();
    }

    // 5. Sync Rides
    if (Array.isArray(data.rides)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO rides (
          id, rider_id, rider_name, rider_phone, driver_id, driver_name, driver_vehicle,
          service, vehicle_type, pickup_address, drop_address, pickup_lat, pickup_lon,
          drop_lat, drop_lon, distance_km, duration_mins, waypoints, recommended_fare,
          initial_offer_fare, agreed_fare, status, payment_method, ride_otp, parcel_details,
          rating, feedback_tags, tip_amount, cancellation_reason, started_at, completed_at,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      data.rides.forEach((r) => {
        if (!r || !r.id) return;
        const pLat = Array.isArray(r.pickupCoords) ? r.pickupCoords[0] : 0;
        const pLon = Array.isArray(r.pickupCoords) ? r.pickupCoords[1] : 0;
        const dLat = Array.isArray(r.dropCoords) ? r.dropCoords[0] : 0;
        const dLon = Array.isArray(r.dropCoords) ? r.dropCoords[1] : 0;

        stmt.run([
          r.id,
          r.riderId || "",
          r.riderName || "",
          r.riderPhone || "",
          r.driverId || null,
          r.driverName || null,
          r.driverVehicle || null,
          r.service || "Bike Taxi",
          r.vehicleType || "bike",
          r.pickupAddress || "",
          r.dropAddress || "",
          pLat,
          pLon,
          dLat,
          dLon,
          r.distanceKm || 0,
          r.durationMins || 0,
          JSON.stringify(r.waypoints || []),
          r.recommendedFare || 0,
          r.initialOfferFare || 0,
          r.agreedFare || 0,
          r.status || "BIDDING",
          r.paymentMethod || "wallet",
          r.rideOtp || "",
          r.parcelDetails ? JSON.stringify(r.parcelDetails) : null,
          r.rating || null,
          Array.isArray(r.feedbackTags) ? JSON.stringify(r.feedbackTags) : "[]",
          r.tipAmount || 0,
          r.cancellationReason || null,
          r.startedAt || null,
          r.completedAt || null,
          r.createdAt || new Date().toISOString(),
          r.updatedAt || new Date().toISOString()
        ]);
      });
      stmt.finalize();
    }

    // 6. Sync Bids
    if (Array.isArray(data.bids)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO ride_bids (
          bid_id, ride_id, driver_id, driver_name, driver_rating, driver_trips,
          driver_vehicle, driver_plate, driver_avatar, driver_price, eta_mins,
          distance_km, status, message, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      data.bids.forEach((b) => {
        if (!b || !b.bidId) return;
        stmt.run([
          b.bidId,
          b.rideId || "",
          b.driverId || "",
          b.driverName || "",
          b.driverRating || 5.0,
          b.driverTrips || 0,
          b.driverVehicle || "",
          b.driverPlate || "",
          b.driverAvatar || null,
          b.driverPrice || 0,
          b.etaMins || 0,
          b.distanceKm || 0,
          b.status || "PENDING",
          b.message || "",
          b.createdAt || new Date().toISOString()
        ]);
      });
      stmt.finalize();
    }

    // 7. Sync Carpools
    if (Array.isArray(data.carpools)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO carpools (
          id, driver_id, driver_name, driver_phone, driver_rating, driver_avatar,
          from_city, from_point, to_city, to_point, departure_time, car_model,
          total_seats, available_seats, price_per_seat, features, notes, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      data.carpools.forEach((c) => {
        if (!c || !c.id) return;
        stmt.run([
          c.id,
          c.driverId || "",
          c.driverName || "",
          c.driverPhone || "",
          c.driverRating || 5.0,
          c.driverAvatar || null,
          c.fromCity || "",
          c.fromPoint || "",
          c.toCity || "",
          c.toPoint || "",
          c.departureTime || "",
          c.carModel || "",
          c.totalSeats || 0,
          c.availableSeats || 0,
          c.pricePerSeat || 0,
          Array.isArray(c.features) ? JSON.stringify(c.features) : "[]",
          c.notes || "",
          c.status || "ACTIVE",
          c.createdAt || new Date().toISOString()
        ]);
      });
      stmt.finalize();
    }

    // 8. Sync Carpool Bookings
    if (Array.isArray(data.carpoolBookings)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO carpool_bookings (
          id, carpool_id, rider_id, rider_name, rider_phone, seats, total_price, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      data.carpoolBookings.forEach((cb) => {
        if (!cb || !cb.id) return;
        stmt.run([
          cb.id,
          cb.carpoolId || "",
          cb.riderId || "",
          cb.riderName || "",
          cb.riderPhone || "",
          cb.seats || 0,
          cb.totalPrice || 0,
          cb.status || "CONFIRMED",
          cb.createdAt || new Date().toISOString()
        ]);
      });
      stmt.finalize();
    }

    // 9. Sync Contact Messages
    if (Array.isArray(data.contactMessages)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO contact_messages (id, name, email, subject, message, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      data.contactMessages.forEach((msg) => {
        if (!msg || !msg.id) return;
        stmt.run([
          msg.id,
          msg.name || "",
          msg.email || "",
          msg.subject || "",
          msg.message || "",
          msg.createdAt || new Date().toISOString()
        ]);
      });
      stmt.finalize();
    }

    db.run("COMMIT;");
  });
}

module.exports = {
  syncSnapshotToSqlite
};
