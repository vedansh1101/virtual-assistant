import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  try {
    // Get API key from environment
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        reply: "Server configuration error. Please contact admin."
      });
    }

    const { message } = req.body;

    // Validate input
    if (!message || typeof message !== "string") {
      return res.status(400).json({
        reply: "Invalid message format."
      });
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);

    // Try models in order
    const modelsToTry = [
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-pro"
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
        console.log(`${modelName} failed, trying next...`);
        continue;
      }
    }

    throw new Error("All models failed");

  } catch (error) {
    console.error("API Error:", error.message);
    return res.status(500).json({
      reply: "AI service temporarily unavailable. Please try again."
    });
  }
}

