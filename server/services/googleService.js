const { google } = require('googleapis');
const { htmlToText } = require("html-to-text");

const getOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.REDIRECT_URI
  );
};

const getAuthenticatedClient = (req) => {
  const oauth2Client = getOAuth2Client();
  if (req.session.tokens) {
    oauth2Client.setCredentials(req.session.tokens);
  } else {
    throw new Error('User is not authenticated');
  }
  return oauth2Client;
};

// Helper function to get authenticated Gmail client
const getGmailClient = (req) => {
  const oauth2Client = getOAuth2Client();
  if (req.session.tokens && req.session.tokens.access_token) {
    oauth2Client.setCredentials(req.session.tokens);
    return google.gmail({ version: "v1", auth: oauth2Client });
  } else {
    throw new Error("User is not authenticated");
  }
};

// Function to recursively extract the email body
const getEmailBody = (payload) => {
  let body = "";

  if (payload.parts) {
    payload.parts.forEach((part) => {
      if (part.parts) {
        body += getEmailBody(part);
      } else if (part.mimeType === "text/plain" && part.body.data) {
        body += Buffer.from(part.body.data, "base64").toString("utf-8");
      } else if (part.mimeType === "text/html" && part.body.data) {
        body += Buffer.from(part.body.data, "base64").toString("utf-8");
      }
    });
  } else if (payload.body && payload.body.data) {
    body += Buffer.from(payload.body.data, "base64").toString("utf-8");
  }

  return body;
};

const runEmailQuery = async (req, query) => {

  try {
    const gmail = getGmailClient(req);

    const response = await gmail.users.messages.list(query);

    if (!response.data.messages) {
      return []
    }

    const emails = await Promise.all(
      response.data.messages.map(async (message) => {
        const email = await gmail.users.messages.get({
          userId: "me",
          id: message.id,
          format: "full",
        });

        const headers = email.data.payload.headers;
        const subject = headers.find((h) => h.name === "Subject")?.value;
        const from = headers.find((h) => h.name === "From")?.value;
        const date = headers.find((h) => h.name === "Date")?.value;

        const body = getEmailBody(email.data.payload);

        const plainTextBody = htmlToText(body, {
          wordwrap: 130,
          selectors: [
            { selector: "a", format: "skip" },
            { selector: "img", format: "skip" },
          ],
        });

        return {
          id: email.data.id,
          subject,
          from,
          date,
          snippet: email.data.snippet,
          body: plainTextBody,
        };
      })
    );

    return emails
  } catch (error) {
    console.error("Error querying email:", error);
  }
};

module.exports = { getOAuth2Client, getAuthenticatedClient, runEmailQuery };
