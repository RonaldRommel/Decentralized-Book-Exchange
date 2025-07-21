const { getChannel, connectRabbitMQ } = require("../utils/rabbitmq");
const db = require("../utils/db");
const log = (...args) => console.log(`[${new Date().toISOString()}]`, ...args);
(async () => {
  await connectRabbitMQ();
  const channel = getChannel();
  await channel.assertExchange("validation-complete", "direct", {
    durable: false,
  });
  const queue = await channel.assertQueue("final-validator");
  log("Validator service listening on queue:", queue.queue);
  await channel.bindQueue(queue.queue, "validation-complete", "book.validated");
  await channel.bindQueue(queue.queue, "validation-complete", "user.validated");

  channel.consume(queue.queue, async (msg) => {
    if (msg !== null) {
      const { exchange_id } = JSON.parse(msg.content.toString());
      if (!exchange_id) {
        log("Invalid JSON message:", msg.content.toString());
        channel.ack(msg);
        return;
      }
      log("Validating status of user and book");

      const [rows] = await db.execute(
        "SELECT validation_status_user, validation_status_book,state FROM exchanges WHERE id = ?",
        [exchange_id]
      );
      if (rows.length === 0) {
        log(`Exchange ${exchange_id} not found`);
        channel.ack(msg);
        return;
      }
      const row = rows[0];
      const userStatus = row.validation_status_user === "valid";
      const bookStatus = row.validation_status_book === "valid";
      const isNotPending = row.state !== "pending-validation";
      if (isNotPending) {
        log(`Exchange ${exchange_id} is not in pending-validation state`);
        channel.ack(msg);
        return;
      }
      if (userStatus && bookStatus) {
        await db.execute(
          "UPDATE exchanges SET state = 'requested', updated_at = NOW() WHERE id = ?",
          [exchange_id]
        );
        log(`Exchange ${exchange_id} is valid`);
      }
      if (!userStatus || !bookStatus) {
        await db.execute(
          "UPDATE exchanges SET state = 'rejected', updated_at = NOW() WHERE id = ?",
          [exchange_id]
        );
        log(`Exchange ${exchange_id} is invalid`);
      }
      channel.ack(msg);
    }
  });
})();
