import dotenv from "dotenv";
dotenv.config();

async function checkModels() {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${process.env.GEMINI_API_KEY}`
    );
    
    const data = await response.json();
    
    console.log("\n✅ Available models for generateContent:\n");
    
    data.models?.forEach(model => {
      if (model.supportedGenerationMethods?.includes('generateContent')) {
        console.log(`✅ ${model.name}`);
      }
    });
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkModels();