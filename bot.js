const TelegramBot = require("node-telegram-bot-api");
const mongoose = require("mongoose");
import { generateUnbanMessage } from "./gemini.mjs";
const { sendEmail } = require("./mailer");
const Request = require("./models/Request");
require("dotenv").config();

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const userSessions = {};

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Hi! Are you facing a WhatsApp ban?\nChoose one:", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔓 Temporary", callback_data: "ban_temp" }],
        [{ text: "🚫 Permanent", callback_data: "ban_perm" }],
      ],
    },
  });
});

bot.on("callback_query", async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const type = callbackQuery.data === "ban_temp" ? "temporary" : "permanent";

  userSessions[chatId] = { banType: type };
  bot.sendMessage(chatId, "Please enter your WhatsApp number (e.g. +2349012345678):");
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const session = userSessions[chatId];

  if (!session) return;

  if (!session.phone) {
    session.phone = msg.text;
    bot.sendMessage(chatId, "Enter your phone model and WhatsApp version (e.g. iPhone 12, v2.23.11.75):");
  } else if (!session.deviceInfo) {
    session.deviceInfo = msg.text;

    bot.sendMessage(chatId, "Generating message with Gemini AI...");

    try {
      const message = await generateUnbanMessage(session.phone, session.banType, session.deviceInfo);
      session.generatedMessage = message;

      await Request.create({
        telegramId: chatId,
        phone: session.phone,
        banType: session.banType,
        deviceInfo: session.deviceInfo,
        generatedMessage: session.generatedMessage,
      });

      bot.sendMessage(chatId, `Here’s your unban request:\n\n${message}`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: "✅ Send to WhatsApp", callback_data: "send_email" }],
            [{ text: "🔁 Generate new message", callback_data: "regenerate" }],
          ],
        },
      });
    } catch (e) {
      bot.sendMessage(chatId, "❌ Failed to generate message. Try again later.");
      delete userSessions[chatId];
    }
  }
});

bot.on("callback_query", async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  const session = userSessions[chatId];

  if (!session) return;

  if (data === "send_email") {
    try {
      await sendEmail("WhatsApp Unban Request", session.generatedMessage);
      bot.sendMessage(chatId, "📨 Message sent to WhatsApp support! Wait for a response.");
    } catch (e) {
      bot.sendMessage(chatId, "❌ Failed to send email.");
    }
    delete userSessions[chatId];
  }

  if (data === "regenerate") {
    try {
      const message = await generateUnbanMessage(session.phone, session.banType, session.deviceInfo);
      session.generatedMessage = message;

      bot.sendMessage(chatId, `🔄 New version:\n\n${message}`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: "✅ Send to WhatsApp", callback_data: "send_email" }],
            [{ text: "🔁 Generate again", callback_data: "regenerate" }],
          ],
        },
      });
    } catch (e) {
      bot.sendMessage(chatId, "❌ Error generating new message.");
    }
  }
});
