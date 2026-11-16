const db = require("../connection");
const crypto = require("crypto");

class Carpool {
  static async findById(id) {
    const row = await db.get("SELECT * FROM carpools WHERE id = ?", [id]);
    if (!row) return null;
    return this._format(row);
  }

  static async findAll(fromCity = null, toCity = null) {
    let sql = "SELECT * FROM carpools WHERE status = 'ACTIVE'";
    const params = [];
    if (fromCity) {
      sql += " AND LOWER(from_city) LIKE ?";
      params.push(`%${fromCity.trim().toLowerCase()}%`);
    }
    if (toCity) {
      sql += " AND LOWER(to_city) LIKE ?";
      params.push(`%${toCity.trim().toLowerCase()}%`);
    }
    sql += " ORDER BY created_at DESC";
    const rows = await db.query(sql, params);
    return rows.map((r) => this._format(r));
  }

  static async create(data) {
    const now = new Date().toISOString();
    const featuresJson = JSON.stringify(data.features || []);

    await db.run(
      `INSERT INTO carpools (
        id, driver_id, driver_name, driver_phone, driver_rating, driver_avatar,
        from_city, from_point, to_city, to_point, departure_time, car_model,
        total_seats, available_seats, price_per_seat, features, notes, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.id,
        data.driverId,
        data.driverName,
        data.driverPhone,
        data.driverRating,
        data.driverAvatar,
        data.fromCity,
        data.fromPoint,
        data.toCity,
        data.toPoint,
        data.departureTime,
        data.carModel,
        data.totalSeats,
        data.availableSeats,
        data.pricePerSeat,
        featuresJson,
        data.notes || "",
        data.status || "ACTIVE",
        data.createdAt || now
      ]
    );

    return this.findById(data.id);
  }

  static async bookSeats(carpoolId, { riderId, riderName, riderPhone, seats }) {
    const carpool = await this.findById(carpoolId);
    if (!carpool) throw new Error("Carpool not found");
    if (carpool.availableSeats < seats) {
      throw new Error(`Only ${carpool.availableSeats} seat(s) available`);
    }

    const bookingId = `CP-BOOK-${crypto.randomUUID()}`;
    const totalPrice = carpool.pricePerSeat * seats;
    const now = new Date().toISOString();

    await db.run(
      "UPDATE carpools SET available_seats = available_seats - ? WHERE id = ? AND available_seats >= ?",
      [seats, carpoolId, seats]
    );

    await db.run(
      `INSERT INTO carpool_bookings (id, carpool_id, rider_id, rider_name, rider_phone, seats, total_price, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', ?)`,
      [bookingId, carpoolId, riderId, riderName, riderPhone, seats, totalPrice, now]
    );

    return {
      bookingId,
      carpoolId,
      seats,
      totalPrice,
      carpool: await this.findById(carpoolId)
    };
  }

  static async getBookingsByRider(riderId) {
    const rows = await db.query(
      `SELECT cb.*, c.from_city, c.to_city, c.departure_time, c.car_model, c.driver_name
       FROM carpool_bookings cb
       JOIN carpools c ON cb.carpool_id = c.id
       WHERE cb.rider_id = ?
       ORDER BY cb.created_at DESC`,
      [riderId]
    );
    return rows;
  }

  static _format(row) {
    return {
      id: row.id,
      driverId: row.driver_id,
      driverName: row.driver_name,
      driverPhone: row.driver_phone,
      driverRating: Number(row.driver_rating),
      driverAvatar: row.driver_avatar,
      fromCity: row.from_city,
      fromPoint: row.from_point,
      toCity: row.to_city,
      toPoint: row.to_point,
      departureTime: row.departure_time,
      carModel: row.car_model,
      totalSeats: Number(row.total_seats),
      availableSeats: Number(row.available_seats),
      pricePerSeat: Number(row.price_per_seat),
      features: row.features ? JSON.parse(row.features) : [],
      notes: row.notes,
      status: row.status,
      createdAt: row.created_at
    };
  }
}

module.exports = Carpool;
