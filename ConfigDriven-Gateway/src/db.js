/**
 * Database helpers — MongoDB (tls=false) and Redis (redis://).
 * CWE-319 Tier 2: cleartext DB connections configured via .env.
 */
const mongoose = require("mongoose");
const Redis = require("ioredis");

// ── MongoDB (tls=false) ──────────────────────────────────────

function connectMongo() {
  return mongoose.connect(process.env.MONGO_URI);
}

const OrderSchema = new mongoose.Schema({
  userId: Number,
  product: String,
  amount: Number,
});
const Order = mongoose.model("Order", OrderSchema);

async function fetchOrders(userId) {
  return Order.find({ userId });
}

async function createOrder(userId, product, amount) {
  const order = new Order({ userId, product, amount });
  return order.save();
}

// ── Redis (redis:// — no TLS) ────────────────────────────────

let redisClient;

function getRedis() {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL);
  }
  return redisClient;
}

async function cacheSession(sessionId, userData, ttl = 3600) {
  const redis = getRedis();
  await redis.setex(sessionId, ttl, JSON.stringify(userData));
}

async function loadSession(sessionId) {
  const redis = getRedis();
  const val = await redis.get(sessionId);
  return val ? JSON.parse(val) : null;
}

module.exports = {
  connectMongo,
  fetchOrders,
  createOrder,
  getRedis,
  cacheSession,
  loadSession,
};
