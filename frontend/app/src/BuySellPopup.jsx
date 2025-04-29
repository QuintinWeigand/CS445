import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BuySellPopup = ({ type, ticker, onClose, updateUserBalance }) => {
  const [amount, setAmount] = useState('');
  const [owned, setOwned] = useState(0);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {

    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        const balRes = await axios.get('http://localhost:5000/api/user_balance', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBalance(balRes.data.balance);

        if (balRes.data.stocks && balRes.data.stocks[ticker]) {
          setOwned(balRes.data.stocks[ticker]);
        } else {
          setOwned(0);
        }
      } catch (err) {
        setOwned(0);
        setBalance(0);
      }
    };
    fetchUserData();
  }, [ticker]);

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    const token = localStorage.getItem('token');
    const endpoint = type === 'Buy' ? '/api/buy' : '/api/sell';
    try {
      const res = await axios.post(
        `http://localhost:5000${endpoint}`,
        { ticker, shares: Number(amount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(res.data.message);
      setOwned(res.data.stocks[ticker] || 0);
      setBalance(res.data.balance);
      setAmount('');
      if (updateUserBalance) updateUserBalance();
    } catch (err) {
      setError(err.response?.data?.message || 'Error processing transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="popup-buy-sell-overlay show">
      <div className="popup-buy-sell">
        <h3 style={{ marginBottom: '20px' }}>{type} {ticker}</h3>
        <div className="popup-info">
          <p><strong>Currently owned:</strong> {owned} shares</p>
          <p><strong>Balance:</strong> ${balance.toFixed(2)}</p>
        </div>
        <div className="input-group">
          <label htmlFor="amount" style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '20px' }}>
            Enter number of shares:
          </label>
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            style={{ marginTop: '20px' }}
            min="1"
          />
        </div>
        {error && <div style={{ color: 'red', marginTop: 20 }}>{error}</div>}
        {success && <div style={{ color: 'green', marginTop: 20 }}>{success}</div>}
        <button className="confirm-button" onClick={handleConfirm} disabled={loading || !amount}>{loading ? 'Processing...' : 'Confirm'}</button>
        <button className="close-button" onClick={onClose} aria-label="Close dialog">×</button>
      </div>
    </div>
  );
};

export default BuySellPopup;