const express = require("express");
const mysql = require("mysql2/promise");
require("dotenv").config();

const app = express();
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: "root",
  password: "root",
  database: "bookdb",
  waitForConnections: true,
  connectionLimit: 10,
  port: 3306,
});

app.post("/users", async (req, res) => {
  const { name, email } = req.body;
  try {
    const [result] = await pool.query(
      "INSERT INTO users (name, email, reputation) VALUES (?, ?, ?)",
      [name, email, 0]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    if (rows.length === 0)
      return res.status(404).json({ error: "User not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/users/:id/reputation", async (req, res) => {
  const { id } = req.params;
  const { reputation } = req.body;
  try {
    await pool.query("UPDATE users SET reputation = ? WHERE id = ?", [
      reputation,
      id,
    ]);
    res.json({ message: "Reputation updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`User service running on port ${PORT}`));
