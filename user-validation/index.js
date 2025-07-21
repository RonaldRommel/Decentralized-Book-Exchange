const { getChannel, connectRabbitMQ } = require("../utils/rabbitmq");
const db = require("../utils/db");
const log = (...args) => console.log(`[${new Date().toISOString()}]`, ...args);
(async () => {
  await connectRabbitMQ();
  const channel = getChannel();
  const queue = "validate-user";
  await channel.assertExchange("validation-complete", "direct", { durable: false });
  await channel.assertQueue("final-validator")
  await channel.assertQueue(queue);
  log("User validator listening on queue:", queue);

  console.log("🧑‍💼 User validator listening on", queue);

  channel.consume(queue, async (msg) => {
    if (msg !== null) {
      const { exchange_id, user_id } = JSON.parse(msg.content.toString());
      if (!exchange_id || !user_id) {
        log("Invalid JSON message:", msg.content.toString());
        channel.ack(msg);
        return;
      }
      console.log("🔍 Validating user", user_id);

      const [rows] = await db.execute("SELECT id FROM users WHERE id = ?", [
        user_id,
      ]);
      const isValid = rows.length > 0;
      const status = isValid ? "valid" : "invalid";
      try {
        await db.execute(
          "UPDATE exchanges SET validation_status_user = ?, updated_at = NOW() WHERE id = ?",
          [status, exchange_id]
        );
        log(`Validation complete - User ${user_id} is ${status}`);
        channel.publish(
          "validation-complete",
          "user.validated",
          Buffer.from(JSON.stringify({ exchange_id, user_id, status }))
        );
        channel.ack(msg);
      } catch (error) {
        log("Database error during validation:", error);
        channel.nack(msg, false, false); // Do not requeue the message
      }
    }
  });



})();
