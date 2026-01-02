import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
app.use(cors());
app.use(express.json());

// Check if API key is loaded
console.log("API Key loaded:", process.env.GEMINI_API_KEY ? "Yes ✅" : "No ❌");

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ 
    status: "Server is running",
    message: "Gemini AI Chat Server"
  });
});

// List available models endpoint
app.get("/list-models", async (req, res) => {
  try {
    console.log("Fetching available models...");
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log("✅ Available models fetched");
    
    res.json({ 
      success: true, 
      models: data.models,
      count: data.models?.length || 0
    });
  } catch (error) {
    console.error("❌ Failed to list models:", error.message);
    
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
});

// Test multiple models to find one that works
app.get("/test-api", async (req, res) => {
  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-2.0-flash-lite",
    "gemini-2.5-flash-lite",
    "gemini-pro-latest"
  ];

  for (const modelName of modelsToTry) {
    try {
      console.log(`Testing ${modelName}...`);
      
      const model = genAI.getGenerativeModel({ 
        model: modelName
      });
      
      const result = await model.generateContent("Say hello");
      const reply = result.response.text();
      
      console.log(`✅ ${modelName} works!`);
      
      return res.json({ 
        success: true, 
        reply: reply,
        model: modelName,
        message: `API is working with ${modelName}`
      });
    } catch (error) {
      console.log(`❌ ${modelName} failed: ${error.message}`);
      continue;
    }
  }

  res.status(500).json({ 
    success: false, 
    error: "All models failed. Please check your quota and billing.",
    details: "Visit https://aistudio.google.com/app/apikey"
  });
});

// Main chat endpoint - tries multiple models
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    
    // Validate request
    if (!message || typeof message !== "string") {
      return res.status(400).json({ 
        reply: "Invalid message format. Please send a string message." 
      });
    }

    console.log("Received message:", message);

    // Try multiple models in order of preference
    const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-flash-latest",
      "gemini-2.0-flash-lite",
      "gemini-2.5-flash-lite",
      "gemini-pro-latest"
    ];

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName
        });

        const result = await model.generateContent(message);
        const reply = result.response.text();

        console.log(`✅ Response generated using ${modelName}`);
        return res.json({ reply, model: modelName });
        
      } catch (error) {
        console.log(`❌ ${modelName} failed, trying next...`);
        
        // If it's the last model, throw the error
        if (modelName === modelsToTry[modelsToTry.length - 1]) {
          throw error;
        }
        continue;
      }
    }
    
  } catch (error) {
    console.error("❌ All models failed:", error.message);
    
    res.status(500).json({ 
      reply: "Error: Quota exceeded. Please wait a few minutes or check your API quota at https://aistudio.google.com",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
  console.log(`📡 Test API at: http://localhost:${PORT}/test-api`);
  console.log(`📋 List models at: http://localhost:${PORT}/list-models`);
});