const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  telegramId: String,
  phone: String,
  banType: String,
  deviceInfo: String,
  generatedMessage: String,
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Request", requestSchema);
