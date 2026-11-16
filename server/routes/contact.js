const crypto = require("crypto");
const express = require("express");
const router = express.Router();
const db = require("../db");
const { rateLimiter } = require("../middleware/security");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^[+]?[\d\s()-]{8,20}$/;

const contactLimiter = rateLimiter({ windowMs: 10 * 60 * 1000, max: 10, prefix: "contact" });

function clean(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.replace(/[<>]/g, "").trim().slice(0, maxLength);
}

// POST /api/contact - Store a validated support/contact enquiry
router.post("/", contactLimiter, (req, res) => {
  const name = clean(req.body.name, 120);
  const email = clean(req.body.email, 160).toLowerCase();
  const mobile = clean(req.body.mobile, 20);
  const role = clean(req.body.role, 40) || "General";
  const query = clean(req.body.query, 80) || "General enquiry";
  const comment = clean(req.body.comment, 4000);

  if (!name || name.length < 2) {
    return res.status(400).json({ error: "A valid name is required" });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "A valid email address is required" });
  }
  if (!MOBILE_RE.test(mobile)) {
    return res.status(400).json({ error: "A valid mobile number is required" });
  }
  if (comment.length < 10) {
    return res.status(400).json({ error: "Please describe your query in at least 10 characters" });
  }

  const message = {
    id: crypto.randomUUID(),
    name,
    email,
    mobile,
    role,
    query,
    comment,
    status: "OPEN",
    createdAt: new Date().toISOString()
  };

  db.transaction((data) => {
    if (!data.contactMessages) data.contactMessages = [];
    data.contactMessages.unshift(message);
    if (data.contactMessages.length > 500) {
      data.contactMessages = data.contactMessages.slice(0, 500);
    }
  });

  res.status(201).json({
    success: true,
    message: "Thanks for reaching out. Our support team will respond within 24 hours.",
    ticketId: message.id
  });
});

module.exports = router;
