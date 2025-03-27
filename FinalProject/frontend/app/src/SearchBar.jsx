import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SearchBar = ({ onSelectStock }) => {
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [noResults, setNoResults] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false); // State to control dropdown visibility

  const inputRef = useRef(null); // Ref for the input field
  const dropdownRef = useRef(null); // Ref for the dropdown
  const navigate = useNavigate(); // Hook for navigation

  const fetchSuggestions = async (query) => {
    if (!query) return;
    try {
      const response = await axios.get(`http://localhost:5000/api/search/${query}`);
      if (response.data.length === 0) {
        setSuggestions([]);
        setNoResults(true);
        return;
      }
      setSuggestions(response.data); // Fuzzy matches
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
    setShowDropdown(true); // Show dropdown when the input changes
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      navigate(`/${search.toUpperCase()}`); // Convert to uppercase before navigating
    }
  };

  const handleSelectStock = async (ticker) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/search/${ticker}`);
      onSelectStock(response.data[0]); // Pass stock data back to parent component
      setShowDropdown(false); // Hide dropdown after selection
    } catch (error) {
      console.error('Error fetching stock data:', error);
    }
  };

  const handleSelect = (ticker) => {
    const upperCaseTicker = ticker.toUpperCase(); // Convert to uppercase
    setSearch(upperCaseTicker);
    navigate(`/${upperCaseTicker}`); // Navigate to /:ticker in uppercase
    setSuggestions([]);
    setShowDropdown(false); // Hide dropdown after selection
  };

  // Close dropdown if the user clicks outside the search bar or dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (inputRef.current && !inputRef.current.contains(e.target) && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false); // Hide dropdown when clicking outside
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
        ref={inputRef} // Attach the input ref
        type="text"
        value={search}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
        placeholder="Search ticker..."
        style={styles.input}
      />
      {showDropdown && suggestions.length > 0 && (
        <ul ref={dropdownRef} style={styles.dropdown}> {/* Attach the dropdown ref */}
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.ticker}
              onClick={() => handleSelect(suggestion.ticker)}
              style={styles.dropdownItem}
            >
              {suggestion.ticker} - {suggestion.company_name} {/* Removed price and percent change */}
            </li>
          ))}
        </ul>
      )}
      {noResults && <div style={styles.noResults}>Ticker data not found!</div>}
    </div>
  );
};

const styles = {
  container: {
    position: 'absolute',
    top: '10px',
    left: '10px', // Align to the left side of the screen
    width: '300px',
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
    padding: '8px',
    color: '#999',
    fontSize: '14px',
  },
};

export default SearchBar;
