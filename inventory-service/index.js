const express = require("express");
const AWS = require("aws-sdk");
require("dotenv").config();

const app = express();
app.use(express.json());

const dynamo = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION,
  endpoint: process.env.DYNAMO_ENDPOINT,
  accessKeyId: "dummy",
  secretAccessKey: "dummy",
});

// Routes
app.get("/books", async (req, res) => {
  try {
    const result = await dynamo.scan({ TableName: "books" }).promise();
    res.json(result.Items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/books/:book_id", async (req, res) => {
  const { book_id } = req.params;

  try {
    const result = await dynamo
      .get({
        TableName: "books",
        Key: { book_id },
      })
      .promise();

    if (!result.Item) {
      return res.status(404).json({ error: "Book not found" });
    }

    res.json(result.Item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve book" });
  }
});

app.post("/books", async (req, res) => {
  const { title, author, owner_id, available, created_at } = req.body;

  if (!title || !owner_id || typeof available !== "boolean") {
    return res.status(400).json({
      error: "title, owner_id, and available (boolean) are required",
    });
  }

  // Auto-generate book_id based on timestamp
  const timestamp = Date.now();
  const book_id = `book-${timestamp}`;

  try {
    await dynamo
      .put({
        TableName: "books",
        Item: {
          book_id,
          title,
          author: author || "Unknown",
          owner_id,
          available,
          created_at: created_at || new Date().toISOString(),
        },
      })
      .promise();

    res.status(201).json({ message: "Book added", book_id });
  } catch (err) {
    console.error("Error inserting book:", err);
    res.status(500).json({ error: "Failed to create book" });
  }
});

app.put("/books/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const updateParams = {
      TableName: "books",
      Key: { book_id: id },
      UpdateExpression: "set #title = :title, #available = :available",
      ExpressionAttributeNames: {
        "#title": "title",
        "#available": "available",
      },
      ExpressionAttributeValues: {
        ":title": updates.title,
        ":available": updates.available,
      },
      ConditionExpression: "attribute_exists(book_id)",
      ReturnValues: "UPDATED_NEW",
    };

    const result = await dynamo.update(updateParams).promise();
    res.json({ message: "Book updated ok", updated: result.Attributes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/books/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await dynamo
      .delete({
        TableName: "books",
        Key: { book_id: id },
      })
      .promise();

    res.json({ message: "Book deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Inventory service running on port ${PORT}`)
);
