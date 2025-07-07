require('dotenv').config(); // ⬅️ Needed to access .env variables
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Create a new instance with your API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

module.exports = genAI;
;