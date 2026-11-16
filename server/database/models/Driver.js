const db = require("../connection");

class Driver {
  static async findById(id) {
    const row = await db.get("SELECT * FROM drivers WHERE id = ?", [id]);
    if (!row) return null;
    return this._format(row);
  }

  static async findByUserId(userId) {
    const row = await db.get("SELECT * FROM drivers WHERE user_id = ?", [userId]);
    if (!row) return null;
    return this._format(row);
  }

  static async findAll() {
    const rows = await db.query("SELECT * FROM drivers ORDER BY rating DESC");
    return rows.map((r) => this._format(r));
  }

  static async findOnline(vehicleType = null) {
    let sql = "SELECT * FROM drivers WHERE status = 'ONLINE'";
    const params = [];
    if (vehicleType && vehicleType !== "parcel") {
      sql += " AND vehicle_type = ?";
      params.push(vehicleType);
    }
    sql += " ORDER BY rating DESC";
    const rows = await db.query(sql, params);
    return rows.map((r) => this._format(r));
  }

  static async create({
    id,
    userId,
    name,
    phone,
    rating = 4.9,
    trips = 0,
    vehicleType,
    model,
    plateNumber,
    avatar = null,
    latitude = 12.9784,
    longitude = 77.6408,
    status = "ONLINE",
    walletEarnings = 0.0
  }) {
    const now = new Date().toISOString();
    await db.run(
      `INSERT INTO drivers (id, user_id, name, phone, rating, trips, vehicle_type, model, plate_number, avatar, latitude, longitude, status, wallet_earnings, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        name,
        phone,
        rating,
        trips,
        vehicleType,
        model,
        plateNumber,
        avatar,
        latitude,
        longitude,
        status,
        walletEarnings,
        now,
        now
      ]
    );
    return this.findById(id);
  }

  static async updateLocation(id, lat, lon) {
    const now = new Date().toISOString();
    await db.run(
      "UPDATE drivers SET latitude = ?, longitude = ?, updated_at = ? WHERE id = ?",
      [lat, lon, now, id]
    );
  }

  static async updateStatus(id, status) {
    const now = new Date().toISOString();
    await db.run("UPDATE drivers SET status = ?, updated_at = ? WHERE id = ?", [
      status,
      now,
      id
    ]);
  }

  static async incrementEarnings(id, amount) {
    const now = new Date().toISOString();
    await db.run(
      "UPDATE drivers SET wallet_earnings = wallet_earnings + ?, trips = trips + 1, updated_at = ? WHERE id = ?",
      [amount, now, id]
    );
  }

  static _format(row) {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      phone: row.phone,
      rating: Number(row.rating),
      trips: Number(row.trips),
      vehicleType: row.vehicle_type,
      model: row.model,
      plateNumber: row.plate_number,
      avatar: row.avatar,
      location: [Number(row.latitude), Number(row.longitude)],
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      status: row.status,
      walletEarnings: Number(row.wallet_earnings),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

module.exports = Driver;
