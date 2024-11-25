const axios = require("axios");

const orchestrateLLM = async (userInput) => {
  try {
    const tools = [
      {
        type: "function",
        function: {
          name: "fetch_gmail_messages",
          description:
            "Fetch messages from Gmail using specific query parameters. User must be explicit that they want you to pull emails",
          parameters: {
            type: "object",
            required: ["userId"],
            properties: {
              userId: {
                type: "string",
                description:
                  "The user ID. Use 'me' to indicate the authenticated user.",
              },
              maxResults: {
                type: "number",
                description: "The maximum number of messages to return.",
              },
              labelIds: {
                type: "array",
                items: {
                  type: "string",
                },
                description:
                  "A list of label IDs to filter messages, e.g., ['INBOX'].",
              },
              q: {
                type: "string",
                description:
                  "A Gmail query string to filter messages, e.g., 'after:7d -label:CATEGORY_PROMOTIONS'.",
              },
            },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "answer_user_questions",
          description:
            "Answers user questions about emails that have already been pulled.",
          parameters: {
            type: "object",
            required: ["userPrompt"],
            properties: {
              userPrompt: {
                type: "string",
                description:
                  "The question or prompt from the user regarding their emails. For example, 'Tell me about the email from Amazon' or 'Summarize my emails from the last week.'",
              },
            },
          },
        },
      },
    ];

    const payload = {
      model: "accounts/fireworks/models/firefunction-v2",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful orchestrator assistant that chooses the correct tool call(s). Specify the tool call(s) necessary to complete their request. Don't worry about outputting text. If the user's wants to fetch emails from Gmail, you should use the fetch_gmail_messages function. In order to call fetch_gmail_messages, it must be clear that the user wants to fetch emails. If the user prompt indicates that they want to 'chat' with, summarize, or have questions about the current emails then you should call the answer_user_questions function. If you are not chooseing fetch_gmail_messages, you should choose answer_user_questions.",
        },
        { role: "user", content: userInput },
      ],
      tools: tools, // Pass the function spec here
      temperature: 0.6,
    };

    const response = await axios.post(
      "https://api.fireworks.ai/inference/v1/chat/completions",
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.FIREWORKS_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0];
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
};

const writeEmailQueryLLM = async (userPrompt) => {
  try {
    const url = "https://api.fireworks.ai/inference/v1/chat/completions";

    // System and user messages
    const system_message =
      'You are an expert at using the Google Gmail API. Your responsibility is to return the query that can be used to accomplish the user\'s ask. The only output should be the query in the format:\n{\n  "userId": "me",\n  "maxResults": 200,\n  "labelIds": ["INBOX"],\n  "q": "-label:CATEGORY_SOCIAL -label:CATEGORY_PROMOTIONS -label:CATEGORY_UPDATES -label:CATEGORY_FORUMS"\n}\n** Return ONLY the query object as a STRING without any characters indicating code or JSON.';
    const user_message = `Write the exact Google Gmail API query to fetch the emails based on the User Prompt. \nUser Prompt: ${userPrompt}`;

    // Define the JSON schema for the response
    const outputSchema = {
      type: "object",
      properties: {
        userId: { type: "string" },
        maxResults: { type: "number" },
        labelIds: { type: "array", items: { type: "string" } },
        q: { type: "string" },
      },
      required: ["userId", "maxResults", "labelIds", "q"],
    };

    // Payload for the Fireworks API request
    const payload = {
      model: "accounts/fireworks/models/llama-v3p2-3b-instruct",
      max_tokens: 128000,
      top_p: 1,
      top_k: 40,
      presence_penalty: 0,
      frequency_penalty: 0,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: system_message,
        },
        {
          role: "user",
          content: user_message,
        },
      ],
      response_format: {
        type: "json_object",
        schema: outputSchema, // Attach the schema
      },
    };

    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.FIREWORKS_API_KEY}`,
    };

    // Make the API request
    const response = await axios.post(url, payload, { headers });
    const responseString = response.data.choices[0].message.content;

    console.log("Raw Response:", responseString);

    // Parse the response as JSON (it should conform to the schema)
    const responseObject = JSON.parse(responseString);

    console.log("Parsed Response:", responseObject);

    return responseObject;
  } catch (error) {
    console.error(
      "Error writing email query:",
      error.response?.data || error.message
    );
    throw error;
  }
};

const formatEmails = async (emailArray) => {
  let formattedString = "";

  for (let i = 0; i < emailArray.length; i++) {
    const email = emailArray[i];
    formattedString += `
Email #${i + 1}:
---------------
Subject: ${email.subject}
From: ${email.from}
Date: ${email.date}
Body: ${email.body}
---------------
`;
  }

  return formattedString;
};

const runEmailSummary = async (
  argumentsObj,
  currentEmails,
  currentEmailsChats
) => {
  try {
    const userPrompt = argumentsObj["userPrompt"];
    const emails = await formatEmails(currentEmails);

    const url = "https://api.fireworks.ai/inference/v1/chat/completions";

    // System and user messages
    const system_message =
      "You are an expert at answering questions based on a set of emails. Your response should satisfy the User Prompt";
    const user_message = `Emails:\n ${emails}\n\nUser Prompt: ${userPrompt}`;
    const messages = [
      {
        role: "system",
        content: system_message,
      },
      ...currentEmailsChats,
      {
        role: "user",
        content: user_message,
      },
    ];

    // Payload for the Fireworks API request
    const payload = {
      model: "accounts/fireworks/models/llama-v3p2-3b-instruct",
      max_tokens: 4096,
      top_p: 1,
      top_k: 40,
      presence_penalty: 0,
      frequency_penalty: 0,
      temperature: 0.6,
      messages: messages,
    };

    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.FIREWORKS_API_KEY}`,
    };

    // Make the API request
    const response = await axios.post(url, payload, { headers });
    const responseString = response.data.choices[0].message.content;

    return responseString;
  } catch (error) {
    console.error(
      "Error answering user prompt:",
      error.response?.data || error.message
    );
    throw error;
  }
};

module.exports = { writeEmailQueryLLM, orchestrateLLM, runEmailSummary };
