const db = require("../connection");

class Ride {
  static async findById(id) {
    const row = await db.get("SELECT * FROM rides WHERE id = ?", [id]);
    if (!row) return null;
    return this._format(row);
  }

  static async findByRiderId(riderId) {
    const rows = await db.query(
      "SELECT * FROM rides WHERE rider_id = ? ORDER BY created_at DESC",
      [riderId]
    );
    return rows.map((r) => this._format(r));
  }

  static async findByDriverId(driverId) {
    const rows = await db.query(
      "SELECT * FROM rides WHERE driver_id = ? ORDER BY created_at DESC",
      [driverId]
    );
    return rows.map((r) => this._format(r));
  }

  static async findActiveByStatus(statusList = ["BIDDING", "ASSIGNED", "ARRIVED", "IN_PROGRESS"]) {
    const placeholders = statusList.map(() => "?").join(",");
    const rows = await db.query(
      `SELECT * FROM rides WHERE status IN (${placeholders}) ORDER BY created_at DESC`,
      statusList
    );
    return rows.map((r) => this._format(r));
  }

  static async findAll() {
    const rows = await db.query("SELECT * FROM rides ORDER BY created_at DESC");
    return rows.map((r) => this._format(r));
  }

  static async create(data) {
    const now = new Date().toISOString();
    const waypointsJson = JSON.stringify(data.waypoints || []);
    const parcelJson = data.parcelDetails ? JSON.stringify(data.parcelDetails) : null;

    await db.run(
      `INSERT INTO rides (
        id, rider_id, rider_name, rider_phone, driver_id, driver_name, driver_vehicle,
        service, vehicle_type, pickup_address, drop_address, pickup_lat, pickup_lon,
        drop_lat, drop_lon, distance_km, duration_mins, waypoints, recommended_fare,
        initial_offer_fare, agreed_fare, status, payment_method, ride_otp, parcel_details,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.id,
        data.riderId,
        data.riderName,
        data.riderPhone,
        data.driverId || null,
        data.driverName || null,
        data.driverVehicle || null,
        data.service,
        data.vehicleType,
        data.pickupAddress,
        data.dropAddress,
        data.pickupCoords[0],
        data.pickupCoords[1],
        data.dropCoords[0],
        data.dropCoords[1],
        data.distanceKm,
        data.durationMins,
        waypointsJson,
        data.recommendedFare,
        data.initialOfferFare,
        data.agreedFare,
        data.status || "BIDDING",
        data.paymentMethod || "wallet",
        data.rideOtp,
        parcelJson,
        data.createdAt || now,
        data.updatedAt || now
      ]
    );

    return this.findById(data.id);
  }

  static async update(id, updates) {
    const fields = [];
    const params = [];
    const mapping = {
      status: "status",
      driverId: "driver_id",
      driverName: "driver_name",
      driverVehicle: "driver_vehicle",
      agreedFare: "agreed_fare",
      rating: "rating",
      feedbackTags: "feedback_tags",
      tipAmount: "tip_amount",
      cancellationReason: "cancellation_reason",
      startedAt: "started_at",
      completedAt: "completed_at"
    };

    for (const [key, col] of Object.entries(mapping)) {
      if (updates[key] !== undefined) {
        fields.push(`${col} = ?`);
        let val = updates[key];
        if (key === "feedbackTags" && Array.isArray(val)) val = JSON.stringify(val);
        params.push(val);
      }
    }

    fields.push("updated_at = ?");
    params.push(new Date().toISOString());
    params.push(id);

    await db.run(`UPDATE rides SET ${fields.join(", ")} WHERE id = ?`, params);
    return this.findById(id);
  }

  static _format(row) {
    return {
      id: row.id,
      riderId: row.rider_id,
      riderName: row.rider_name,
      riderPhone: row.rider_phone,
      driverId: row.driver_id,
      driverName: row.driver_name,
      driverVehicle: row.driver_vehicle,
      service: row.service,
      vehicleType: row.vehicle_type,
      pickupAddress: row.pickup_address,
      dropAddress: row.drop_address,
      pickupCoords: [Number(row.pickup_lat), Number(row.pickup_lon)],
      dropCoords: [Number(row.drop_lat), Number(row.drop_lon)],
      distanceKm: Number(row.distance_km),
      durationMins: Number(row.duration_mins),
      waypoints: row.waypoints ? JSON.parse(row.waypoints) : [],
      recommendedFare: Number(row.recommended_fare),
      initialOfferFare: Number(row.initial_offer_fare),
      agreedFare: Number(row.agreed_fare),
      status: row.status,
      paymentMethod: row.payment_method,
      rideOtp: row.ride_otp,
      parcelDetails: row.parcel_details ? JSON.parse(row.parcel_details) : null,
      rating: row.rating ? Number(row.rating) : null,
      feedbackTags: row.feedback_tags ? JSON.parse(row.feedback_tags) : [],
      tipAmount: Number(row.tip_amount || 0),
      cancellationReason: row.cancellation_reason,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

module.exports = Ride;
