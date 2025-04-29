# Wealth Wizard

A full-stack stock market simulator with real-time price updates, user authentication, and a React-based UI. The project consists of:

- **Backend**: Node.js/Express API with MongoDB for user, stock, and transaction data.
- **Frontend**: React app for searching, viewing, and trading stocks.
- **Stock Updater**: Rust service to fetch and update stock prices/history from Yahoo Finance.

---

## Features

- User registration, login, and JWT-based authentication
- Search and view real-time stock data (price, percent change, company name)
- Buy/sell stocks with simulated balance
- View owned stocks and balance
- Historical price tracking for each stock
- AI-powered chat (Ollama integration)
- Modern, responsive React UI

---

## Project Structure

```
backend/                # Node.js/Express API server
frontend/app/           # React frontend app
update_stock_prices/    # Rust service for updating stock data in MongoDB
tickers.txt             # List of tracked stock tickers
```

---

## Setup & Usage

### Prerequisites

- Node.js & npm
- Rust & Cargo
- MongoDB (running locally on default port)
- (Optional) Ollama for AI chat

### 1. Backend

```bash
cd backend
npm install
node server.js
```

- Runs on `http://localhost:5000`
- Provides REST API for stocks, users, trading, and chat

### 2. Frontend

```bash
cd frontend/app
npm install
npm start
```

- Runs on `http://localhost:3000`
- React UI for searching, trading, and viewing stocks

### 3. Stock Updater (Rust)

```bash
./update_stocks tickers.txt
```

- Runs the `update_stocks` executable, which reads `tickers.txt` and updates MongoDB with the latest prices and history

---

## Configuration

- MongoDB connection: `mongodb://localhost:27017`
- Stock tickers: edit `tickers.txt` in the project root
- Ollama chat: ensure Ollama is running locally if using `/api/ollama-chat`

---

## API Endpoints (Backend)

- `POST /api/register` — Register new user
- `POST /api/login` — Login and receive JWT
- `GET /api/stocks` — List all stocks
- `GET /api/stock/:ticker` — Get details for a stock
- `POST /api/buy` — Buy shares (auth required)
- `POST /api/sell` — Sell shares (auth required)
- `GET /api/user_balance` — Get user balance and holdings (auth required)
- `POST /api/ollama-chat` — AI chat endpoint

---