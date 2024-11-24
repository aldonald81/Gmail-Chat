import React, { useState } from 'react';
import AuthModal from '../../containers/AuthModal';
import EmailChat from '../../containers/EmailChat';

const ChatScreen = () => {
  const [authenticated, setAuthenticated] = useState(false);

  const handleAuthSuccess = () => {
    console.log("CALLING ON AUth SUCCESS")

    setAuthenticated(true);
  };

  return (
    <div className="App">
      {!authenticated ? (
        <AuthModal onAuthSuccess={handleAuthSuccess} />
      ) : (
        <EmailChat />
      )}
    </div>
  );
}

export default ChatScreen;
