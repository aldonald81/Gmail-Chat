import React, { useEffect } from 'react';
import './AuthModal.css';

const AuthModal = ({ onAuthSuccess }) => {
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/auth/status', {
          method: 'GET',
          credentials: 'include', // Important to include credentials
        });
        const data = await response.json();
        if (data.isAuthenticated) {
          onAuthSuccess();
        }
      } catch (err) {
        console.error('Failed to check authentication status', err);
      }
    };

    checkAuthStatus();
  }, [onAuthSuccess]);

  const handleAuth = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/auth/gmail/url', {
        method: 'GET',
        credentials: 'include',
      });
      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      console.error('Failed to get authentication URL', err);
    }
  };

  return (
    <div className="auth-modal">
      <div className="auth-modal-content">
        <h1>Authenticate with Gmail</h1>
        <p>Please authenticate to use the chat feature.</p>
        <button onClick={handleAuth} className="auth-button">
          Connect Gmail Account
        </button>
      </div>
    </div>
  );
};

export default AuthModal;
