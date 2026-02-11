# Fintelligence

## Overview
Financial Intelligence Platform built with Node.js and Express. Uses OpenAI for AI-powered financial analysis, PDF parsing, and transaction categorization.

## Project Architecture
- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Frontend**: Static HTML/CSS/JS served from `public/`
- **AI**: OpenAI integration (via Replit AI Integrations)
- **Entry Point**: `index.js`
- **Port**: 5000 (bound to 0.0.0.0)

## Project Structure
```
├── index.js          # Express server with API endpoints
├── public/
│   ├── index.html    # Main HTML page with all UI logic
│   └── styles.css    # Stylesheet (dark theme)
├── package.json      # Node.js dependencies
└── .gitignore        # Git ignore rules
```

## API Endpoints
- `POST /api/parse-pdf` - Parse bank statement PDFs to extract checking/savings balances and transactions
- `POST /api/connect-brokerage` - Simulated brokerage API connection (generates realistic portfolio via AI)
- `POST /api/parse-transactions` - Parse pasted transaction text into structured/categorized data
- `POST /api/parse-transaction-pdf` - Parse transaction PDF statements with categorization
- `POST /api/analyze` - Generate comprehensive AI financial advice from all data sources

## Features
- Manual entry or PDF upload for banking data (checking/savings)
- Brokerage API key connection with persistent editable portfolio holdings modal
- Transaction summary with AI parsing (paste or PDF upload)
- Comprehensive AI financial advice generation
- Data persistence via localStorage (brokerage holdings, transactions)

## Dependencies
- express, openai, multer (file uploads), pdf-parse (PDF text extraction)

## Recent Changes
- 2026-02-06: Added PDF upload, brokerage connection, transaction summary, localStorage persistence
- 2026-02-06: Initial project setup with Express.js server and landing page

## User Preferences
- None documented yet
