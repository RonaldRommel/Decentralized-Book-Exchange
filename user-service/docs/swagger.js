const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const fs = require("fs");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "User Service API",
      version: "1.0.0",
      description: "API for managing users and reputations",
    },
    servers: [{ url: "http://localhost:3001" }],
    components: {
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            name: { type: "string", example: "Alice" },
            email: { type: "string", example: "alice@example.com" },
            reputation: { type: "integer", example: 0 },
          },
          required: ["name", "email"],
        },
        ReputationUpdate: {
          type: "object",
          properties: {
            reputation: { type: "integer", example: 10 },
          },
          required: ["reputation"],
        },
      },
    },
  },
  apis: ["./index.js"], // Path to your route file(s)
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;
