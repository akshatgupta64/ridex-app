const db = require("../connection");

class User {
  static async findById(id) {
    const row = await db.get("SELECT * FROM users WHERE id = ?", [id]);
    if (!row) return null;
    return this._format(row);
  }

  static async findByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    const row = await db.get(
      "SELECT * FROM users WHERE LOWER(email) = ? OR aliases LIKE ?",
      [cleanEmail, `%"${cleanEmail}"%`]
    );
    if (!row) return null;
    return this._format(row);
  }

  static async findAll() {
    const rows = await db.query("SELECT * FROM users ORDER BY created_at DESC");
    return rows.map((r) => this._format(r));
  }

  static async create({
    id,
    name,
    email,
    phone,
    role = "rider",
    passwordHash,
    driverProfileId = null,
    aliases = []
  }) {
    const cleanEmail = email.trim().toLowerCase();
    const aliasesJson = JSON.stringify(aliases);
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO users (id, name, email, phone, role, password_hash, driver_profile_id, aliases, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, cleanEmail, phone, role, passwordHash, driverProfileId, aliasesJson, now, now]
    );

    return this.findById(id);
  }

  static async updatePassword(id, passwordHash) {
    const now = new Date().toISOString();
    await db.run("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?", [
      passwordHash,
      now,
      id
    ]);
  }

  static _format(row) {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      role: row.role,
      passwordHash: row.password_hash,
      driverProfileId: row.driver_profile_id,
      aliases: row.aliases ? JSON.parse(row.aliases) : [],
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

module.exports = User;
