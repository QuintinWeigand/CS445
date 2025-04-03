import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useParams } from 'react-router-dom';
import SearchBar from './SearchBar';
import HomeButton from './HomeButton';
import StockCard from './StockCard';
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

const TickerPage = () => {
  const { ticker } = useParams();
  const [stock, setStock] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStock = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/stock/${ticker}`);
        setStock(response.data);
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setError('Stock not found');
        } else {
          console.error('Error fetching stock details:', err);
        }
      }
    };
    fetchStock();
  }, [ticker]);

  if (error) {
    return <div>{error}</div>;
  }

  if (!stock) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '0 20px' 
        }}
      >
        <SearchBar />
        <HomeButton />
      </div>
      <div className="stock-container">
        <StockCard ticker={stock.ticker} companyName={stock.company_name} price={stock.close_price} percentChange={stock.percent_change} isButton={false} />
      </div>
    </div>
  );
};

export default App;
