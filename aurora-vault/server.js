const express = require("express");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const { db, initDb } = require("./db");

initDb();

const app = express();
const port = 4000;

app.use(express.json());

app.use((req, res, next) => {
  const requestId = req.get("x-request-id") || uuidv4();
  req.requestId = requestId;
  res.set("x-request-id", requestId);
  next();
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", requestId: req.requestId });
});


app.post("/api/confirm", (req, res) => {
  const { userId, alias, unlockValue } = req.body || {};
  if (!userId || !alias || !unlockValue) {
    return res.status(400).json({ error: "Missing confirm fields", requestId: req.requestId });
  }
  res.json({ status: "confirmed", requestId: req.requestId });
});

app.post("/api/api-keys", (req, res) => {
  const { userId, label, apiKey } = req.body || {};
  const keyLabel = label || "Primary key";
  if (!userId || !apiKey) {
    return res.status(400).json({ error: "Missing API key fields", requestId: req.requestId });
  }
  const createdAt = new Date().toISOString();
  const info = db
    .prepare(
      "INSERT INTO api_keys (user_id, label, api_key, created_at) VALUES (?, ?, ?, ?)"
    )
    .run(userId, keyLabel, apiKey, createdAt);
  res.status(201).json({
    apiKey: { id: info.lastInsertRowid, userId, label: keyLabel, apiKey, createdAt },
    requestId: req.requestId
  });
});

app.get("/api/api-keys", (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).json({ error: "userId is required", requestId: req.requestId });
  }
  const rows = db
    .prepare(
      "SELECT id, user_id as userId, label, api_key as apiKey, created_at as createdAt FROM api_keys WHERE user_id = ? ORDER BY id DESC"
    )
    .all(userId);
  res.json({ apiKeys: rows, requestId: req.requestId });
});

app.use(express.static(path.join(__dirname, "public")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use((err, req, res, next) => {
  res.status(500).json({ error: "Unexpected error", requestId: req.requestId });
});

app.listen(port, () => {
  process.stdout.write(`Aurora Vault running at http://localhost:${port}\n`);
});
