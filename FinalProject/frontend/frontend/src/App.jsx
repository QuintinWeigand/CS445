import React, { useState } from 'react';
import SearchBar from './SearchBar';
import './App.css';

const App = () => {
  const [stockData, setStockData] = useState(null);

  const handleSelectStock = (stock) => {
    setStockData(stock);
  };

  return (
    <div>
      <SearchBar onSelectStock={handleSelectStock} />
      {stockData && (
        <div>
          <h2>{stockData.ticker}</h2>
          <p>{stockData.company_name}</p>
          <p>Price: ${stockData.close_price}</p>
          <p>Percent Change: {stockData.percent_change}%</p>
        </div>
      )}
    </div>
  );
};

export default App;
