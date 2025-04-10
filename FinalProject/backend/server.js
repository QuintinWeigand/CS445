const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const JWT_SECRET = 'your_jwt_secret_key'; // Replace with a secure secret key

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

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  balance: { type: Number, default: 5000 }, // Added balance field with default value
}, { versionKey: false }); // Disabled the version key

const User = mongoose.model('User', userSchema, 'users');

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
    res.status(201).send({ message: 'User registered successfully', token });
  } catch (error) {
    res.status(400).send({ message: 'Error registering user: ' + error.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
      res.status(200).send({ message: 'Login successful', token });
    } else {
      res.status(401).send({ message: 'Invalid username or password' });
    }
  } catch (error) {
    res.status(500).send({ message: 'Error logging in: ' + error.message });
  }
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Unauthorized: Token missing' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Forbidden: Invalid token' });
    req.user = user;
    next();
  });
}

app.get('/api/user_balance', authenticateToken, async (req, res) => {
  const username = req.user.username;
  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ balance: user.balance });
  } catch (error) {
    console.error('Error retrieving user balance:', error);
    res.status(500).json({ message: 'Error retrieving user balance' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
