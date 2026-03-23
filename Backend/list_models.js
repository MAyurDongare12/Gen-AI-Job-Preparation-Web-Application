require('dotenv').config();
const fs = require('fs');

async function listModels() {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const flashModels = data.models.map(m => m.name).filter(n => n.includes('flash'));
    fs.writeFileSync('models.json', JSON.stringify(flashModels, null, 2));
    console.log("Wrote to models.json");
  } catch (err) {
    console.error(err.message);
  }
}

listModels();

