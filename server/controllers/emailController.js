const { getOAuth2Client } = require('../services/googleService');
const { google } = require('googleapis');
const { getTokens } = require('../controllers/authController');
const { htmlToText } = require('html-to-text');

// Function to recursively extract the email body
const getEmailBody = (payload) => {
  let body = '';

  if (payload.parts) {
    payload.parts.forEach((part) => {
      if (part.parts) {
        body += getEmailBody(part);
      } else if (part.mimeType === 'text/plain' && part.body.data) {
        body += Buffer.from(part.body.data, 'base64').toString('utf-8');
      } else if (part.mimeType === 'text/html' && part.body.data) {
        body += Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
    });
  } else if (payload.body && payload.body.data) {
    body += Buffer.from(payload.body.data, 'base64').toString('utf-8');
  }

  return body;
};

// Fetch all emails from the Primary inbox
const fetchAllEmails = async (req, res) => {
  try {
    const oauth2Client = getOAuth2Client();
    const tokens = getTokens(); // Retrieve tokens
    oauth2Client.setCredentials(tokens); // Set credentials on the client

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 200,
      labelIds: ['INBOX', 'CATEGORY_PERSONAL'], // Only fetch emails from Primary inbox
    });

    if (!response.data.messages) {
      return res.json([]);
    }

    const emails = await Promise.all(
      response.data.messages.map(async (message) => {
        const email = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full', // Ensure full email content is retrieved
        });

        const headers = email.data.payload.headers;
        const subject = headers.find((h) => h.name === 'Subject')?.value;
        const from = headers.find((h) => h.name === 'From')?.value;
        const date = headers.find((h) => h.name === 'Date')?.value;

        // Extract the body content
        const body = getEmailBody(email.data.payload);

        // Convert HTML to plain text and exclude links
        const plainTextBody = htmlToText(body, {
          wordwrap: 130,
          selectors: [
            { selector: 'a', format: 'skip' }, // Skip all anchor tags
            { selector: 'img', format: 'skip' }, // Optionally skip images
          ],
        });

        return {
          id: email.data.id,
          subject,
          from,
          date,
          snippet: email.data.snippet,
          body: plainTextBody, // Include the plain text body without links
        };
      })
    );

    res.json(emails);
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
};

// Fetch unread emails from the Primary inbox
const fetchUnreadEmails = async (req, res) => {
  try {
    const oauth2Client = getOAuth2Client();
    const tokens = getTokens(); // Retrieve tokens
    oauth2Client.setCredentials(tokens); // Set credentials on the client

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 200,
      labelIds: ['INBOX', 'UNREAD', 'CATEGORY_PERSONAL'], // Unread emails in Primary inbox
    });

    if (!response.data.messages) {
      return res.json([]);
    }

    const emails = await Promise.all(
      response.data.messages.map(async (message) => {
        const email = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full', // Ensure full email content is retrieved
        });

        const headers = email.data.payload.headers;
        const subject = headers.find((h) => h.name === 'Subject')?.value;
        const from = headers.find((h) => h.name === 'From')?.value;
        const date = headers.find((h) => h.name === 'Date')?.value;

        // Extract the body content
        const body = getEmailBody(email.data.payload);

        // Convert HTML to plain text and exclude links
        const plainTextBody = htmlToText(body, {
          wordwrap: 130,
          selectors: [
            { selector: 'a', format: 'skip' }, // Skip all anchor tags
            { selector: 'img', format: 'skip' }, // Optionally skip images
          ],
        });

        return {
          id: email.data.id,
          subject,
          from,
          date,
          snippet: email.data.snippet,
          body: plainTextBody, // Include the plain text body without links
        };
      })
    );

    res.json(emails);
  } catch (error) {
    console.error('Error fetching unread emails:', error);
    res.status(500).json({ error: 'Failed to fetch unread emails' });
  }
};

// Fetch emails from the last 7 days in the Primary inbox
const fetchRecentEmails = async (req, res) => {
  try {
    const oauth2Client = getOAuth2Client();
    const tokens = getTokens(); // Retrieve tokens
    oauth2Client.setCredentials(tokens); // Set credentials on the client

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Calculate the timestamp for 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const queryDate = Math.floor(sevenDaysAgo.getTime() / 1000);

    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 200,
      labelIds: ['INBOX',], // Only from Primary inbox
      q: `after:${queryDate} -label:CATEGORY_SOCIAL -label:CATEGORY_PROMOTIONS -label:CATEGORY_UPDATES -label:CATEGORY_FORUMS`, // Fetch emails after this date
    });

    if (!response.data.messages) {
      return res.json([]);
    }

    const emails = await Promise.all(
      response.data.messages.map(async (message) => {
        const email = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full', // Ensure full email content is retrieved
        });

        const headers = email.data.payload.headers;
        const subject = headers.find((h) => h.name === 'Subject')?.value;
        const from = headers.find((h) => h.name === 'From')?.value;
        const date = headers.find((h) => h.name === 'Date')?.value;

        // Extract the body content
        const body = getEmailBody(email.data.payload);

        // Convert HTML to plain text and exclude links
        const plainTextBody = htmlToText(body, {
          wordwrap: 130,
          selectors: [
            { selector: 'a', format: 'skip' }, // Skip all anchor tags
            { selector: 'img', format: 'skip' }, // Optionally skip images
          ],
        });

        return {
          id: email.data.id,
          subject,
          from,
          date,
          snippet: email.data.snippet,
          body: plainTextBody, // Include the plain text body without links
        };
      })
    );

    res.json(emails);
  } catch (error) {
    console.error('Error fetching recent emails:', error);
    res.status(500).json({ error: 'Failed to fetch recent emails' });
  }
};

module.exports = { fetchAllEmails, fetchUnreadEmails, fetchRecentEmails };
