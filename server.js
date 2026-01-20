const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

// Load config (config.env for local; set env vars in Vercel dashboard)
dotenv.config({ path: path.join(__dirname, "config.env") });


const app = express();
const PORT = process.env.PORT || 5000;
const ATLAS_URI = process.env.ATLAS_URI || "";
console.log("ATLAS_URI =", process.env.ATLAS_URI);

// Connect to MongoDB Atlas
mongoose
  .connect(ATLAS_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

// User schema & model
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    confirmPassword: { type: String, default: "" },
  },
  { timestamps: true }
);

userSchema.set("toJSON", {
  virtuals: true,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.model("User", userSchema);

// Middleware
app.use(cors());
app.use(express.json());

// CREATE user
app.post("/users", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email and password are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() }).lean();
    if (existing) {
      return res
        .status(409)
        .json({ message: "User Not Available", userNotAvailable: true });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      confirmPassword: confirmPassword || "",
    });

    return res
      .status(201)
      .json({ message: "Registered successfully", user: user.toJSON() });
  } catch (err) {
    console.error("Create user error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// LOGIN (signin)
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "email and password are required for login" });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      password,
    }).lean();

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    return res.json({
      message: `Welcome ${user.name}`,
      user: { ...user, id: user._id.toString() },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// READ all users
app.get("/users", async (_req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    const normalized = users.map((u) => ({ ...u, id: u._id.toString() }));
    return res.json(normalized);
  } catch (err) {
    console.error("List users error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// READ single user by id
app.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({ ...user, id: user._id.toString() });
  } catch (err) {
    return res.status(404).json({ error: "User not found" });
  }
});

// UPDATE user (full)
app.put("/users/:id", async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).lean();
    if (!updated) return res.status(404).json({ error: "User not found" });
    return res.json({ ...updated, id: updated._id.toString() });
  } catch (err) {
    console.error("Update user error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PARTIAL UPDATE user
app.patch("/users/:id", async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).lean();
    if (!updated) return res.status(404).json({ error: "User not found" });
    return res.json({ ...updated, id: updated._id.toString() });
  } catch (err) {
    console.error("Patch user error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE user
app.delete("/users/:id", async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id).lean();
    if (!deleted) return res.status(404).json({ error: "User not found" });
    return res.json({ deleted: { ...deleted, id: deleted._id.toString() } });
  } catch (err) {
    console.error("Delete user error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, 0.0.0.0, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

