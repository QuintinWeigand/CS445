import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate, useParams, Link } from 'react-router-dom';
import SearchBar from './SearchBar';
import './App.css';
import axios from 'axios';

const App = () => {
  const [stockData, setStockData] = useState(null);

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
            </div>
          }
        />
        <Route
          path="/:ticker"
          element={
            <div>
              <SearchBar onSelectStock={handleSelectStock} />
              <div style={{ marginTop: '20px', paddingLeft: '20px' }}>
                <StockDetails />
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
};

const StockDetails = () => {
  const { ticker } = useParams();
  const [stockDetails, setStockDetails] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStockDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/stock/${ticker}`);
        setStockDetails(response.data);
      } catch (err) {
        setError('Stock details not found.');
      }
    };

    fetchStockDetails();
  }, [ticker]);

  if (error) {
    return <div>{error}</div>;
  }

  if (!stockDetails) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Stock Details for {stockDetails.ticker}</h1>
      <p>Company Name: {stockDetails.company_name}</p>
      <p>Price: ${stockDetails.close_price}</p>
      <p>Percent Change: {stockDetails.percent_change}%</p>
    </div>
  );
};

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px',
  },
};

export default App;
