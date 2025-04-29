import React, { useState } from 'react';
import './LoginPopup.css';

const LoginPopup = ({ onClose, isRegistering, onToggleMode, setLoginSuccessful }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleBackgroundClick = (e) => {
    if (e.target.className === 'login-popup') {
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isRegistering ? 'http://localhost:5000/api/register' : 'http://localhost:5000/api/login';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'An error occurred');
        return;
      }

      const data = await response.json();
      console.log('Success:', data);

      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      if (!isRegistering) {
        setLoginSuccessful(true);
      }

      if (isRegistering) {
        const loginResponse = await fetch('http://localhost:5000/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });

        if (!loginResponse.ok) {
          const loginErrorData = await loginResponse.json();
          setError(loginErrorData.message || 'Registration successful, but login failed');
          return;
        }

        const loginData = await loginResponse.json();
        if (loginData.token) {
          localStorage.setItem('token', loginData.token);
        }

        setLoginSuccessful(true);
      }

      onClose();
    } catch (err) {
      setError('Failed to connect to the server');
    }
  };

  return (
    <div className="login-popup" onClick={handleBackgroundClick}>
      <div className="login-popup-content">
        <h2>{isRegistering ? 'Register' : 'Login'}</h2>
        {error && <p className="error-message" style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">{isRegistering ? 'Register' : 'Login'}</button>
        </form>
        <button onClick={onToggleMode} className="toggle-button">
          {isRegistering ? 'Already have an account? Login' : 'Don\'t have an account? Register'}
        </button>
      </div>
    </div>
  );
};

export default LoginPopup;
