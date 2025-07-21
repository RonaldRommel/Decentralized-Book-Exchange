const express = require("express");
const mysql = require("mysql2/promise");
require("dotenv").config();
const db = require("../utils/db.js");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./docs/swagger");

const app = express();
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const log = (...args) => {
  console.log(`[${new Date().toISOString()}]`, ...args);
};

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *       500:
 *         description: Server error
 */
app.post("/users", async (req, res) => {
  const { name, email } = req.body;
  log("POST /users - Creating user:", { name, email });
  try {
    const [result] = await db.query(
      "INSERT INTO users (name, email, reputation) VALUES (?, ?, ?)",
      [name, email, 0]
    );
    log("User created successfully with ID:", result.insertId);
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    log("Error creating user:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user by id
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
app.get("/users/:id", async (req, res) => {
  const { id } = req.params;
  log("GET /users/:id - Fetching user with ID:", id);
  try {
    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
    if (rows.length === 0) {
      log("User not found:", id);
      return res.status(404).json({ error: "User not found" });
    }
    log("User retrieved:", rows[0]);
    res.json(rows[0]);
  } catch (err) {
    log("Error retrieving user:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: User objects
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
app.get("/users", async (req, res) => {
  try {
    log("GET /users - Fetching all users");
    const [rows] = await db.query("SELECT * FROM users");
    if (rows.length === 0) {
      log("No users found");
      return res.status(404).json({ error: "User not found" });
    }
    log(`Retrieved ${rows.length} users`);
    res.json(rows);
  } catch (err) {
    log("Error retrieving users:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /users/{id}/reputation:
 *   put:
 *     summary: Update user's reputation
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReputationUpdate'
 *     responses:
 *       200:
 *         description: Reputation updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error
 */
app.put("/users/:id/reputation", async (req, res) => {
  const { id } = req.params;
  const { reputation } = req.body;
  log(`PUT /users/${id}/reputation - Updating reputation to:`, reputation);
  try {
    await db.query("UPDATE users SET reputation = ? WHERE id = ?", [
      reputation,
      id,
    ]);
    log(`Reputation updated for user ID ${id}`);
    res.json({ message: "Reputation updated" });
  } catch (err) {
    log("Error updating reputation:", err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => console.log(`User service running on port ${PORT}`));
}
module.exports = app; // Export for testing
