const { getChannel, connectRabbitMQ } = require("../utils/rabbitmq");
const db = require("../utils/db");

(async () => {
  await connectRabbitMQ();
  const channel = getChannel();
  const queue = "validate-user";
  await channel.assertQueue(queue);

  console.log("🧑‍💼 User validator listening on", queue);

  channel.consume(queue, async (msg) => {
    if (msg !== null) {
      const { exchange_id, user_id } = JSON.parse(msg.content.toString());
      if (!exchange_id || !user_id) {
        console.error("❌ Invalid message format", msg.content.toString());
        channel.ack(msg);
        return;
      }
      console.log("🔍 Validating user", user_id);

      const [rows] = await db.execute("SELECT id FROM users WHERE id = ?", [
        user_id,
      ]);
      const isValid = rows.length > 0;
      const status = isValid ? "valid" : "invalid";
      await db.execute(
        "UPDATE exchanges SET validation_status_user = ?, updated_at = NOW() WHERE id = ?",
        [status, exchange_id]
      );
      console.log(`✅ User ${user_id} is ${status}`);
      channel.ack(msg);
    }
  });
})();
