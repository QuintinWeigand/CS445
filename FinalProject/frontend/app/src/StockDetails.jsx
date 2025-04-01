import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

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

export default StockDetails;