import React from 'react';
import './GoogleAuthButton.css';

const GoogleAuthButton = ({ handleAuth }) => (
  <button onClick={handleAuth} className="auth-button">
    <svg
      className="mail-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
    Connect Gmail Account
  </button>
);

export default GoogleAuthButton;
