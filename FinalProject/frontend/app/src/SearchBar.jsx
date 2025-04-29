import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SearchBar = ({ onSelectStock }) => {
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [noResults, setNoResults] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchSuggestions = async (query) => {
    if (!query) return;
    try {
      const response = await axios.get(`http://localhost:5000/api/search/${query}`);
      if (response.data.length === 0) {
        setSuggestions([]);
        setNoResults(true);
        return;
      }
      setSuggestions(response.data);
      setNoResults(false);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
      setNoResults(true);
    }
  };

  const handleChange = (e) => {
    setSearch(e.target.value);
    fetchSuggestions(e.target.value);
    setShowDropdown(true);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      navigate(`/${search.toUpperCase()}`);
    }
  };

  const handleSelectStock = async (ticker) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/search/${ticker}`);
      onSelectStock(response.data[0]);
      setShowDropdown(false);
    } catch (error) {
      console.error('Error fetching stock data:', error);
    }
  };

  const handleSelect = (ticker) => {
    const upperCaseTicker = ticker.toUpperCase();
    setSearch(upperCaseTicker);
    navigate(`/${upperCaseTicker}`);
    setSuggestions([]);
    setShowDropdown(false);
  };


  useEffect(() => {
    const handleClickOutside = (e) => {
      if (inputRef.current && !inputRef.current.contains(e.target) && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div style={styles.container}>
      <input
        ref={inputRef}
        type="text"
        value={search}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
        placeholder="Search ticker..."
        style={styles.input}
      />
      {showDropdown && (
        <ul ref={dropdownRef} style={styles.dropdown}> {/* Attach the dropdown ref */}
          {suggestions.length > 0 ? 
            suggestions.map((suggestion) => (
              <li
                key={suggestion.ticker}
                onClick={() => (onSelectStock ? handleSelectStock(suggestion.ticker) : handleSelect(suggestion.ticker))}
                style={styles.dropdownItem}
              >
                {suggestion.ticker} - {suggestion.company_name} {/* Removed price and percent change */}
              </li>
            ))
          : 
            noResults && search && (
              <li style={{...styles.dropdownItem, ...styles.noResults}}>
                Ticker data not found!
              </li>
            )
          }
        </ul>
      )}
    </div>
  );
};

const styles = {
  container: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    width: '90%',
    maxWidth: '300px',
    fontFamily: 'Calibri, sans-serif',
  },
  input: {
    width: '100%',
    padding: '8px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    fontSize: '16px',
    boxSizing: 'border-box',
  },
  dropdown: {
    position: 'absolute',
    top: '40px',
    width: '100%',
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    borderRadius: '8px',
    boxShadow: '0px 4px 8px rgba(0,0,0,0.1)',
    zIndex: 10,
    maxHeight: '200px',
    overflowY: 'auto',
    padding: '0',
    listStyleType: 'none',
  },
  dropdownItem: {
    padding: '8px',
    cursor: 'pointer',
    borderBottom: '1px solid #eee',
    fontSize: '14px',
  },
  noResults: {
    color: '#999',
    cursor: 'default',
  },
};

export default SearchBar;
