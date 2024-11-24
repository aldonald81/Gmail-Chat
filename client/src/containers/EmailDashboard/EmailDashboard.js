import React, { useState, useEffect } from 'react';
import AuthButton from '../AuthButton/AuthButton';
import EmailCard from '../EmailCard/EmailCard';
import './EmailDashboard.css';

const EmailDashboard = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAuth = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/auth/gmail/url');
      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      setError('Failed to get authentication URL');
    }
  };

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/emails/getRecentEmails');
      const data = await response.json();
      setEmails(data);
    } catch (err) {
      setError('Failed to fetch emails');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (window.location.pathname === '/emails') {
      fetchEmails();
    }
  }, []);

  if (loading) {
    return (
      <div className="center-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="center-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="center-container">
        <h1 className="title">Gmail Integration</h1>
        <AuthButton handleAuth={handleAuth} />
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <h1 className="title">Your Emails</h1>
      <div className="email-grid">
        {emails.map((email) => (
          <EmailCard key={email.id} email={email} />
        ))}
      </div>
    </div>
  );
};

export default EmailDashboard;
