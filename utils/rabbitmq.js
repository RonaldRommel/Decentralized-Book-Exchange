// utils/rabbitmq.js
const amqp = require("amqplib");

let channel;

async function connectRabbitMQ() {
  const connection = await amqp.connect("amqp://guest:guest@rabbitmq:5672");
  channel = await connection.createChannel();
  return channel;
}

function getChannel() {
  if (!channel) throw new Error("RabbitMQ channel not initialized.");
  return channel;
}

module.exports = { connectRabbitMQ, getChannel };
