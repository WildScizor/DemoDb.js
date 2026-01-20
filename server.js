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
  .catch(err => console.error("MongoDB error:", err));

app.use(cors());
app.use(express.json());

// This handles the logic you had in routes.js
app.post("/register", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const result = await db.collection("users").insertOne(req.body);
    res.status(201).json({ message: "Registered successfully", userId: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  } 
});

// This serves your frontend
app.use(express.static(path.join(__dirname, "build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
