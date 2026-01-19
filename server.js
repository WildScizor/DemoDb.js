const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// Path to our "database" file
const DB_PATH = path.join(__dirname, "db.json");

// Ensure db.json exists with a basic structure
function initDb() {
  if (!fs.existsSync(DB_PATH)) {
    const initialData = { users: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), "utf-8");
  }
}

function readDb() {
  initDb();
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  try {
    const data = JSON.parse(raw);
    // Always keep users deduplicated on read
    const cleaned = dedupeUsers(data);
    // Persist any cleanup back to disk
    writeDb(cleaned);
    return cleaned;
  } catch (err) {
    console.error("Failed to parse db.json, resetting file:", err);
    const initialData = { users: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), "utf-8");
    return initialData;
  }
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

function normalizeEmail(email) {
  return (email || "").trim().toLowerCase();
}

function dedupeUsers(db) {
  if (!db || !Array.isArray(db.users)) return db;
  const seen = new Set();
  db.users = db.users.filter((u) => {
    const key = normalizeEmail(u.email);
    if (!key) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return db;
}

// Middleware
app.use(cors());
app.use(express.json());

// CRUD routes for users

// CREATE user
app.post("/users", (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email and password are required" });
  }

  let db = readDb();
  db = dedupeUsers(db);

  const normalizedEmail = normalizeEmail(email);

  // Check if user already exists by email (case/space insensitive)
  const existingUser = db.users.find(
    (u) => normalizeEmail(u.email) === normalizedEmail
  );
  if (existingUser) {
    return res
      .status(409)
      .json({ message: "User Not Available", userNotAvailable: true });
  }

  // Simple unique id generation
  const newId =
    db.users.length > 0 ? Math.max(...db.users.map((u) => u.id || 0)) + 1 : 1;

  const newUser = {
    id: newId,
    name: name.trim(),
    email: normalizedEmail,
    password,
    confirmPassword: confirmPassword || "",
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  writeDb(db);

  return res
    .status(201)
    .json({ message: "Registered successfully", user: newUser });
});

// LOGIN (signin) - simple email/password match
app.post("/login", (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "email and password are required for login" });
    }

    let db = readDb();
    db = dedupeUsers(db);
    const normalizedEmail = normalizeEmail(email);
    const user = db.users.find(
      (u) => normalizeEmail(u.email) === normalizedEmail && u.password === password
    );

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // For now, just return the user data (no JWT/session)
    return res.json({ message: `Welcome ${user.name}`, user });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// READ all users
app.get("/users", (req, res) => {
  let db = readDb();
  db = dedupeUsers(db);
  writeDb(db);
  res.json(db.users);
});

// READ single user by id
app.get("/users/:id", (req, res) => {
  const id = Number(req.params.id);
  const db = readDb();
  const user = db.users.find((u) => u.id === id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json(user);
});

// UPDATE user (full update)
app.put("/users/:id", (req, res) => {
  const id = Number(req.params.id);
  const db = readDb();
  const index = db.users.findIndex((u) => u.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  const existing = db.users[index];
  const updated = {
    ...existing,
    ...req.body,
    id, // ensure id is not changed
  };

  db.users[index] = updated;
  writeDb(db);

  res.json(updated);
});

// PARTIAL UPDATE user
app.patch("/users/:id", (req, res) => {
  const id = Number(req.params.id);
  const db = readDb();
  const index = db.users.findIndex((u) => u.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  const existing = db.users[index];
  const updated = {
    ...existing,
    ...req.body,
    id, // keep id immutable
  };

  db.users[index] = updated;
  writeDb(db);

  res.json(updated);
});

// DELETE user
app.delete("/users/:id", (req, res) => {
  const id = Number(req.params.id);
  const db = readDb();
  const index = db.users.findIndex((u) => u.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  const [removed] = db.users.splice(index, 1);
  writeDb(db);

  res.json({ deleted: removed });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

