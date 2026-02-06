const express = require('express');
const path = require('path');
const { OpenAI } = require('openai');

const app = express();
const PORT = 5000;

// Replit AI integration uses the AI_INTEGRATIONS_OPENAI_API_KEY environment variable
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/analyze', async (req, res) => {
  try {
    const { finances, portfolio, news } = req.body;
    
    const prompt = `
      As a financial advisor, analyze the following data and suggest the best path forward:
      
      Finances (Checking/Savings): ${JSON.stringify(finances)}
      Portfolio (Brokerage): ${JSON.stringify(portfolio)}
      Latest News Headlines: ${news.join(', ')}
      
      Provide a concise, professional recommendation in markdown format.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [{ role: "user", content: prompt }],
    });

    res.json({ advice: response.choices[0].message.content });
  } catch (error) {
    console.error('AI Analysis error:', error);
    res.status(500).json({ error: 'Failed to generate financial advice' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Fintelligence server running on port ${PORT}`);
});
