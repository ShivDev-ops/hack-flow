const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("Checking API Key presence...");
  
  if (!apiKey) {
    console.error("ERROR: GEMINI_API_KEY is not defined in .env.local");
    return;
  }

  console.log("API Key found. Initializing Gemini...");
  const genAI = new GoogleGenerativeAI(apiKey);

  const modelsToTest = ["gemini-flash-latest", "gemini-pro-latest"];
  
  for (const modelName of modelsToTest) {
    try {
      console.log(`Testing model: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const res = await model.generateContent("Respond with 'OK'");
      console.log(`  Result for ${modelName}: ${res.response.text().trim()}`);
    } catch (e) {
      console.log(`  Failed for ${modelName}: ${e.message}`);
    }
  }

  console.log("
Testing Embedding Model: gemini-embedding-001...");
  const embed = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
  const embedRes = await embed.embedContent("Test string");
  console.log("Embedding Success: Vector length =", embedRes.embedding.values.length);

  console.log("
DIAGNOSTIC_RESULT: ALL_SYSTEMS_OPERATIONAL");
}

testGemini();
