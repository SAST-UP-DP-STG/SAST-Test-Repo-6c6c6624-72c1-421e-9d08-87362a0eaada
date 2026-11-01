const path = require("path");
const crypto = require("crypto");
const express = require("express");
const {
  initDb,
  listUsers,
  findUserByCredentials,
  createUser,
  deleteUserById,
  updateUserRole,
  rotateApiKey,
} = require("./db");

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const HOST = process.env.HOST || "0.0.0.0";
const publicDir = path.join(__dirname, "public");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(publicDir));
app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "login.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(publicDir, "login.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});


const dbReady = initDb();

app.post("/api/login", async (req, res) => {
  try {
    await dbReady;
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: "Username and password required." });
      return;
    }

    const user = await findUserByCredentials(username, password);
    if (!user) {
      res.status(401).json({ error: "Invalid credentials." });
      return;
    }

    const token = crypto.randomBytes(16).toString("hex");
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: "Login failed." });
  }
});

app.get("/api/records", async (req, res) => {
  try {
    await dbReady;
    const users = await listUsers();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: "Failed to load records." });
  }
});

app.post("/api/users/create", async (req, res) => {
  try {
    await dbReady;
    const { username, password, name, email, last4, ssn_last4, role } = req.body;
    if (
      !username ||
      !password ||
      !name ||
      !email ||
      !last4 ||
      !ssn_last4 ||
      !role
    ) {
      res.status(400).json({ error: "All user fields are required." });
      return;
    }

    const userId = await createUser({
      username,
      password,
      name,
      email,
      last4,
      ssn_last4,
      role,
    });
    res.json({ userId });
  } catch (error) {
    res.status(500).json({ error: "User creation failed." });
  }
});

app.post("/api/users/delete", async (req, res) => {
  try {
    await dbReady;
    const { id } = req.body;
    if (!id) {
      res.status(400).json({ error: "User id is required." });
      return;
    }

    const changes = await deleteUserById(id);
    if (changes === 0) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    res.json({ deleted: true });
  } catch (error) {
    res.status(500).json({ error: "Delete failed." });
  }
});

app.post("/api/users/role", async (req, res) => {
  try {
    await dbReady;
    const { id, role } = req.body;
    if (!id || !role) {
      res.status(400).json({ error: "User id and role are required." });
      return;
    }

    const changes = await updateUserRole(id, role);
    if (changes === 0) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    res.json({ updated: true });
  } catch (error) {
    res.status(500).json({ error: "Role update failed." });
  }
});

app.post("/api/dev/generate-key", async (req, res) => {
  try {
    await dbReady;
    const apiKey = await rotateApiKey();
    res.json({ apiKey, generatedAt: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: "API key generation failed." });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`Admin console listening on http://${HOST}:${PORT}`);
});
