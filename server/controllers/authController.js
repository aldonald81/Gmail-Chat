const { getOAuth2Client } = require('../services/googleService');

const generateAuthUrl = (req, res) => {
  const oauth2Client = getOAuth2Client();
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly'],
    prompt: 'consent', // Ensures refresh token is generated each time
  });
  res.json({ url });
};

const handleAuthCallback = async (req, res) => {
  const { code } = req.query;
  const oauth2Client = getOAuth2Client();

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Store tokens in session
    req.session.tokens = tokens;

    // Debug: Log the tokens
    console.log('Access Token:', tokens.access_token);
    console.log('Refresh Token:', tokens.refresh_token);

    // Redirect to the frontend
    res.redirect('http://localhost:3000/emails');
  } catch (error) {
    console.error('Error getting tokens:', error);
    res.status(500).json({ error: 'Failed to get tokens' });
  }
};

// Endpoint to check authentication status
const checkAuthStatus = (req, res) => {
  if (req.session.tokens && req.session.tokens.access_token) {
    res.json({ isAuthenticated: true });
  } else {
    res.json({ isAuthenticated: false });
  }
};

module.exports = { generateAuthUrl, handleAuthCallback, checkAuthStatus };
