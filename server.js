const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "config.env") });

const app = express();
const PORT = process.env.PORT || 5000;
const ATLAS_URI = process.env.ATLAS_URI || "";

mongoose.connect(ATLAS_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB error:", err.message);
    process.exit(1);
  });

const User = mongoose.model("User", new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}));

app.use(cors());
app.use(express.json());

app.post("/api/register", async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json({ message: "Registered successfully", user });
  } catch (err) {
    res.status(500).json({ error: "Email already exists" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    res.json({ message: `Welcome ${user.name}`, user });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/api/records", async (req, res) => {
  try {
    const users = await User.find().lean();
    const normalized = users.map(u => ({ 
      ...u, 
      id: u._id.toString() 
    }));
    res.json(normalized);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch users" });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { requesterEmail } = req.body;

    const userToDelete = await User.findById(id);
    if (!userToDelete) return res.status(404).json({ error: "User not found" });

    if (userToDelete.email !== requesterEmail) {
      return res.status(403).json({ error: "You can only delete your own data, fat." });
    }

    await User.findByIdAndDelete(id);
    res.json({ message: "Your data has been removed successfully." });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

app.use(express.static(path.join(__dirname, "build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
