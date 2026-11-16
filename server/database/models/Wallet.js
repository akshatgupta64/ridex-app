const db = require("../connection");
const crypto = require("crypto");

class Wallet {
  static async findByUserId(userId) {
    const row = await db.get("SELECT * FROM wallets WHERE user_id = ?", [userId]);
    if (!row) return null;
    return {
      userId: row.user_id,
      balance: Number(row.balance),
      currency: row.currency,
      updatedAt: row.updated_at
    };
  }

  static async create(userId, initialBalance = 0, currency = "INR") {
    const now = new Date().toISOString();
    await db.run(
      "INSERT OR REPLACE INTO wallets (user_id, balance, currency, updated_at) VALUES (?, ?, ?, ?)",
      [userId, Number(initialBalance), currency, now]
    );
    return this.findByUserId(userId);
  }

  static async getLedger(walletId) {
    const rows = await db.query(
      "SELECT * FROM wallet_ledger WHERE wallet_id = ? ORDER BY created_at DESC",
      [walletId]
    );
    return rows.map((r) => ({
      id: r.id,
      walletId: r.wallet_id,
      rideId: r.ride_id,
      type: r.type,
      amount: Number(r.amount),
      description: r.description,
      idempotencyKey: r.idempotency_key,
      createdAt: r.created_at
    }));
  }

  static async credit(userId, amount, description = "Credit", idempotencyKey = null, rideId = null) {
    const key = idempotencyKey || `credit-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      throw new Error("Invalid credit amount");
    }

    // Check duplicate idempotency key
    const existing = await db.get("SELECT * FROM wallet_ledger WHERE idempotency_key = ?", [key]);
    if (existing) {
      return { duplicate: true, wallet: await this.findByUserId(userId) };
    }

    const txId = `tx-${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    // Ensure wallet exists
    let wallet = await this.findByUserId(userId);
    if (!wallet) {
      wallet = await this.create(userId, 0);
    }

    await db.run(
      "UPDATE wallets SET balance = balance + ?, updated_at = ? WHERE user_id = ?",
      [numAmount, now, userId]
    );

    await db.run(
      `INSERT INTO wallet_ledger (id, wallet_id, ride_id, type, amount, description, idempotency_key, created_at)
       VALUES (?, ?, ?, 'CREDIT', ?, ?, ?, ?)`,
      [txId, userId, rideId, numAmount, description, key, now]
    );

    return { duplicate: false, txId, wallet: await this.findByUserId(userId) };
  }

  static async debit(userId, amount, description = "Debit", idempotencyKey = null, rideId = null) {
    const key = idempotencyKey || `debit-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      throw new Error("Invalid debit amount");
    }

    // Check duplicate idempotency key
    const existing = await db.get("SELECT * FROM wallet_ledger WHERE idempotency_key = ?", [key]);
    if (existing) {
      return { duplicate: true, wallet: await this.findByUserId(userId) };
    }

    const wallet = await this.findByUserId(userId);
    if (!wallet || wallet.balance < numAmount) {
      throw new Error("Insufficient wallet balance");
    }

    const txId = `tx-${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    await db.run(
      "UPDATE wallets SET balance = balance - ?, updated_at = ? WHERE user_id = ?",
      [numAmount, now, userId]
    );

    await db.run(
      `INSERT INTO wallet_ledger (id, wallet_id, ride_id, type, amount, description, idempotency_key, created_at)
       VALUES (?, ?, ?, 'DEBIT', ?, ?, ?, ?)`,
      [txId, userId, rideId, numAmount, description, key, now]
    );

    return { duplicate: false, txId, wallet: await this.findByUserId(userId) };
  }
}

module.exports = Wallet;
