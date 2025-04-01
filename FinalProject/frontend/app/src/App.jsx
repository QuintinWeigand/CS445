import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate, useParams, Link } from 'react-router-dom';
import SearchBar from './SearchBar';
import StockDetails from './StockDetails';
import HomeButton from './HomeButton';
import StockCard from './StockCard';
import './App.css';
import axios from 'axios';

const App = () => {
  const [stockData, setStockData] = useState(null);
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

  const handleSelectStock = (stock) => {
    setStockData(stock);
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <div>
              <SearchBar onSelectStock={handleSelectStock} />
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
          }
        />
        <Route
          path="/:ticker"
          element={
            <div>
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: stockData ? 'space-between' : 'flex-end',
                  padding: '0 20px' 
                }}
              >
                <SearchBar onSelectStock={handleSelectStock} />
                <HomeButton />
              </div>
              <div>
                <StockDetails />
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
