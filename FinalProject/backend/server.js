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

// Utility function to escape special characters in a regex
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special characters
}

// Route to search tickers (prioritize exact match, fallback to fuzzy matching)
app.get('/api/search/:query', async (req, res) => {
  const query = req.params.query.toUpperCase();
  try {
      const exactMatch = await Stock.find({ ticker: query }).limit(10); // Exact match
      if (exactMatch.length > 0) {
          return res.json(exactMatch); // Return exact match if found
      }

      const escapedQuery = escapeRegex(query); // Escape special characters
      const fuzzyMatches = await Stock.find({
          ticker: { $regex: escapedQuery, $options: 'i' } // Fuzzy match
      }).limit(10);

      res.json(fuzzyMatches); // Return fuzzy matches if no exact match
  } catch (error) {
      console.error('Error fetching stock data:', error);
      res.status(500).json({ message: 'Error fetching stock data' });
  }
}); 

// Route to fetch stock details for a specific ticker
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
