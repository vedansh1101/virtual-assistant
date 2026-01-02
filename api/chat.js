import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  try {
    // Get API key from Vercel environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not set in environment variables"
      });
    }

    const { message } = req.body;

    // Validate input
    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Invalid message. Must be a string."
      });
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);

    // Use stable, guaranteed models
    const modelsToTry = [
      "gemini-1.5-flash",
      "gemini-1.5-pro"
    ];

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(message);
        const reply = result.response.text();

        return res.status(200).json({
          reply,
          model: modelName
        });
      } catch (err) {
        console.log(`❌ ${modelName} failed, trying next...`);
      }
    }

    throw new Error("All Gemini models failed");

  } catch (error) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({
      reply: "AI service is temporarily unavailable. Please try again."
    });
  }
}
