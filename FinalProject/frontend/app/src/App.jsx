import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useParams } from 'react-router-dom';
import SearchBar from './SearchBar';
import StockCard from './StockCard';
import TickerPage from './TickerPage';
import './App.css';
import axios from 'axios';

const App = () => {
  const [stocks, setStocks] = useState([]);

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/stocks');
        setStocks(response.data);
      } catch (error) {
        console.error('Error fetching stocks:', error);
      }
    };
    fetchStocks();
  }, []);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <div>
              <SearchBar />
              <div style={{ position: 'relative', top: '50px' }}>
                <div className="stock-container">
                  {stocks.map((stock) => (
                    <StockCard
                      key={stock.ticker}
                      ticker={stock.ticker}
                      companyName={stock.company_name}
                      price={stock.close_price}
                      percentChange={stock.percent_change}
                    />
                  ))}
                </div>
              </div>
            </div>
          }
        />
        <Route
          path="/:ticker"
          element={<TickerPage />}
        />
      </Routes>
    </Router>
  );
};

export default App;
