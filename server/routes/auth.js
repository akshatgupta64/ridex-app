const crypto = require("crypto");
const express = require("express");
const router = express.Router();
const db = require("../db");
const { hashPassword, comparePassword, generateToken, sanitizeUser } = require("../utils/auth");
const { authenticateToken } = require("../middleware/auth");
const { rateLimiter } = require("../middleware/security");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SIGNUP_BONUS = Number(process.env.SIGNUP_BONUS ?? 100);
const authLimiter = rateLimiter({ windowMs: 15 * 60 * 1000, max: 30, prefix: "auth" });

router.use(authLimiter);

/**
 * 1. POST /api/auth/register
 * Register a new passenger (rider) or driver
 */
router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role = "rider",
      vehicleType = "bike",
      model = "Vehicle",
      plateNumber = ""
    } = req.body;

    // 1. Validation
    if (typeof name !== "string" || !name.trim() || name.trim().length > 120) {
      return res.status(400).json({ error: "Full name is required (maximum 120 characters)" });
    }
    if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
      return res.status(400).json({ error: "A valid email address is required" });
    }
    if (typeof phone !== "string" || phone.trim().length < 8 || phone.trim().length > 20) {
      return res.status(400).json({ error: "A valid phone number is required" });
    }
    if (typeof password !== "string" || password.length < 6 || password.length > 128) {
      return res.status(400).json({ error: "Password must be between 6 and 128 characters long" });
    }

    const normalizedRole = typeof role === "string" ? role.toLowerCase().trim() : "";
    if (normalizedRole !== "rider" && normalizedRole !== "driver") {
      return res.status(400).json({ error: "Role must be either 'rider' or 'driver'" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const store = db.read();

    // 2. Check for duplicate email
    const duplicate = store.users.find(
      (u) =>
        (u.email || "").toLowerCase() === normalizedEmail ||
        (u.aliases && u.aliases.map((a) => a.toLowerCase()).includes(normalizedEmail))
    );
    if (duplicate) {
      return res.status(409).json({ error: "An account with this email address already exists" });
    }

    // 3. Hash password securely
    const passwordHash = await hashPassword(password);
    const userId = `${normalizedRole === "driver" ? "drv" : "usr"}-${crypto.randomUUID()}`;

    const newUser = {
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      role: normalizedRole,
      passwordHash,
      createdAt: new Date().toISOString()
    };

    let newDriverProfile = null;
    if (normalizedRole === "driver") {
      newUser.driverProfileId = userId;
      newDriverProfile = {
        id: userId,
        userId: userId,
        name: name.trim(),
        phone: phone.trim(),
        rating: 5.0,
        trips: 0,
        vehicleType: ["bike", "auto", "cab_economy"].includes(vehicleType) ? vehicleType : "bike",
        model: model || "Standard Vehicle",
        plateNumber: plateNumber || "NEW-REG-01",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        location: [12.9784, 77.6408],
        status: "ONLINE",
        walletEarnings: 0.0
      };
    }

    // 4. Atomic database commit
    db.transaction((data) => {
      data.users.push(newUser);

      if (newDriverProfile) {
        if (!data.drivers) data.drivers = [];
        data.drivers.push(newDriverProfile);
      }

      if (!data.wallets) data.wallets = {};
      if (!Array.isArray(data.walletLedger)) data.walletLedger = [];
      const initialBalance = normalizedRole === "rider" ? SIGNUP_BONUS : 0.0;
      data.wallets[userId] = {
        userId,
        balance: Number.isFinite(initialBalance) ? initialBalance : 0,
        currency: "INR",
        updatedAt: new Date().toISOString()
      };

      if (initialBalance > 0) {
        data.walletLedger.unshift({
          id: `tx-${crypto.randomUUID()}`,
          walletId: userId,
          rideId: null,
          type: "CREDIT",
          amount: initialBalance,
          description: "New Account Signup Bonus",
          idempotencyKey: `signup-bonus-${userId}`,
          createdAt: new Date().toISOString()
        });
      }
    });

    // 5. Generate session token
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name
    });

    res.status(201).json({
      success: true,
      token,
      user: sanitizeUser(newUser),
      message: "Account registered successfully"
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Failed to register account" });
  }
});

/**
 * 2. POST /api/auth/login
 * Log in with email and password
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const store = db.read();

    const user = store.users.find(
      (u) =>
        (u.email || "").toLowerCase() === normalizedEmail ||
        (u.aliases && u.aliases.map((a) => a.toLowerCase()).includes(normalizedEmail))
    );

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    });

    res.json({
      success: true,
      token,
      user: sanitizeUser(user),
      message: "Login successful"
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Failed to authenticate" });
  }
});

/**
 * 3. GET /api/auth/me
 * Get current authenticated user profile and wallet state
 */
router.get("/me", authenticateToken, (req, res) => {
  const store = db.read();
  const user = store.users.find((u) => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const wallet = (store.wallets && store.wallets[req.user.id]) || {
    userId: req.user.id,
    balance: 0.0,
    currency: "INR"
  };

  let driverProfile = null;
  if (user.role === "driver") {
    driverProfile = store.drivers?.find((d) => d.userId === user.id || d.id === user.id) || null;
  }

  res.json({
    success: true,
    user: sanitizeUser(user),
    wallet,
    driverProfile
  });
});

module.exports = router;
