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
  company_name: String,   // New field
  close_price: Number,    // New field
  percent_change: Number, // New field
});

const Stock = mongoose.model('Stock', stockSchema, 'stock_prices');

// Route to search tickers (using regex for partial matching)
app.get('/api/search/:query', async (req, res) => {
    const query = req.params.query.toUpperCase();
    try {
      const results = await Stock.find({
        ticker: { $regex: `^${query}`, $options: 'i' }
      }).limit(10);
      res.json(results);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      res.status(500).json({ message: 'Error fetching stock data' });
    }
});  

// Route to fetch stock data by ticker
app.get('/api/search/:ticker', async (req, res) => {
    try {
      const query = req.params.ticker.toUpperCase(); // Ensure the query is uppercase
      const stockData = await Stock.find({ ticker: query }).limit(10); // Find exact match
  
      if (stockData.length === 0) {
        return res.status(404).send('Ticker not found');
      }
      
      res.json(stockData);  // Return the matched stock data
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
});  

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
