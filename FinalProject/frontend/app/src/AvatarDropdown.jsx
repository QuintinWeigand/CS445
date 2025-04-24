import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AvatarDropdown = ({ username, userBalance, userStocks, onLogout }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [stockValues, setStockValues] = useState([]);

  useEffect(() => {
    const fetchStockValues = async () => {
      if (!userStocks || Object.keys(userStocks).length === 0) {
        setStockValues([]);
        return;
      }
      try {
        const tickers = Object.keys(userStocks);
        const responses = await Promise.all(
          tickers.map(ticker => axios.get(`http://localhost:5000/api/stock/${ticker}`))
        );
        const values = responses.map((res, idx) => {
          const ticker = tickers[idx];
          const shares = userStocks[ticker];
          const price = res.data.close_price;
          return {
            ticker,
            shares,
            price,
            total: shares * price,
            companyName: res.data.company_name || ticker
          };
        });
        setStockValues(values);
      } catch (err) {
        setStockValues([]);
      }
    };
    if (showDropdown) fetchStockValues();
  }, [showDropdown, userStocks]);

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
    <div style={{ position: 'relative' }} className="avatar-dropdown">
      <div
        onClick={() => {
          setShowDropdown((prev) => !prev);
          setShowTooltip(false); // Hide tooltip when dropdown opens
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: '#1976d2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '20px',
          cursor: 'pointer',
          userSelect: 'none',
          position: 'relative',
          zIndex: 1010, // ensure avatar is above dropdown
        }}
      >
        <span>{username ? username[0].toUpperCase() : 'U'}</span>
      </div>
      {showTooltip && username && (
        <div style={{
          position: 'absolute',
          top: '38px',
          left: '30px',
          background: 'rgba(0,0,0,0.85)',
          color: 'white',
          padding: '4px 12px',
          borderRadius: '6px',
          fontSize: '15px',
          whiteSpace: 'nowrap',
          zIndex: 2000, // ensure tooltip is above everything
          pointerEvents: 'none', // allow mouse events to pass through
        }}>
          {username + "'s account"}
        </div>
      )}
      {showDropdown && (
        <div
          style={{
            position: 'absolute',
            top: '45px',
            left: '30px',
            background: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            borderRadius: '8px',
            minWidth: '240px',
            zIndex: 10,
            padding: '8px 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '4px',
          }}
        >
          <div style={{ padding: '10px 20px', color: '#333', fontWeight: '500', fontSize: '16px', cursor: 'default' }}>
            Balance: ${userBalance.toFixed(2)}
          </div>
          {stockValues.length > 0 && (
            <div style={{ padding: '0 20px 10px 20px', width: '100%' }}>
              <div style={{ fontWeight: 'bold', marginBottom: 4 }}>Your Stocks:</div>
              {stockValues.map(sv => (
                <div key={sv.ticker} style={{ fontSize: 14, marginBottom: 2, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                  <span>{sv.ticker}:</span>
                  <span style={{ marginLeft: 4, minWidth: 70 }}>{sv.shares} Shares</span>
                  <span style={{ fontWeight: 600, marginLeft: 4 }}>${sv.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          {/* Total value section at the bottom */}
          <div style={{
            marginTop: '12px',
            padding: '10px 20px 0 20px',
            width: '100%',
            fontWeight: 600,
            fontSize: '15px',
            color: '#1976d2',
            background: 'white',
          }}>
            {(() => {
              const totalStocks = stockValues.reduce((sum, sv) => sum + sv.total, 0);
              const grandTotal = totalStocks + userBalance;
              return (
                <>
                  <div>Total Stock Value: ${totalStocks.toFixed(2)}</div>
                  <div>Net Worth: ${grandTotal.toFixed(2)}</div>
                </>
              );
            })()}
          </div>
          <div style={{
            borderTop: '1px solid #eee',
            width: '100%',
            marginTop: '0',
          }} />
          <div
            onClick={onLogout}
            style={{
              padding: '10px 20px',
              cursor: 'pointer',
              color: '#d32f2f',
              fontWeight: '500',
              width: '100%',
              transition: 'text-decoration 0.2s',
            }}
            onMouseDown={e => e.preventDefault()}
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
          >
            Logout
          </div>
        </div>
      )}
    </div>
  );
};

export default AvatarDropdown;
