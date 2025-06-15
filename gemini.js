import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

export async function generateUnbanMessage(phone, banType, deviceInfo) {
  const prompt = `Write a formal email to WhatsApp support asking to unban the number ${phone}, which is ${banType} banned. Include the following device info: ${deviceInfo}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const body = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ]
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "❌ Failed to generate message";
  } catch (error) {
    console.error("Gemini fetch error:", error);
    throw error;
  }
}
