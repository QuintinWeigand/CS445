import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const PriceLineGraph = ({ data }) => {
  const prices = data && data.length > 0 ? data.map(d => d.price) : [0];
  const minPrice = Math.floor(Math.min(...prices));
  const maxPrice = Math.ceil(Math.max(...prices));

  // Add buffer to ensure line is always visible
  const priceRange = maxPrice - minPrice;
  // Buffer is now variable: 7% below minPrice, 7% above maxPrice
  const lowerBuffer = minPrice !== 0 ? Math.abs(minPrice * 0.07) : 2;
  const upperBuffer = maxPrice !== 0 ? Math.abs(maxPrice * 0.07) : 2;
  const domainMin = minPrice - lowerBuffer;
  const domainMax = maxPrice + upperBuffer;

  console.log('PriceLineGraph data:', data);
  console.log('prices:', prices, 'minPrice:', minPrice, 'maxPrice:', maxPrice);

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="dateTimeLabel" minTickGap={20} />
        <YAxis domain={[domainMin, domainMax]} tickFormatter={price => `$${price}`} />
        <Tooltip 
          formatter={(value, name) => name === 'price' ? [`$${value.toFixed(2)}`, 'Price'] : value}
          labelFormatter={label => label}
        />
        <Line type="monotone" dataKey="price" stroke="#8884d8" dot={true} activeDot={{ r: 8 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default PriceLineGraph;
