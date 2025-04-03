import React, { useState } from 'react';

const BuySellPopup = ({ type, ticker, onClose }) => {
  const [amount, setAmount] = useState('');
  const [isShares, setIsShares] = useState(true);

  const handleConfirm = () => {
    console.log(`${type} ${amount} ${isShares ? 'shares' : 'dollars'}`);
    onClose();
  };

  return (
    <div className="popup-buy-sell-overlay show">
      <div className="popup-buy-sell">
        <h3 style={{ marginBottom: '20px' }}>{type} {ticker}</h3>
        <div className="popup-info">
          <p><strong>Currently owned:</strong> 0 shares</p>
          <p><strong>Balance:</strong> $0.00</p>
        </div>
        <div className="input-group">
          <label htmlFor="amount" style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '20px' }}>
            Enter:
            <select
              id="type"
              value={isShares ? 'shares' : 'dollars'}
              onChange={(e) => setIsShares(e.target.value === 'shares')}
            >
              <option value="shares">Shares</option>
              <option value="dollars">Dollars</option>
            </select>
          </label>
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            style={{ marginTop: '20px' }}
          />
        </div>
        <button className="confirm-button" onClick={handleConfirm}>Confirm</button>
        <button className="close-button" onClick={onClose} aria-label="Close dialog">×</button>
      </div>
    </div>
  );
};

export default BuySellPopup;