const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/stock_database');

const stockSchema = new mongoose.Schema({
  ticker: String,
  company_name: String,
  close_price: Number,
  percent_change: Number,
});

const Stock = mongoose.model('Stock', stockSchema, 'stock_prices');

const stockHistorySchema = new mongoose.Schema({
  ticker: String,
  history: [
    {
      close_price: Number,
      date_and_time: Date,
    },
  ],
});

const StockHistory = mongoose.model('StockHistory', stockHistorySchema, 'stock_history');

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

app.get('/api/search/:query', async (req, res) => {
  const query = req.params.query.toUpperCase();
  try {
      const exactMatch = await Stock.find({ ticker: query }).limit(10);
      if (exactMatch.length > 0) {
          return res.json(exactMatch);
      }

      const escapedQuery = escapeRegex(query);
      const fuzzyMatches = await Stock.find({
          ticker: { $regex: escapedQuery, $options: 'i' }
      }).limit(10);

      res.json(fuzzyMatches);
  } catch (error) {
      console.error('Error fetching stock data:', error);
      res.status(500).json({ message: 'Error fetching stock data' });
  }
}); 

app.get('/api/stock/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  try {
    const stock = await Stock.findOne({ ticker });
    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
    }
    res.json(stock);
  } catch (error) {
    console.error('Error fetching stock details:', error);
    res.status(500).json({ message: 'Error fetching stock details' });
  }
});

app.get('/api/stocks', async (req, res) => {
  try {
    const stocks = await Stock.find();
    res.json(stocks);
  } catch (error) {
    console.error('Error fetching stocks:', error);
    res.status(500).json({ message: 'Error fetching stocks' });
  }
});

app.get('/api/stock_history', async (req, res) => {
  try {
    const stockHistory = await StockHistory.find();
    res.json(stockHistory);
  } catch (error) {
    console.error('Error fetching stock history:', error);
    res.status(500).json({ message: 'Error fetching stock history' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
