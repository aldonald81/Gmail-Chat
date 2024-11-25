// EmailCard.js

import React from "react";
import "./EmailCard.css";

const EmailCard = ({ email }) => (
  <div className="email-card">
    <div className="email-content">
      <h2 className="email-subject">{email.subject}</h2>
      <p className="email-from">From: {email.from}</p>
      <p className="email-date">
        {new Date(email.date).toLocaleString()}
      </p>
      <p className="email-snippet">{email.body}</p>
    </div>
  </div>
);

export default EmailCard;
