const { getOAuth2Client, runEmailQuery } = require("../services/googleService");
const {
  writeEmailQueryLLM,
  orchestrateLLM,
  runEmailSummary,
} = require("../services/fireworks");

// Fetch emails based on a user query
const writeEmailQuery = async (req, res) => {
  try {
    const { userPrompt } = req.body;
    console.log(userPrompt);

    // Write the query using your Fireworks service
    const query = await writeEmailQueryLLM(userPrompt);

    res.json({ query });
  } catch (error) {
    console.log("ERROR writing API query: " + error);
  }
};

const markUnreadMessagesAsRead = async (req, res) => {
  try {
    const gmail = getGmailClient(req);

    // Fetch unread messages
    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults: 100, // Adjust as needed
      labelIds: ["INBOX", "UNREAD"], // Filter for unread messages in the inbox
    });

    if (!response.data.messages || response.data.messages.length === 0) {
      return res.json({ message: "No unread messages found." });
    }

    // Mark each unread message as read
    await Promise.all(
      response.data.messages.map(async (message) => {
        await gmail.users.messages.modify({
          userId: "me",
          id: message.id,
          resource: {
            removeLabelIds: ["UNREAD"], // Remove the UNREAD label
          },
        });
      })
    );

    res.json({
      message: `${response.data.messages.length} messages marked as read.`,
    });
  } catch (error) {
    console.error("Error marking unread messages as read:", error);
    if (error.message === "User is not authenticated") {
      res.status(401).json({ error: "User is not authenticated" });
    } else {
      res.status(500).json({ error: "Failed to mark unread messages as read" });
    }
  }
};

const orchestrateResponse = async (req, res) => {
  console.log("Orchestrating proper response");
  try {
    const { userPrompt, currentEmails, currentEmailsChats } = req.body;

    // Write the query using your Fireworks service
    const orchestrationResult = await orchestrateLLM(userPrompt);
    console.log(orchestrationResult)

    if (orchestrationResult["finish_reason"] == "tool_calls") {
      console.log("Looping through tools")
      for (const tool_call of orchestrationResult["message"]["tool_calls"]) {
        const { name, arguments } = tool_call["function"];

        const argumentsObj = JSON.parse(arguments);

        if (name == "fetch_gmail_messages") {
          console.log("QUERYING EMAILS");
          var emails = await runEmailQuery(req, argumentsObj);
        } else if (name == "respond_to_email_query") {
          console.log("RESPONDING TO USER");
          var assistantResponse = await runEmailSummary(
            argumentsObj,
            currentEmails,
            currentEmailsChats
          );
        } else {
          console.log("NO FUNCTION FOUND");
        }
      }
    }

    if (emails) {
      res.json({ type: "emails", emails });
    } else if (assistantResponse) {
      res.json({ type: "LLM", assistantResponse });
    } else {
      res.json({});
    }
  } catch (error) {
    console.log("ERROR orchestrating the convo: " + error);
  }
};

const test = async (req, res) => {
  const response = await orchestrateLLM("Modify all emails in the last 7");

  res.json(response);
};

module.exports = {
  writeEmailQuery,
  runEmailQuery,
  orchestrateResponse,
  test,
};
