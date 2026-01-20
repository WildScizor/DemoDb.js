const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "config.env") });

const app = express();
const PORT = process.env.PORT || 5000;
const ATLAS_URI = process.env.ATLAS_URI || "";

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

app.use(cors());
app.use(express.json());

app.post("/register", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Required fields missing" });
    }
    const existing = await User.findOne({ email: email.toLowerCase().trim() }).lean();
    if (existing) {
      return res.status(409).json({ message: "Email already exists" });
    }
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      confirmPassword: confirmPassword || "",
    });
    return res.status(201).json({ message: "Registered successfully", user: user.toJSON() });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Credentials required" });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim(), password }).lean();
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    return res.json({ message: `Welcome ${user.name}`, user: { ...user, id: user._id.toString() } });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/all-data", async (_req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    return res.json(users.map((u) => ({ ...u, id: u._id.toString() })));
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.use(express.static(path.join(__dirname, "build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
