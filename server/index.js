import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Check API key
console.log(
  "API Key loaded:",
  process.env.GEMINI_API_KEY ? "Yes ✅" : "No ❌"
);

const genAI = new GoogleGenerativeAI(import.meta.env.GEMINI_API_KEY);


// ✅ Health check
app.get("/", (req, res) => {
  res.json({ status: "Server running ✅" });
});

// ✅ SINGLE-MODEL CHAT ENDPOINT (QUOTA SAFE)
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ reply: "Invalid message" });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash" // ✅ stable + low quota usage
    });

    const result = await model.generateContent(message);
    const reply = result.response.text();

    res.json({ reply });

  } catch (error) {
    console.error("Gemini Error:", error.message);
    res.status(500).json({
      reply: "⚠ API quota exceeded. Please wait a few minutes."
    });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});
