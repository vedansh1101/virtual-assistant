import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

console.log(
  "API Key loaded:",
  process.env.GEMINI_API_KEY ? "Yes ✅" : "No ❌"
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get("/", (req, res) => {
  res.json({ status: "Server running ✅" });
});

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ reply: "Invalid message" });
    }

    // Try these models in order: gemini-1.5-flash-002, gemini-1.5-pro, gemini-pro
    const model = genAI.getGenerativeModel({
      model: "gemini-pro" // ✅ Most stable and widely available
    });

    const result = await model.generateContent(message);
    const reply = result.response.text();

    res.json({ reply });

  } catch (error) {
    console.error("Gemini Error:", error.message);
    res.status(500).json({
      reply: "⚠ Error: " + error.message
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});
