// exchange-service/rabbit.js
const amqp = require("amqplib");

let channel;

async function connectRabbit() {
  const connection = await amqp.connect("amqp://rabbitmq");
  channel = await connection.createChannel();
  await channel.assertExchange("exchange_events", "fanout", { durable: true });
}

function publishEvent(event) {
  if (!channel) {
    throw new Error("RabbitMQ channel is not initialized");
  }

  const message = Buffer.from(JSON.stringify(event));
  channel.publish("exchange_events", "", message);
}

module.exports = {
  connectRabbit,
  publishEvent,
};
