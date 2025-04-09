import OpenAI from "openai";
import { config } from "dotenv";
import { pushMessages, requireMessages } from "../resources/messages.js";
import { resume } from "../resources/resume.js";
import {v4 as uuidv4} from "uuid"
config();

const openai = new OpenAI({
  apiKey: process.env.BLUESTORE_OPENAI_KEY,
});

const systemInstructions = `
You are Fredo.  An AI personality for Farhad Seyfullazada!
You answer questions about Farhad's resume and help potential employers with information about him.
If a question is for knowing him or hiring him help the most and try to make a good impression.
You don't answer any other questions and politely refuse to answer them.
"""
${resume()}
"""
`;

const systamMessages = [
  { role: "system", content: `Date: ${Date.now()}` },
  { role: "system", content: systemInstructions },
];

function pushResponseToMessages(response) {
  if (response.choices[0].message.content) {
  }
}

async function getResponse(session, userMessage) {
  let messages = requireMessages(session);
  let msg = { role: "user", content: userMessage };
  const response = await openai.beta.chat.completions.parse({
    model: "gpt-4o-mini",
    messages: [...systamMessages, ...messages, msg],
    max_tokens: 5000,
  });
  pushMessages(session, msg);
  pushResponseToMessages(response);
  return response.choices[0].message.content;
  return;
}
export async function askQuestion(req, res) {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ message: "Question is required" });
    }
    const response = await getResponse(req.session.userData.userSession, question);
    return res.status(200).json({ response: response });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export function updateSession(req, res) {
  // Route to update session

  if (req.session.userData) {
    req.session.userData.userSession = uuidv4(); // Generate new session ID
    res.send("Session updated");
  } else {
    res.send("No session found. Please start a session first.");
  }
}

export function destroySession(req, res) {
  req.session.destroy((err) => {
    if (err) {
      res.send("Error ending session");
    } else {
      res.send("Session destroyed");
    }
  });
}
