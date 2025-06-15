const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

async function generateUnbanMessage(phone, banType, deviceInfo) {
  const prompt = `Write a formal email to WhatsApp support asking to unban the number ${phone}, which is ${banType} banned. Include the following device info: ${deviceInfo}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

module.exports = { generateUnbanMessage };
