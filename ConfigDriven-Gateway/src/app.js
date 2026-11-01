/**
 * ConfigDriven-Gateway — Express order service with Tier 2 CWE-319 patterns.
 *
 * All transport endpoints are configured via .env and use cleartext protocols:
 * MongoDB (tls=false), Redis (redis://), RabbitMQ (amqp://), LDAP (ldap://),
 * SMTP (port 25, no TLS).
 */
require("dotenv").config();

const crypto = require("crypto");
const express = require("express");
const db = require("./db");
const broker = require("./broker");
const ldapAuth = require("./ldap-auth");
const mailer = require("./mailer");

const app = express();
app.use(express.json());

// ── Login (LDAP auth) ────────────────────────────────────────

app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "missing credentials" });
  }
  const ok = await ldapAuth.authenticate(username, password);
  if (!ok) {
    return res.status(401).json({ error: "invalid credentials" });
  }
  const sessionId = `sid-${crypto.randomBytes(16).toString("hex")}`;
  await db.cacheSession(sessionId, { username });
  res.json({ sessionId });
});

// ── Orders ───────────────────────────────────────────────────

app.get("/orders", async (req, res) => {
  const userId = parseInt(req.query.user_id, 10);
  if (!userId) return res.status(400).json({ error: "user_id required" });
  const orders = await db.fetchOrders(userId);
  res.json(orders);
});

app.post("/orders", async (req, res) => {
  const { userId, product, amount, email } = req.body;
  if (!userId || !product) {
    return res.status(400).json({ error: "userId and product required" });
  }
  const order = await db.createOrder(userId, product, amount || 0);

  await broker.publishOrderEvent(order._id, userId, "created");

  if (email) {
    await mailer.sendOrderConfirmation(email, order._id, amount || 0);
  }

  res.status(201).json({ orderId: order._id });
});

// ── Start ────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;

db.connectMongo()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });
