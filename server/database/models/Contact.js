const db = require("../connection");
const crypto = require("crypto");

class Contact {
  static async create({ name, email, subject, message }) {
    const id = `MSG-${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO contact_messages (id, name, email, subject, message, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, name, email, subject, message, now]
    );

    return { id, name, email, subject, message, createdAt: now };
  }

  static async findAll() {
    return db.query("SELECT * FROM contact_messages ORDER BY created_at DESC");
  }
}

module.exports = Contact;
