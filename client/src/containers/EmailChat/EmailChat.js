// EmailChat.js

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./EmailChat.css";
import EmailCard from "../../components/EmailCard"; // Import EmailCard component

const EmailChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [currentEmails, setCurrentEmails] = useState([]);
  const [currentEmailsChats, setCurrentEmailsChats] = useState([])

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { type: "user", content: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setCurrentEmailsChats((prevMessages) => [...prevMessages, {role: 'user', content: input}]);

    try {
      const response = await axios.post(
        "http://localhost:4000/api/emails/orchestrateResponse",
        { userPrompt: input, currentEmails, currentEmailsChats },
        { withCredentials: true }
      );

      if (response.data.type === "emails") {
        const emailMessage = { type: "emails", content: response.data.emails };
        console.log(response.data.emails);
        setMessages((prevMessages) => [...prevMessages, emailMessage]);
        setCurrentEmails(response.data.emails);
        setCurrentEmailsChats([])
      } else if (response.data.type === "LLM") {
        const llmMessage = {
          type: "LLM",
          content: response.data.assistantResponse,
        };
        setMessages((prevMessages) => [...prevMessages, llmMessage]);
        setCurrentEmailsChats((prevMessages) => [...prevMessages, {'role': 'assistant', 'content': response.data.assistantResponse}]);
      }
    } catch (err) {
      console.error("Failed to fetch response:", err);
    } finally {
      setInput("");
    }
  };

  // Scroll to the bottom of the chat when new messages are added
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-screen">
      <div className="chat-header">
        <h1>Chat with Gmail</h1>
      </div>
      <div className="chat-messages">
        {messages.map((message, index) => {
          if (message.type === "user" || message.type === "LLM") {
            return (
              <div
                key={index} 
                className={`chat-message ${
                  message.type === "user" ? "chat-user" : "chat-bot"
                }`}
              >
                {message.content}
              </div>
            );
          } else if (message.type === "emails") {
            return (
              <div key={index} className="email-container">
                <div className="email-scroller">
                  {message.content.map((email, emailIndex) => (
                    <EmailCard key={emailIndex} email={email} />
                  ))}
                </div>
              </div>
            );
          } else {
            return null;
          }
        })}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-container">
        <input
          type="text"
          className="chat-input"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button onClick={handleSendMessage} className="chat-send-button">
          Send
        </button>
      </div>
    </div>
  );
};

export default EmailChat;
