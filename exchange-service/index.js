const express = require("express");
require("dotenv").config();
const { getChannel, connectRabbitMQ } = require("../utils/rabbitmq");
const db = require("../utils/db");

const app = express();
app.use(express.json());

app.post("/exchange", async (req, res) => {
  const { book_id, borrower_id, lender_id } = req.body;

  const result = await db.query(
    "INSERT INTO exchanges (book_id, borrower_id, lender_id, state) VALUES (?, ?, ?, 'pending-validation')",
    [book_id, borrower_id, lender_id]
  );

  const exchangeId = result.insertId;
  const channel = getChannel();

  // Publish validation events
  channel.assertQueue("validate-user");
  channel.assertQueue("validate-book");

  channel.sendToQueue(
    "validate-user",
    Buffer.from(
      JSON.stringify({
        exchange_id: exchangeId,
        user_id: borrower_id,
      })
    )
  );

  channel.sendToQueue(
    "validate-book",
    Buffer.from(
      JSON.stringify({
        exchange_id: exchangeId,
        book_id: book_id,
      })
    )
  );
  res.status(202).json({ message: "Exchange created, pending validation" });
});

// // Helper function to check if user exists
// async function userExists(userId) {
//   const [rows] = await db.query("SELECT 1 FROM users WHERE id = ?", [userId]);
//   return rows.length > 0;
// }

// // Helper function to check if book exists
// // This assumes you have inventory-service endpoint to check book existence
// // For now, stub to always true or add actual call to inventory-service
// async function bookExists(bookId) {
//   // TODO: Replace with actual inventory-service call or DynamoDB check
//   return true;
// }

// // POST /exchanges - create a borrow request
// app.post("/exchanges", async (req, res) => {
//   const { book_id, borrower_id, lender_id } = req.body;

//   if (!book_id || !borrower_id || !lender_id) {
//     return res
//       .status(400)
//       .json({ error: "book_id, borrower_id and lender_id are required" });
//   }

//   try {
//     // Validate users
//     if (!(await userExists(borrower_id)) || !(await userExists(lender_id))) {
//       return res.status(400).json({ error: "Invalid borrower or lender ID" });
//     }

//     // Validate book
//     if (!(await bookExists(book_id))) {
//       return res.status(404).json({ error: "Book not found" });
//     }

//     // Insert new exchange request
//     const [result] = await db.query(
//       "INSERT INTO exchanges (book_id, borrower_id, lender_id, state) VALUES (?, ?, ?, 'requested')",
//       [book_id, borrower_id, lender_id]
//     );

//     res
//       .status(201)
//       .json({ exchange_id: result.insertId, message: "Exchange requested" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// GET /exchanges/:id - get exchange details
app.get("/exchanges/:id", async (req, res) => {
  const exchangeId = req.params.id;

  try {
    const [rows] = await db.query("SELECT * FROM exchanges WHERE id = ?", [
      exchangeId,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Exchange not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /exchanges/:id/state - update exchange state
app.put("/exchanges/:id/state", async (req, res) => {
  const exchangeId = req.params.id;
  const { state } = req.body;
  const validStates = [
    "requested",
    "accepted",
    "rejected",
    "returned",
    "completed",
    "cancelled",
  ];

  if (!state || !validStates.includes(state)) {
    return res.status(400).json({
      error: `State is required and must be one of: ${validStates.join(", ")}`,
    });
  }

  try {
    const [result] = await db.query(
      "UPDATE exchanges SET state = ?, updated_at = NOW() WHERE id = ?",
      [state, exchangeId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Exchange not found" });
    }

    res.json({ message: `Exchange state updated to ${state}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /exchanges?user_id= - list exchanges for a user (borrower or lender)
app.get("/exchanges", async (req, res) => {
  const userId = req.query.user_id;
  if (!userId) {
    return res
      .status(400)
      .json({ error: "user_id query parameter is required" });
  }

  try {
    const [rows] = await db.query(
      "SELECT * FROM exchanges WHERE borrower_id = ? OR lender_id = ? ORDER BY requested_at DESC",
      [userId, userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3002;
async function start() {
  await connectRabbitMQ();
  app.listen(PORT, () => {
    console.log(`Exchange service running on port ${PORT}`);
  });
}
start();
