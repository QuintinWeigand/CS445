const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');

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
  stocks: { type: Object, default: {} }, // Added stocks field as an object with default empty object
}, { versionKey: false }); // Disabled the version key

const User = mongoose.model('User', userSchema, 'users');

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword, stocks: {} }); // Explicitly set stocks as empty object
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

    res.json({ balance: user.balance, stocks: user.stocks }); // Include stocks in response
  } catch (error) {
    console.error('Error retrieving user balance:', error);
    res.status(500).json({ message: 'Error retrieving user balance' });
  }
});

app.post('/api/buy', authenticateToken, async (req, res) => {
  const { ticker, shares } = req.body;
  const username = req.user.username;
  if (!ticker || !shares || shares <= 0) {
    return res.status(400).json({ message: 'Invalid ticker or shares' });
  }
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Get stock price
    const stock = await Stock.findOne({ ticker: ticker.toUpperCase() });
    if (!stock) return res.status(404).json({ message: 'Stock not found' });
    const totalCost = stock.close_price * shares;
    if (user.balance < totalCost) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }
    // Update user's stocks and balance
    user.stocks[ticker] = (user.stocks[ticker] || 0) + shares;
    user.markModified('stocks'); // Ensure Mongoose tracks the change
    user.balance -= totalCost;
    await user.save();
    res.json({ message: 'Stock purchased', stocks: user.stocks, balance: user.balance });
  } catch (error) {
    res.status(500).json({ message: 'Error buying stock: ' + error.message });
  }
});

app.post('/api/sell', authenticateToken, async (req, res) => {
  const { ticker, shares } = req.body;
  const username = req.user.username;
  if (!ticker || !shares || shares <= 0) {
    return res.status(400).json({ message: 'Invalid ticker or shares' });
  }
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const ownedShares = user.stocks[ticker] || 0;
    if (ownedShares < shares) {
      return res.status(400).json({ message: 'Not enough shares to sell' });
    }
    // Get stock price
    const stock = await Stock.findOne({ ticker: ticker.toUpperCase() });
    if (!stock) return res.status(404).json({ message: 'Stock not found' });
    const totalGain = stock.close_price * shares;
    // Update user's stocks and balance
    user.stocks[ticker] = ownedShares - shares;
    if (user.stocks[ticker] <= 0) {
      delete user.stocks[ticker]; // Remove ticker if no shares left
    }
    user.markModified('stocks'); // Ensure Mongoose tracks the change
    user.balance += totalGain;
    await user.save();
    res.json({ message: 'Stock sold', stocks: user.stocks, balance: user.balance });
  } catch (error) {
    res.status(500).json({ message: 'Error selling stock: ' + error.message });
  }
});

app.post('/api/ollama-chat', async (req, res) => {
  const { message, model, conversation, systemPrompt } = req.body;
  if (!message) {
    return res.status(400).json({ message: 'Message is required' });
  }
  try {
    let messages = Array.isArray(conversation) && conversation.length > 0
      ? conversation
      : [{ role: 'user', content: message }];
    // If a systemPrompt is provided, prepend it as a system message
    if (systemPrompt) {
      messages = [{ role: 'system', content: systemPrompt }, ...messages];
    }
    const ollamaResponse = await axios({
      method: 'post',
      url: 'http://localhost:11434/api/chat',
      data: {
        model: model || 'llama3.2',
        messages
      },
      responseType: 'stream',
    });

    let fullContent = '';
    ollamaResponse.data.on('data', (chunk) => {
      const lines = chunk.toString().split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.message && parsed.message.content) {
            fullContent += parsed.message.content;
          }
        } catch (e) {
          // Ignore parse errors for incomplete lines
        }
      }
    });

    ollamaResponse.data.on('end', () => {
      res.json({ response: fullContent });
    });

    ollamaResponse.data.on('error', (err) => {
      console.error('Ollama stream error:', err);
      res.status(500).json({ message: 'Ollama stream error: ' + err.message });
    });
  } catch (error) {
    console.error('Ollama agent error:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Ollama agent error: ' + (error.response ? JSON.stringify(error.response.data) : error.message) });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
