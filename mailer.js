const nodemailer = require("nodemailer");
require("dotenv").config();

async function sendEmail(subject, message) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_ADDRESS,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_ADDRESS,
    to: "support@support.whatsapp.com",
    subject: subject,
    text: message,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { sendEmail };
