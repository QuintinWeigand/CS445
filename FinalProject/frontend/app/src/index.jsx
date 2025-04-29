import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import App from './App';

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} /> {/* Default route */}
        <Route path="/:ticker" element={<App />} /> {/* Dynamic ticker route */}
      </Routes>
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
);
