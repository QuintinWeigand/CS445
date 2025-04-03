import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './StockCard.css';

const StockCard = ({ ticker, companyName, price, percentChange, isButton = true }) => {
  const navigate = useNavigate();
  const [stockData, setStockData] = useState({ ticker, companyName, price, percentChange });

  useEffect(() => {
    const fetchStockData = async () => {
      if (!isButton && ticker) {
        try {
          const response = await axios.get(`http://localhost:5000/api/stock/${ticker}`);
          setStockData(response.data);
        } catch (error) {
          console.error('Error fetching stock data:', error);
        }
      }
    };
    fetchStockData();
  }, [ticker, isButton]);

  const handleClick = () => {
    if (isButton) {
      navigate(`/${ticker}`);
    }
  };

  const effectivePercentChange = stockData.percent_change ?? percentChange;

  return (
    <div
      className="stock-card"
      onClick={isButton ? handleClick : undefined}
      style={{
        cursor: isButton ? 'pointer' : 'default',
        pointerEvents: isButton ? 'auto' : 'none', // Disable hover effect if not a button
      }}
    >
      <h3>{stockData.ticker || ticker}</h3>
      <p>{stockData.company_name || companyName}</p>
      <p>Price: ${stockData.close_price?.toFixed(2) || price?.toFixed(2)}</p>
      <p style={{ color: effectivePercentChange >= 0 ? 'green' : 'red' }}>
        Change: {effectivePercentChange?.toFixed(2)}%
      </p>
    </div>
  );
};

export default StockCard;
