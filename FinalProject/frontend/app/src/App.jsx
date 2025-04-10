import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SearchBar from './SearchBar';
import StockCard from './StockCard';
import TickerPage from './TickerPage';
import './App.css';
import axios from 'axios';
import LoginPopup from './LoginPopup';

const App = () => {
  const [stocks, setStocks] = useState([]);
  const [showLogin, setShowLogin] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginSuccessful, setLoginSuccessful] = useState(false);
  const [userBalance, setUserBalance] = useState(0);

  const toggleLoginPopup = () => {
    setShowLogin(!showLogin);
    setIsRegistering(false); // Reset to login mode when toggling
  };

  const toggleRegisterMode = () => {
    setIsRegistering(!isRegistering);
  };

  const handleLogout = () => {
    setLoginSuccessful(false); // Reset loginSuccessful on logout
  };

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

  useEffect(() => {
    if (loginSuccessful) {
      const fetchUserBalance = async () => {
        try {
          const response = await axios.get('http://localhost:5000/api/user_balance', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          });
          setUserBalance(response.data.balance);
        } catch (error) {
          console.error('Error fetching user balance:', error);
        }
      };
      fetchUserBalance();
    }
  }, [loginSuccessful]);

  return (
    <Router>
      <div>
        {loginSuccessful ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
            <span style={{position: 'absolute', top: '23px', left: '130px', fontSize: '18px'}}>Balance: ${userBalance.toFixed(2)}</span>
          </div>
        ) : (
          <button onClick={toggleLoginPopup} className="login-button">
            Login
          </button>
        )}
        {showLogin && (
          <LoginPopup
            onClose={toggleLoginPopup}
            isRegistering={isRegistering}
            onToggleMode={toggleRegisterMode}
            setLoginSuccessful={setLoginSuccessful}
          />
        )}
        <SearchBar />
        <Routes>
          <Route
            path="/"
            element={
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
            }
          />
          <Route
            path="/:ticker"
            element={
              <div>
                <TickerPage />
              </div>
            }
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
