import React, { useState, useEffect } from "react";
import EmailCard from "../../components/EmailCard";
import "./EmailDashboard.css";

const EmailDashboard = ({ emails }) => {
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
