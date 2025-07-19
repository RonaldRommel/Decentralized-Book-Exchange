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
  try {
    const result = await dynamo.scan({ TableName: "books" }).promise();
    res.json(result.Items);
  } catch (err) {
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
