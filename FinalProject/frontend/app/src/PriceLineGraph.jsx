import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const PriceLineGraph = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="dateTimeLabel" minTickGap={20} />
        <YAxis domain={['auto', 'auto']} tickFormatter={price => `$${price}`} />
        <Tooltip formatter={(value, name) => name === 'price' ? [`$${value.toFixed(2)}`, 'Price'] : value} labelFormatter={label => `Date/Time: ${label}`} />
        <Line type="monotone" dataKey="price" stroke="#8884d8" dot={true} activeDot={{ r: 8 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default PriceLineGraph;
