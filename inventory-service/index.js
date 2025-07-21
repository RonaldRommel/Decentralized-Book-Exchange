const express = require("express");
const AWS = require("aws-sdk");
require("dotenv").config();
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./docs/swagger");

const app = express();
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const dynamo = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION,
  endpoint: process.env.DYNAMO_ENDPOINT,
  accessKeyId: "dummy",
  secretAccessKey: "dummy",
});

const log = (...args) => console.log(`[${new Date().toISOString()}]`, ...args);

/**
 * @swagger
 * /books:
 *   get:
 *     summary: Get all books
 *     tags: [Books]
 *     responses:
 *       200:
 *         description: A list of books
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Book'
 *       500:
 *         description: Server error
 */

app.get("/books", async (req, res) => {
  log("GET /books - Fetching all books");
  try {
    const result = await dynamo.scan({ TableName: "books" }).promise();
    log(`Fetched ${result.Items.length} books`);
    res.json(result.Items);
  } catch (err) {
    log("Error fetching books:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /books/{book_id}:
 *   get:
 *     summary: Get a single book by ID
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: book_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the book
 *     responses:
 *       200:
 *         description: Book details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       404:
 *         description: Book not found
 *       500:
 *         description: Server error
 */

app.get("/books/:book_id", async (req, res) => {
  const { book_id } = req.params;
  log("GET /books/:book_id - Fetching book:", book_id);
  try {
    const result = await dynamo
      .get({
        TableName: "books",
        Key: { book_id },
      })
      .promise();

    if (!result.Item) {
      log("Book not found:", book_id);
      return res.status(404).json({ error: "Book not found" });
    }
    log("Book found:", result.Item);
    res.json(result.Item);
  } catch (err) {
    log("Error fetching book:", err.message);
    res.status(500).json({ error: "Failed to retrieve book" });
  }
});

/**
 * @swagger
 * /books:
 *   post:
 *     summary: Create a new book
 *     tags: [Books]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - owner_id
 *               - available
 *             properties:
 *               title:
 *                 type: string
 *               author:
 *                 type: string
 *               owner_id:
 *                 type: string
 *               available:
 *                 type: boolean
 *               created_at:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Book created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */

app.post("/books", async (req, res) => {
  const { title, author, owner_id, available, created_at } = req.body;
  log("POST /books - Creating book:", { title, author, owner_id, available });
  if (!title || !owner_id || typeof available !== "boolean") {
    log("Validation error - Missing required fields");
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
    log("Book created successfully:", book_id);
    res.status(201).json({ message: "Book added", book_id });
  } catch (err) {
    log("Error inserting book:", err.message);
    res.status(500).json({ error: "Failed to create book" });
  }
});

/**
 * @swagger
 * /books/{id}:
 *   put:
 *     summary: Update book details
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Book ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               available:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Book updated successfully
 *       500:
 *         description: Server error
 */
app.put("/books/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const { title, available } = req.body;

  log("PUT /books/:id - Updating book:", id, { title, available });
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
    log("Book updated:", result.Attributes);
    res.json({ message: "Book updated ok", updated: result.Attributes });
  } catch (err) {
    log("Error updating book:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /books/{id}:
 *   delete:
 *     summary: Delete a book
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Book ID
 *     responses:
 *       200:
 *         description: Book deleted
 *       500:
 *         description: Server error
 */
app.delete("/books/:id", async (req, res) => {
  const { id } = req.params;
  log("DELETE /books/:id - Deleting book:", id);

  try {
    await dynamo
      .delete({
        TableName: "books",
        Key: { book_id: id },
      })
      .promise();
    log("Book deleted:", id);
    res.json({ message: "Book deleted" });
  } catch (err) {
    log("Error deleting book:", err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Inventory service running on port ${PORT}`)
);
