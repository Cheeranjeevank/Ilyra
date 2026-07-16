const nodemailer = require("nodemailer");

// Create SMTP transporter if configured
const isSmtpConfigured = !!(
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
);

let transporter = null;
if (isSmtpConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for others
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  console.log("Mail Transport Configured ✅");
} else {
  console.log("Mail Transport running in SIMULATED mode ℹ️ (No SMTP settings in .env)");
}

/**
 * Sends an order confirmation email to the user.
 * @param {string} toEmail - The recipient's email address.
 * @param {object} order - The created order object containing details.
 * @param {Array} items - Array of items in the order.
 * @param {object} address - Shipping address object.
 */
async function sendOrderEmail(toEmail, order, items, address) {
  const orderId = order.id || "N/A";
  const total = order.total || 0;
  const dateStr = new Date(order.created_at || new Date()).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Build items HTML list
  const itemsHtml = items
    .map((item) => {
      const sizeStr = item.size ? `<span style="font-size: 11px; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: #475569; margin-right: 5px;">Size: ${item.size}</span>` : "";
      const colorStr = item.color ? `<span style="font-size: 11px; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: #475569;">Color: ${item.color}</span>` : "";
      const detailsDiv = (sizeStr || colorStr) ? `<div style="margin-top: 6px;">${sizeStr}${colorStr}</div>` : "";
      const itemImg = item.image ? `<img src="${item.image}" alt="${item.name}" width="50" height="50" style="object-fit: cover; border-radius: 6px; margin-right: 15px; vertical-align: middle;" />` : "";

      return `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 0; vertical-align: middle;">
          <div style="display: flex; align-items: center;">
            ${itemImg}
            <div style="display: inline-block; vertical-align: middle;">
              <span style="font-weight: 600; font-size: 14px; color: #0f172a; display: block;">${item.name}</span>
              ${detailsDiv}
            </div>
          </div>
        </td>
        <td style="padding: 12px 0; text-align: center; color: #475569; font-size: 14px;">${item.quantity}</td>
        <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #0f172a; font-size: 14px;">₹${Number(item.price * item.quantity).toFixed(2)}</td>
      </tr>
      `;
    })
    .join("");

  const emailSubject = `Your ILYRA Order Confirmation - #${orderId}`;
  
  const emailHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>ILYRA - Order Confirmation</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        background-color: #f8fafc;
        color: #334155;
        -webkit-font-smoothing: antialiased;
      }
      .wrapper {
        width: 100%;
        background-color: #f8fafc;
        padding: 40px 0;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
        overflow: hidden;
        border: 1px solid #e2e8f0;
      }
      .header {
        background-color: #0f172a;
        color: #ffffff;
        text-align: center;
        padding: 30px 20px;
      }
      .logo {
        font-size: 28px;
        font-weight: 800;
        letter-spacing: 0.1em;
        margin: 0 0 10px 0;
        text-transform: uppercase;
      }
      .title {
        font-size: 16px;
        font-weight: 500;
        color: #94a3b8;
        margin: 0;
        letter-spacing: 0.05em;
      }
      .content {
        padding: 30px;
      }
      .hero-text {
        font-size: 18px;
        font-weight: 600;
        color: #0f172a;
        margin-top: 0;
        margin-bottom: 20px;
      }
      .meta-box {
        background-color: #f8fafc;
        border-radius: 8px;
        padding: 15px 20px;
        margin-bottom: 30px;
        border: 1px solid #f1f5f9;
      }
      .meta-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 14px;
      }
      .meta-item:last-child {
        margin-bottom: 0;
      }
      .meta-label {
        color: #64748b;
        font-weight: 500;
      }
      .meta-value {
        color: #0f172a;
        font-weight: 600;
      }
      .items-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 30px;
      }
      .table-header {
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 10px;
        text-align: left;
        color: #475569;
        font-size: 12px;
        text-transform: uppercase;
        font-weight: 700;
        letter-spacing: 0.05em;
      }
      .total-row td {
        padding-top: 20px;
        font-weight: 700;
        font-size: 16px;
        color: #0f172a;
      }
      .address-box {
        background-color: #f8fafc;
        border-radius: 8px;
        padding: 20px;
        border: 1px solid #f1f5f9;
        margin-bottom: 30px;
      }
      .address-title {
        font-size: 14px;
        font-weight: 700;
        text-transform: uppercase;
        color: #475569;
        margin-top: 0;
        margin-bottom: 10px;
        letter-spacing: 0.05em;
      }
      .address-content {
        font-size: 14px;
        line-height: 1.5;
        color: #0f172a;
      }
      .footer {
        text-align: center;
        padding: 30px 20px;
        background-color: #f8fafc;
        border-top: 1px solid #e2e8f0;
        font-size: 12px;
        color: #64748b;
      }
      .footer a {
        color: #4f46e5;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="container">
        <div class="header">
          <div class="logo">ILYRA</div>
          <div class="title">ORDER CONFIRMATION</div>
        </div>
        <div class="content">
          <div class="hero-text">Thank you for your purchase!</div>
          <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 25px;">
            We've received your order and are getting it ready for shipment. Below you will find the details of your order.
          </p>

          <div class="meta-box">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size: 14px; color: #64748b; padding-bottom: 5px;">Order Number:</td>
                <td style="font-size: 14px; font-weight: 600; color: #0f172a; text-align: right; padding-bottom: 5px;">#${orderId}</td>
              </tr>
              <tr>
                <td style="font-size: 14px; color: #64748b;">Date:</td>
                <td style="font-size: 14px; font-weight: 600; color: #0f172a; text-align: right;">${dateStr}</td>
              </tr>
            </table>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th class="table-header" style="width: 60%;">Product</th>
                <th class="table-header" style="width: 15%; text-align: center;">Qty</th>
                <th class="table-header" style="width: 25%; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr class="total-row">
                <td colspan="2" style="padding-top: 20px; font-weight: 700; font-size: 16px; color: #0f172a;">Grand Total:</td>
                <td style="padding-top: 20px; text-align: right; font-weight: 700; font-size: 18px; color: #4f46e5;">₹${Number(total).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="address-box">
            <h4 class="address-title">Shipping Address</h4>
            <div class="address-content">
              <strong>${address.name}</strong><br />
              ${address.address}<br />
              ${address.city} - ${address.pincode}<br />
              Phone: ${address.phone}
            </div>
          </div>

          <p style="font-size: 14px; line-height: 1.6; color: #475569; text-align: center; margin-top: 30px;">
            If you have any questions, feel free to reply directly to this email or contact support at <a href="mailto:support@ilyra.com" style="color: #4f46e5; text-decoration: none;">support@ilyra.com</a>.
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ILYRA. All rights reserved.</p>
          <p style="margin-top: 5px;">You received this email because you made a purchase on our website.</p>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;

  if (isSmtpConfigured) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || `"ILYRA" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: emailSubject,
        html: emailHtml,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`Order Email Sent successfully to ${toEmail} ✉️ [MessageID: ${info.messageId}]`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error("Failed to send order email via SMTP ❌", err);
      // Fallback: don't crash, return false
      return { success: false, error: err.message };
    }
  } else {
    // Simulated Mode: Print HTML cleanly to console for local logs/verification
    console.log(`\n================= SIMULATED EMAIL CONFIRMATION =================`);
    console.log(`FROM: ${process.env.SMTP_FROM || '"ILYRA" <simulated@ilyra.com>'}`);
    console.log(`TO: ${toEmail}`);
    console.log(`SUBJECT: ${emailSubject}`);
    console.log(`----------------------------------------------------------------`);
    console.log(`[HTML BODY LOGGED BELOW]`);
    console.log(emailHtml);
    console.log(`================================================================\n`);
    return { success: true, simulated: true };
  }
}

module.exports = {
  sendOrderEmail,
};
