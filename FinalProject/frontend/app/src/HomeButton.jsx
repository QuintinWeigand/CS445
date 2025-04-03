import React from 'react';
import { useNavigate } from 'react-router-dom';
import homeIcon from './home_button.svg';

const HomeButton = () => {
  const navigate = useNavigate();

  return (
    <button 
      onClick={() => navigate('/')} 
      style={{ 
        margin: '5px', 
        padding: '5px',
        background: 'none', 
        border: '1px solid #ccc', // Match the search bar's border color
        borderRadius: '10px', 
        transition: 'background-color 0.3s ease',
        position: 'relative', // Ensure alignment with the search bar
        top: '5px', // Adjust the top position to align with the search bar
        right: '-1840px', // Adjust the right position to align with the search bar
      }}
      onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.1)'}
      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
    >
      <img src={homeIcon} alt="Home" style={{ width: '24px', height: '24px' }} />
    </button>
  );
};

export default HomeButton;
