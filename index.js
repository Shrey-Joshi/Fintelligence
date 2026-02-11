const express = require('express');
const path = require('path');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { OpenAI } = require('openai');

const app = express();
const PORT = 5000;

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '5mb' }));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/parse-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const pdfData = await pdfParse(req.file.buffer);
    const textContent = pdfData.text;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a financial document parser. Extract banking information from the provided text. Return ONLY valid JSON with this exact structure:
{
  "checking": <number or null>,
  "savings": <number or null>,
  "transactions": [
    { "date": "<date string>", "description": "<description>", "amount": <number>, "type": "<debit|credit>" }
  ]
}
If you cannot find a value, use null. For transactions, extract as many as you can find. Amounts should be positive numbers. Use "debit" for money going out and "credit" for money coming in.`
        },
        {
          role: "user",
          content: `Parse the following bank statement text and extract the data:\n\n${textContent.substring(0, 8000)}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    res.json(parsed);
  } catch (error) {
    console.error('PDF parsing error:', error);
    res.status(500).json({ error: 'Failed to parse PDF. Please try again or enter data manually.' });
  }
});

app.post('/api/connect-brokerage', async (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey || apiKey.trim().length < 4) {
      return res.status(400).json({ error: 'Please enter a valid API key' });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are simulating a brokerage API response. Generate a realistic-looking portfolio with 5-8 stock holdings. Return ONLY valid JSON with this structure:
{
  "accountName": "<brokerage account name>",
  "accountValue": <total portfolio value number>,
  "cashBalance": <available cash number>,
  "holdings": [
    { "symbol": "<ticker>", "name": "<company name>", "shares": <number>, "avgCost": <number>, "currentPrice": <number>, "marketValue": <number>, "gainLoss": <number>, "gainLossPercent": <number> }
  ]
}
Make it realistic with well-known stocks. Include a mix of tech, healthcare, finance, etc.`
        },
        {
          role: "user",
          content: `Generate a simulated brokerage portfolio response for API key ending in: ...${apiKey.slice(-4)}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const portfolio = JSON.parse(response.choices[0].message.content);
    res.json(portfolio);
  } catch (error) {
    console.error('Brokerage connection error:', error);
    res.status(500).json({ error: 'Failed to connect to brokerage. Please try again.' });
  }
});

app.post('/api/parse-transaction-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const pdfData = await pdfParse(req.file.buffer);
    const textContent = pdfData.text;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a financial transaction parser. Extract transactions from the provided bank/credit card statement text. Return ONLY valid JSON:
{
  "transactions": [
    { "date": "<date string>", "description": "<description>", "amount": <positive number>, "type": "<debit|credit>", "category": "<category like Food, Transport, Entertainment, Bills, Shopping, Income, etc.>" }
  ],
  "summary": {
    "totalSpent": <number>,
    "totalIncome": <number>,
    "topCategories": [{ "category": "<name>", "amount": <number> }]
  }
}
Extract as many transactions as you can. Always categorize each one.`
        },
        {
          role: "user",
          content: `Parse the transactions from this statement:\n\n${textContent.substring(0, 8000)}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    res.json(parsed);
  } catch (error) {
    console.error('Transaction PDF parsing error:', error);
    res.status(500).json({ error: 'Failed to parse transaction PDF.' });
  }
});

app.post('/api/parse-transactions', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'No transaction data provided' });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a financial transaction parser. Parse the provided text into structured transaction data. Return ONLY valid JSON:
{
  "transactions": [
    { "date": "<date string>", "description": "<description>", "amount": <positive number>, "type": "<debit|credit>", "category": "<category like Food, Transport, Entertainment, Bills, Shopping, Income, etc.>" }
  ],
  "summary": {
    "totalSpent": <number>,
    "totalIncome": <number>,
    "topCategories": [{ "category": "<name>", "amount": <number> }]
  }
}
Parse whatever format the user provides. If dates aren't clear, make reasonable guesses. Always categorize transactions.`
        },
        {
          role: "user",
          content: `Parse these transactions:\n\n${text.substring(0, 8000)}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    res.json(parsed);
  } catch (error) {
    console.error('Transaction parsing error:', error);
    res.status(500).json({ error: 'Failed to parse transactions.' });
  }
});

app.post('/api/analyze', async (req, res) => {
  try {
    const { finances, portfolio, news, transactions } = req.body;

    let prompt = `As a financial advisor, analyze the following comprehensive data and suggest the best path forward:\n\n`;
    prompt += `Finances (Checking/Savings): ${JSON.stringify(finances)}\n\n`;

    if (portfolio && portfolio.holdings && portfolio.holdings.length > 0) {
      prompt += `Portfolio Holdings:\n`;
      portfolio.holdings.forEach(h => {
        prompt += `- ${h.symbol} (${h.name}): ${h.shares} shares @ $${h.currentPrice}, Value: $${h.marketValue}, Gain/Loss: ${h.gainLossPercent}%\n`;
      });
      prompt += `Total Portfolio Value: $${portfolio.accountValue}\n`;
      prompt += `Cash Balance: $${portfolio.cashBalance}\n`;
      prompt += `Risk Tolerance: ${portfolio.risk || 'moderate'}\n\n`;
    } else {
      prompt += `Portfolio Value: $${portfolio.value}\n`;
      prompt += `Risk Tolerance: ${portfolio.risk}\n\n`;
    }

    if (transactions && transactions.length > 0) {
      prompt += `Recent Transactions:\n`;
      transactions.forEach(t => {
        prompt += `- ${t.date || 'N/A'}: ${t.description} - $${t.amount} (${t.type}) [${t.category || 'Uncategorized'}]\n`;
      });
      prompt += `\n`;
    }

    prompt += `Latest News Headlines: ${news.join(', ')}\n\n`;
    prompt += `Provide a concise, professional recommendation in markdown format. Include:\n`;
    prompt += `1. Portfolio assessment\n2. Spending insights (if transaction data available)\n3. Market outlook based on news\n4. Specific actionable recommendations\n5. Risk considerations`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
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
