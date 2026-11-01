/**
 * Message broker — RabbitMQ over amqp:// (cleartext).
 * CWE-319 Tier 2: connection URL from .env uses amqp:// (not amqps://).
 */
const amqp = require("amqplib");

let connection;
let channel;

async function getChannel() {
  if (!channel) {
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue("orders", { durable: true });
  }
  return channel;
}

async function publishOrderEvent(orderId, userId, action) {
  const ch = await getChannel();
  const body = JSON.stringify({ orderId, userId, action });
  ch.sendToQueue("orders", Buffer.from(body), { persistent: true });
}

async function close() {
  if (channel) await channel.close();
  if (connection) await connection.close();
}

module.exports = { publishOrderEvent, close };
