/**
 * Email notifications — SMTP on port 25, no TLS.
 * CWE-319 Tier 2: SMTP_HOST and SMTP_PORT from .env, no STARTTLS.
 */
const nodemailer = require("nodemailer");

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: false,
    tls: { rejectUnauthorized: false },
  });
}

async function sendOrderConfirmation(toAddr, orderId, total) {
  const transport = createTransport();
  await transport.sendMail({
    from: "noreply@corp.internal",
    to: toAddr,
    subject: `Order #${orderId} confirmed`,
    text: `Your order #${orderId} for $${total.toFixed(2)} has been confirmed.`,
  });
}

module.exports = { sendOrderConfirmation };
