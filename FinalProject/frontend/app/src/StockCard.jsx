import React from 'react';
import './StockCard.css';

const StockCard = ({ ticker, companyName, price, percentChange }) => {
  return (
    <div className="stock-card">
      <h3>{ticker}</h3>
      <p>{companyName}</p>
      <p>Price: ${price.toFixed(2)}</p>
      <p style={{ color: percentChange >= 0 ? 'green' : 'red' }}>
        Change: {percentChange.toFixed(2)}%
      </p>
    </div>
  );
};

export default StockCard;
