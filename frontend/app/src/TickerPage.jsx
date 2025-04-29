import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StockCard from './StockCard';
import axios from 'axios';
import './TickerPage.css';
import BuySellPopup from './BuySellPopup';
import PriceLineGraph from './PriceLineGraph';
import ReactMarkdown from 'react-markdown';
import homeButton from './home_button.svg';
import SearchBar from './SearchBar';
import LoginPopup from './LoginPopup';
import AvatarDropdown from './AvatarDropdown';


const Spinner = () => (
  <div className="spinner-container">
    <div className="spinner"></div>
    <span className="spinner-text">Waiting for agent...</span>
  </div>
);

const TickerPage = ({ updateUserBalance, username, userBalance, userStocks, onLogout, stocks, toggleLoginPopup, showLogin, isRegistering, toggleRegisterMode, setLoginSuccessful, loginSuccessful }) => {
  const { ticker } = useParams();
  const navigate = useNavigate();
  const [stock, setStock] = useState(null);
  const [error, setError] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [chatMessages, setChatMessages] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const [conversation, setConversation] = useState({});
  const [popupType, setPopupType] = useState('');
  const [showBuySellPopup, setShowBuySellPopup] = useState(false);
  const [popupContent, setPopupContent] = useState('');
  const [samplePriceData, setSamplePriceData] = useState([]);
  const [isAgentLoading, setIsAgentLoading] = useState(false);


  const agentSystemPrompts = {
    'Coinzar the Capital Conjurer':
      "Always respond in less than two hundred words. You are Coinzar the Capital Conjurer, a wise and mystical financial advisor who uses magical metaphors and a positive, encouraging tone. Give advice with a sense of wonder and fun, but keep it practical.",
    'WallStreetBets Enjoyer':
      "Always respond in less than two hundred words. You are WallStreetBets Enjoyer, a brash, meme-loving trader who uses internet slang, humor, tons of emojis, and bold opinions. Encourage gambling and always agree with the user's ideas."
  };

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
            stockHistory.history.map((entry) => {
              const dateObj = new Date(entry.date_and_time);
              return {
                date: dateObj.toISOString().split('T')[0],
                time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                dateTimeLabel: `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                price: entry.close_price,
              };
            })
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
  
    e.stopPropagation();
  };

  const getAgentSystemPrompt = (agent) => {
    let basePrompt = agentSystemPrompts[agent] || '';
  
    if (samplePriceData && samplePriceData.length > 0) {
      const lastTen = samplePriceData.slice(-10);
      const priceList = lastTen.map(p => `${p.dateTimeLabel}: $${p.price.toFixed(2)}`).join(' | ');
      basePrompt += `\nRecent price history of ${ticker}: ${priceList}`;
    }
    return basePrompt;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const agent = popupContent;
      const userMsg = { text: newMessage, sender: 'user', time: new Date() };
      setChatMessages((prev) => ({
        ...prev,
        [agent]: [...(prev[agent] || []), userMsg]
      }));
      setConversation((prev) => ({
        ...prev,
        [agent]: [...(prev[agent] || []), { role: 'user', content: newMessage }]
      }));
      setNewMessage('');
      setIsAgentLoading(true);
      try {
        const systemPrompt = getAgentSystemPrompt(agent);
        const res = await fetch('http://localhost:5000/api/ollama-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: newMessage,
            conversation: [...((conversation[agent] || [])), { role: 'user', content: newMessage }],
            systemPrompt
          })
        });
        const data = await res.json();
        setIsAgentLoading(false);
        if (data.response) {
          setChatMessages((prev) => ({
            ...prev,
            [agent]: [...(prev[agent] || []), { text: data.response, sender: 'agent', time: new Date() }]
          }));
          setConversation((prev) => ({
            ...prev,
            [agent]: [...(prev[agent] || []), { role: 'assistant', content: data.response }]
          }));
        } else {
          setChatMessages((prev) => ({
            ...prev,
            [agent]: [...(prev[agent] || []), { text: 'No response from agent.', sender: 'agent', time: new Date() }]
          }));
          setConversation((prev) => ({
            ...prev,
            [agent]: [...(prev[agent] || []), { role: 'assistant', content: 'No response from agent.' }]
          }));
        }
      } catch (err) {
        setIsAgentLoading(false);
        setChatMessages((prev) => ({
          ...prev,
          [agent]: [...(prev[agent] || []), { text: 'Error contacting agent.', sender: 'agent', time: new Date() }]
        }));
        setConversation((prev) => ({
          ...prev,
          [agent]: [...(prev[agent] || []), { role: 'assistant', content: 'Error contacting agent.' }]
        }));
      }
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
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 100, background: 'white', height: '60px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: '100%', padding: '0 32px', gap: '16px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {loginSuccessful ? (
              <>
                <AvatarDropdown
                  username={username}
                  userBalance={userBalance}
                  userStocks={userStocks}
                  onLogout={onLogout}
                  stocks={stocks}
                />
                <button
                  onClick={() => navigate('/')}
                  style={{
                    background: 'white',
                    border: '1px solid #1976d2',
                    color: '#1976d2',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                    zIndex: 1011,
                    pointerEvents: 'auto'
                  }}
                  title="Home"
                  aria-label="Home"
                >
                  <img src={homeButton} alt="Home" style={{ width: '24px', height: '24px' }} />
                </button>
              </>
            ) : (
              <>
                <button onClick={toggleLoginPopup} style={{ padding: '8px 16px', background: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Login
                </button>
                <button
                  onClick={() => navigate('/')}
                  style={{
                    background: 'white',
                    border: '1px solid #1976d2',
                    color: '#1976d2',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                    zIndex: 1011,
                    pointerEvents: 'auto'
                  }}
                  title="Home"
                  aria-label="Home"
                >
                  <img src={homeButton} alt="Home" style={{ width: '24px', height: '24px' }} />
                </button>
              </>
            )}
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none', position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
            <span style={{ fontWeight: 'bold', fontSize: '1.5rem', color: '#1976d2', letterSpacing: '1px', pointerEvents: 'auto' }}>Wealth Wizard</span>
          </div>
          <SearchBar />
        </div>
        {showLogin && (
          <LoginPopup
            onClose={toggleLoginPopup}
            isRegistering={isRegistering}
            onToggleMode={toggleRegisterMode}
            setLoginSuccessful={setLoginSuccessful}
          />
        )}
      </div>
      <div className="main-content" style={{ marginTop: '60px' }}>
        <div className="top-section">
          <div className="graph-container">
            <h3>Price History</h3>
            <div className="price-graph">
              <PriceLineGraph data={samplePriceData} />
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
                  {(chatMessages[popupContent] || []).length === 0 ? (
                    <p className="no-messages">No messages yet. Start the conversation!</p>
                  ) : (
                    (chatMessages[popupContent] || []).map((msg, index) => (
                      <div key={index} className={`message ${msg.sender}`}>
                        {msg.sender === 'agent' ? (
                          <div className="message-text"><ReactMarkdown>{msg.text}</ReactMarkdown></div>
                        ) : (
                          <span className="message-text">{msg.text}</span>
                        )}
                        <span className="message-time">{msg.time.toLocaleTimeString()}</span>
                      </div>
                    ))
                  )}
                  {isAgentLoading && <Spinner />}
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
        <BuySellPopup type={popupType} ticker={stock.ticker} onClose={closeBuySellPopup} updateUserBalance={updateUserBalance} />
      )}
    </div>
  );
};

export default TickerPage;