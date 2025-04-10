import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import StockCard from './StockCard';
import axios from 'axios';
import './TickerPage.css';
import BuySellPopup from './BuySellPopup';

const TickerPage = () => {
  const { ticker } = useParams();
  const [stock, setStock] = useState(null);
  const [error, setError] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [popupType, setPopupType] = useState('');
  const [showBuySellPopup, setShowBuySellPopup] = useState(false);
  const [popupContent, setPopupContent] = useState('');
  const [samplePriceData, setSamplePriceData] = useState([]);

  useEffect(() => {
    const fetchStock = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/stock/${ticker}`);
        setStock(response.data);
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setError('Stock not found');
        } else {
          console.error('Error fetching stock details:', err);
        }
      }
    };
    fetchStock();
  }, [ticker]);

  useEffect(() => {
    const fetchStockHistory = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/stock_history`);
        const stockHistory = response.data.find((item) => item.ticker === ticker);
        if (stockHistory) {
          setSamplePriceData(
            stockHistory.history.map((entry) => ({
              date: new Date(entry.date_and_time).toISOString().split('T')[0],
              price: entry.close_price,
            }))
          );
        }
      } catch (error) {
        console.error('Error fetching stock history:', error);
      }
    };

    fetchStockHistory();
  }, [ticker]);

  const handleImageClick = (content) => {
    setPopupContent(content);
    setShowPopup(true);
  };

  const closePopup = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowPopup(false);
  };

  const handlePopupContentClick = (e) => {
    // Prevent clicks inside the popup from closing it
    e.stopPropagation();
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      setChatMessages([...chatMessages, { text: newMessage, sender: 'user', time: new Date() }]);
      setNewMessage('');
    }
  };

  const handleBuyClick = () => {
    setPopupType('Buy');
    setShowBuySellPopup(true);
  };

  const handleSellClick = () => {
    setPopupType('Sell');
    setShowBuySellPopup(true);
  };

  const closeBuySellPopup = () => {
    setShowBuySellPopup(false);
  };

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  if (!stock) {
    return <div></div>;
  }

  return (
    <div className="ticker-page">
      <div className="header">
      </div>

      <div className="main-content">
        <div className="top-section">
          <div className="graph-container">
            <h3>Price History</h3>
            <div className="price-graph">
              {/* Graph component will go here - using a placeholder div for now */}
              <div className="graph-placeholder">
                {samplePriceData.map((dataPoint, index) => (
                  <div 
                    key={index}   
                    className="graph-bar" 
                    style={{ 
                      height: `${(dataPoint.price / stock.close_price) * 50}px`,
                      backgroundColor: dataPoint.price >= samplePriceData[Math.max(0, index-1)].price ? '#4CAF50' : '#F44336'
                    }}
                    title={`${dataPoint.date}: $${dataPoint.price.toFixed(2)}`}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <div className="action-buttons">
            <button className="buy-button" onClick={handleBuyClick}>Buy</button>
            <button className="sell-button" onClick={handleSellClick}>Sell</button>
            <StockCard 
              ticker={stock.ticker} 
              companyName={stock.company_name} 
              price={stock.close_price} 
              percentChange={stock.percent_change} 
              isButton={false} 
            />
          </div>
        </div>

        <div className="bottom-section">
          <div 
            className="image-container" 
            onClick={() => handleImageClick('Coinzar the Capital Conjurer')}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && handleImageClick('Coinzar the Capital Conjurer')}
          >
            <img 
              src={require('./Coinzar the Capital Conjurer.png')} 
              alt="Coinzar the Capital Conjurer" 
              className="button-image"
            />
            <p>Coinzar the Capital Conjurer</p> {/* Added title below the image */}
          </div>

          <div 
            className="image-container" 
            onClick={() => handleImageClick('WallStreetBets Enjoyer')}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && handleImageClick('WallStreetBets Enjoyer')}
          >
            <img 
              src={require('./WallStreetBets Enjoyer.png')} 
              alt="WallStreetBets Enjoyer" 
              className="button-image"
            />
            <p>WallStreetBets Enjoyer</p> {/* Added title below the image */}
          </div>
        </div>
      </div>

      {showPopup && (
        <div 
          className={`popup-overlay ${showPopup ? 'show' : ''}`} 
          onClick={closePopup}
          role="dialog"
          aria-modal="true"
        >
          <div className="popup-content" onClick={handlePopupContentClick}>
            <button 
              className="close-button" 
              onClick={closePopup}
              aria-label="Close dialog"
            >×</button>
            <div className="popup-layout">
              <div className="popup-image-container">
                <h3>{popupContent}</h3>
                <img 
                  src={popupContent === 'Coinzar the Capital Conjurer' ? require('./Coinzar the Capital Conjurer.png') : require('./WallStreetBets Enjoyer.png')} 
                  alt={popupContent} 
                  className="popup-image"
                />
              </div>
              <div className="chat-room">
                <h3>Discussion Room</h3>
                <div className="chat-messages">
                  {chatMessages.length === 0 ? (
                    <p className="no-messages">No messages yet. Start the conversation!</p>
                  ) : (
                    chatMessages.map((msg, index) => (
                      <div key={index} className={`message ${msg.sender}`}>
                        <span className="message-text">{msg.text}</span>
                        <span className="message-time">{msg.time.toLocaleTimeString()}</span>
                      </div>
                    ))
                  )}
                </div>
                <form className="chat-input" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                  />
                  <button type="submit">Send</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBuySellPopup && popupType && (
        <BuySellPopup type={popupType} ticker={stock.ticker} onClose={closeBuySellPopup} />
      )}
    </div>
  );
};

export default TickerPage;