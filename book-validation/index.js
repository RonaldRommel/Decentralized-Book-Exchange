const { getChannel, connectRabbitMQ } = require("../utils/rabbitmq");
const db = require("../utils/db");
const axios = require("axios");

(async () => {
  await connectRabbitMQ();
  const channel = getChannel();
  const queue = "validate-book";
  await channel.assertQueue(queue);

  console.log("🧑‍💼 User validator listening on", queue);

  channel.consume(queue, async (msg) => {
    if (msg !== null) {
      const { exchange_id, book_id } = JSON.parse(msg.content.toString());
      if (!exchange_id || !book_id) {
        console.error("❌ Invalid message format", msg.content.toString());
        channel.ack(msg);
        return;
      }
      console.log("🔍 Validating book", book_id);
      let response;
      let status = "invalid";
      try {
        response = await axios.get(
          `http://inventory-service:3000/books/${book_id}`
        );
        status = "valid";
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.error("❌ Book not found:", book_id);
          status = "invalid";
        } else {
          console.error("❌ Error validating book:", error.message);
        }
      } finally {
        await db.execute(
          "UPDATE exchanges SET validation_status_book = ?, updated_at = NOW() WHERE id = ?",
          [status, exchange_id]
        );
        console.log(`✅ Book ${book_id} is ${status}`);
        channel.ack(msg);
      }
    }
  });
})();
