// utils/rabbitmq.js
const amqp = require("amqplib");

let channel;

async function connectRabbitMQ(retries = 5, delay = 5000) {
  while (retries) {
    try {
      const connection = await amqp.connect("amqp://guest:guest@rabbitmq:5672");
      channel = await connection.createChannel();
      return channel;
    } catch (error) {
      console.error("Failed to connect to RabbitMQ:", error);
      retries--;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Could not connect to RabbitMQ after multiple attempts.");
}

function getChannel() {
  if (!channel) throw new Error("RabbitMQ channel not initialized.");
  return channel;
}

module.exports = { connectRabbitMQ, getChannel };
