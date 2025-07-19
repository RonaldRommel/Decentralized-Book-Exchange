const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Exchange Service API",
      version: "1.0.0",
      description: "Handles book exchanges and coordinates validations",
    },
    servers: [{ url: "http://localhost:3000" }],
    components: {
      schemas: {
        Book: {
          type: "object",
          properties: {
            book_id: { type: "string" },
            title: { type: "string" },
            author: { type: "string" },
            owner_id: { type: "string" },
            available: { type: "boolean" },
            created_at: { type: "string", format: "date-time" },
          },
          required: ["book_id", "title", "owner_id", "available", "created_at"],
        },
      },
    },
  },
  apis: ["./index.js"], // Adjust path if routes are separated
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;
