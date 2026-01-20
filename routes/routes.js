// const express = require("express");
// const { ObjectId } = require("mongodb");
// const mongoose = require("mongoose");
// const Router = express.Router();

// Router.post("/register", async (req, res) => {
//   try {
//     const db = mongoose.connection.db;
//     const result = await db.collection("users").insertOne(req.body);
//     res.status(201).json({ message: "Registered successfully", userId: result.insertedId });
//   } catch (error) {
//     res.status(500).json({ error: "Internal Server Error" });
//   } 
// });

// Router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const db = mongoose.connection.db;
//     const user = await db.collection("users").findOne({ email, password });
//     if (!user) return res.status(401).json({ error: "Invalid credentials" });
//     res.json({ message: `Welcome ${user.name}`, user });
//   } catch (err) {
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// module.exports = Router;
