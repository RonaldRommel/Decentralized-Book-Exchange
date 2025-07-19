const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Exchange Service API",
      version: "1.0.0",
      description: "Handles book exchanges and coordinates validations",
    },
    servers: [{ url: "http://localhost:3002" }],
  },
  apis: ["./index.js"], // Adjust path if routes are separated
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;
