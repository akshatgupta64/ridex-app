const express = require("express");
const router = express.Router();
const db = require("../db");
const { authenticateToken, optionalAuth } = require("../middleware/auth");

// 1. GET /api/wallet - Get authenticated user's wallet balance & transaction ledger
router.get("/", authenticateToken, (req, res) => {
  const store = db.read();
  const userId = req.user.id;

  const wallet = (store.wallets && store.wallets[userId]) || {
    userId,
    balance: 0.0,
    currency: "INR",
    updatedAt: new Date().toISOString()
  };

  const ledger = (store.walletLedger || []).filter((entry) => entry.walletId === userId);

  res.json({
    wallet,
    ledger
  });
});

// 2. POST /api/wallet/topup - Idempotent, simulated top-up restricted to authenticated user
router.post("/topup", authenticateToken, (req, res) => {
  const { amount, idempotencyKey } = req.body;
  const userId = req.user.id;

  if (!amount || isNaN(+amount) || +amount <= 0) {
    return res.status(400).json({ error: "A valid positive top-up amount is required" });
  }

  if (+amount > 10000) {
    return res.status(400).json({ error: "Top-up amount cannot exceed 10000 per transaction" });
  }

  if (idempotencyKey !== undefined && (typeof idempotencyKey !== "string" || idempotencyKey.length > 120)) {
    return res.status(400).json({ error: "idempotencyKey must be a string under 120 characters" });
  }

  const topupVal = Math.round(+amount * 100) / 100;
  const key = idempotencyKey || `topup-${userId}-${Date.now()}`;
  let updatedWallet = null;
  let ledgerEntry = null;

  db.transaction((data) => {
    if (!data.wallets) data.wallets = {};
    if (!Array.isArray(data.walletLedger)) data.walletLedger = [];
    if (!data.wallets[userId]) {
      data.wallets[userId] = {
        userId,
        balance: 0.0,
        currency: "INR",
        updatedAt: new Date().toISOString()
      };
    }

    // Check if idempotency key was already processed for this user
    const existing = data.walletLedger.find((l) => l.idempotencyKey === key && l.walletId === userId);
    if (existing) {
      updatedWallet = data.wallets[userId];
      ledgerEntry = existing;
      return;
    }

    data.wallets[userId].balance = +(data.wallets[userId].balance + topupVal).toFixed(2);
    data.wallets[userId].updatedAt = new Date().toISOString();

    if (data.wallet && data.wallet.userId === userId) {
      data.wallet.balance = data.wallets[userId].balance;
    }

    ledgerEntry = {
      id: `tx-${Date.now()}`,
      walletId: userId,
      rideId: null,
      type: "CREDIT",
      amount: topupVal,
      description: `Simulated Demo Top-Up via UPI/Card (Authorized)`,
      idempotencyKey: key,
      isSimulated: true,
      createdAt: new Date().toISOString()
    };

    data.walletLedger.unshift(ledgerEntry);
    updatedWallet = data.wallets[userId];
  });

  res.json({
    success: true,
    wallet: updatedWallet,
    entry: ledgerEntry
  });
});

module.exports = router;
