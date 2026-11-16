const db = require("../connection");

class Bid {
  static async findById(bidId) {
    const row = await db.get("SELECT * FROM ride_bids WHERE bid_id = ?", [bidId]);
    if (!row) return null;
    return this._format(row);
  }

  static async findByRideId(rideId) {
    const rows = await db.query(
      "SELECT * FROM ride_bids WHERE ride_id = ? ORDER BY driver_price ASC, eta_mins ASC",
      [rideId]
    );
    return rows.map((r) => this._format(r));
  }

  static async create(data) {
    const now = new Date().toISOString();
    await db.run(
      `INSERT INTO ride_bids (
        bid_id, ride_id, driver_id, driver_name, driver_rating, driver_trips,
        driver_vehicle, driver_plate, driver_avatar, driver_price, eta_mins,
        distance_km, status, message, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.bidId,
        data.rideId,
        data.driverId,
        data.driverName,
        data.driverRating,
        data.driverTrips,
        data.driverVehicle,
        data.driverPlate,
        data.driverAvatar,
        data.driverPrice,
        data.etaMins,
        data.distanceKm,
        data.status || "PENDING",
        data.message,
        data.createdAt || now
      ]
    );
    return this.findById(data.bidId);
  }

  static async accept(bidId, rideId) {
    // Atomic acceptance: chosen bid becomes ACCEPTED, competing bids expire
    await db.run("UPDATE ride_bids SET status = 'ACCEPTED' WHERE bid_id = ?", [bidId]);
    await db.run(
      "UPDATE ride_bids SET status = 'EXPIRED' WHERE ride_id = ? AND bid_id != ?",
      [rideId, bidId]
    );
    return this.findById(bidId);
  }

  static async expireAll(rideId) {
    await db.run("UPDATE ride_bids SET status = 'EXPIRED' WHERE ride_id = ?", [rideId]);
  }

  static _format(row) {
    return {
      bidId: row.bid_id,
      rideId: row.ride_id,
      driverId: row.driver_id,
      driverName: row.driver_name,
      driverRating: Number(row.driver_rating),
      driverTrips: Number(row.driver_trips),
      driverVehicle: row.driver_vehicle,
      driverPlate: row.driver_plate,
      driverAvatar: row.driver_avatar,
      driverPrice: Number(row.driver_price),
      etaMins: Number(row.eta_mins),
      distanceKm: Number(row.distance_km),
      status: row.status,
      message: row.message,
      createdAt: row.created_at
    };
  }
}

module.exports = Bid;
