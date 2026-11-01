const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const sqlite3 = require("sqlite3").verbose();

const dataDir = path.join(__dirname, "data");
const dbPath = path.join(dataDir, "admin.db");

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

ensureDir(dataDir);
const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

async function initDb() {
  await run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      last4 TEXT NOT NULL,
      ssn_last4 TEXT NOT NULL,
      role TEXT NOT NULL
    )`
  );

  await run(
    `CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      api_key TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`
  );

  const userCount = await get("SELECT COUNT(*) AS count FROM users");
  if (userCount.count === 0) {
    await run(
      `INSERT INTO users (username, password, name, email, last4, ssn_last4, role)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        "admin",
        "adminpass",
        "Dana Admin",
        "admin@internal.example",
        "1337",
        "8421",
        "admin",
      ]
    );
    await run(
      `INSERT INTO users (username, password, name, email, last4, ssn_last4, role)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        "jordan",
        "jordanpass",
        "Jordan Lee",
        "jordan.lee@internal.example",
        "4729",
        "2271",
        "user",
      ]
    );
    await run(
      `INSERT INTO users (username, password, name, email, last4, ssn_last4, role)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        "sam",
        "sampass",
        "Sam Rivera",
        "sam.rivera@internal.example",
        "8890",
        "3004",
        "user",
      ]
    );
  }

  const settingsCount = await get("SELECT COUNT(*) AS count FROM settings");
  if (settingsCount.count === 0) {
    await run(
      "INSERT INTO settings (api_key, updated_at) VALUES (?, ?)",
      [crypto.randomBytes(24).toString("hex"), new Date().toISOString()]
    );
  }
}

async function listUsers() {
  return all(
    `SELECT id, name, email, last4, ssn_last4, role
     FROM users
     ORDER BY id`
  );
}

async function findUserByCredentials(username, password) {
  return get(
    `SELECT id, username, name, email, role
     FROM users
     WHERE username = ? AND password = ?`,
    [username, password]
  );
}

async function createUser(user) {
  const result = await run(
    `INSERT INTO users (username, password, name, email, last4, ssn_last4, role)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      user.username,
      user.password,
      user.name,
      user.email,
      user.last4,
      user.ssn_last4,
      user.role,
    ]
  );
  return result.lastID;
}

async function deleteUserById(userId) {
  const result = await run("DELETE FROM users WHERE id = ?", [userId]);
  return result.changes;
}

async function updateUserRole(userId, role) {
  const result = await run("UPDATE users SET role = ? WHERE id = ?", [
    role,
    userId,
  ]);
  return result.changes;
}

async function rotateApiKey() {
  const newKey = crypto.randomBytes(24).toString("hex");
  await run("UPDATE settings SET api_key = ?, updated_at = ?", [
    newKey,
    new Date().toISOString(),
  ]);
  return newKey;
}

module.exports = {
  initDb,
  listUsers,
  findUserByCredentials,
  createUser,
  deleteUserById,
  updateUserRole,
  rotateApiKey,
};
