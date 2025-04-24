import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SearchBar from './SearchBar';
import StockCard from './StockCard';
import TickerPage from './TickerPage';
import './App.css';
import axios from 'axios';
import LoginPopup from './LoginPopup';
import AvatarDropdown from './AvatarDropdown';

const App = () => {
  const [stocks, setStocks] = useState([]);
  const [showLogin, setShowLogin] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginSuccessful, setLoginSuccessful] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [username, setUsername] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [userStocks, setUserStocks] = useState({});

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
          setUserStocks(response.data.stocks || {});
        } catch (error) {
          console.error('Error fetching user balance:', error);
        }
      };
      fetchUserBalance();
      // Fetch username
      const fetchUsername = async () => {
        try {
          const response = await axios.get('http://localhost:5000/api/username', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          });
          setUsername(response.data.username);
        } catch (error) {
          console.error('Error fetching username:', error);
        }
      };
      fetchUsername();
    }
  }, [loginSuccessful]);

  // Function to update user balance from anywhere
  const updateUserBalance = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/user_balance', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setUserBalance(response.data.balance);
      setUserStocks(response.data.stocks || {});
    } catch (error) {
      console.error('Error updating user balance:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showDropdown) return;
    const handleClick = (e) => {
      if (!e.target.closest('.avatar-dropdown')) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDropdown]);

  return (
    <Router>
      <div>
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 100, background: 'transparent', height: '60px' }}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: '100%', padding: '0 32px', position: 'relative', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {loginSuccessful && (
                <AvatarDropdown
                  username={username}
                  userBalance={userBalance}
                  userStocks={userStocks}
                  onLogout={handleLogout}
                  stocks={stocks}
                />
              )}
              {!loginSuccessful && (
                <>
                  <button onClick={toggleLoginPopup} className="login-button">
                    Login
                  </button>
                  {showLogin && (
                    <LoginPopup
                      onClose={toggleLoginPopup}
                      isRegistering={isRegistering}
                      onToggleMode={toggleRegisterMode}
                      setLoginSuccessful={setLoginSuccessful}
                    />
                  )}
                </>
              )}
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <SearchBar />
            </div>
          </div>
        </div>
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
                <TickerPage
                  updateUserBalance={updateUserBalance}
                  username={username}
                  userBalance={userBalance}
                  userStocks={userStocks}
                  onLogout={handleLogout}
                  stocks={stocks}
                />
              </div>
            }
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
