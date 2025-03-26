const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/stock_database');

const stockSchema = new mongoose.Schema({
  ticker: String,
  company_name: String,
  close_price: Number,
  percent_change: Number,
});

const Stock = mongoose.model('Stock', stockSchema, 'stock_prices');

// Route to search tickers (exact match only)
app.get('/api/search/:query', async (req, res) => {
    const query = req.params.query.toUpperCase();
    try {
      const results = await Stock.find({ ticker: query }).limit(10); // Exact match only
      res.json(results);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      res.status(500).json({ message: 'Error fetching stock data' });
    }
});  

// Route to fetch stock data by ticker
app.get('/api/ticker/:ticker', async (req, res) => {
    try {
      const query = req.params.ticker.toUpperCase();
      const stockData = await Stock.find({ ticker: query }).limit(10);
  
      if (stockData.length === 0) {
        return res.status(404).send('Ticker not found');
      }
      
      res.json(stockData);
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
});  

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
