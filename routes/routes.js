import express from "express"
import db from "..db/connection.js"
import {ObjectId} from "mongodb"

const Router = express.Router();

// CREATE user
Router.post("/", async (req, res) => {
  try {
    const newUser = req.body;
    const result = await db.collection("users").insertOne(newUser);
    res.status(201).json({ message: "Registered successfully", userId: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  } 
});

// LOGIN (signin) - simple email/password match
Router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required for login" });
    }   
    const user = await db.collection("users").findOne({ email: email, password: password });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    return res.json({ message: `Welcome ${user.name}`, user });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

Router.get("/", async (req, res) => {
  let collection = await db.collection("records");
  let results = await collection.find({}).toArray();
  res.send(results).status(200);
});
// READ single user by id
Router.get("/:id", async (req, res) => {
  let collection = await db.collection("users");
  let query = { _id: new ObjectId(req.params.id) };
  let result = await collection.findOne(query);
  
    if (!result) res.send("Not Found").status(404);
    else res.send(result).status(200);
});

export default Router;
