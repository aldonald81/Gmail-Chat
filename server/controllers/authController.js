const { getOAuth2Client } = require('../services/googleService');

// Temporary in-memory storage for tokens (for development/testing)
let userTokens = {};

const generateAuthUrl = (req, res) => {
  const oauth2Client = getOAuth2Client();
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Ensures refresh token is generated
    scope: ['https://www.googleapis.com/auth/gmail.readonly'], // Gmail scope
  });
  res.json({ url });
};

const handleAuthCallback = async (req, res) => {
  const { code } = req.query; // Authorization code from Google
  const oauth2Client = getOAuth2Client();

  try {
    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens); // Set the tokens on the client

    // Store tokens in memory (for testing)
    userTokens = tokens;

    // Debug: Log the tokens
    console.log('Access Token:', tokens.access_token);
    console.log('Refresh Token:', tokens.refresh_token);

    // Redirect to the frontend emails page
    res.redirect('http://localhost:3000/emails');
  } catch (error) {
    console.error('Error getting tokens:', error);
    res.status(500).json({ error: 'Failed to get tokens' });
  }
};

const getTokens = () => {
  // Return the stored tokens
  if (!userTokens || !userTokens.access_token) {
    throw new Error('No tokens available. Please authenticate first.');
  }
  return userTokens;
};

module.exports = { generateAuthUrl, handleAuthCallback, getTokens };
