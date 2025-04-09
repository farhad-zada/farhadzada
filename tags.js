import OpenAI from "openai";
import { config } from "dotenv";
import readline from "readline";
import { encoding_for_model } from "tiktoken";
config();

const openai = new OpenAI({
  apiKey: process.env.BLUESTORE_OPENAI_KEY,
});
const enc = encoding_for_model("gpt-4o-mini");

let tokens_used = 0;

const MAX_TOKENS = 13000;

function colorMessage(content) {
    console.log(`\x1b[36m${content}\x1b[0m`);
}
function colorToolCall(tool_call) {
    console.log(`\x1b[33m${tool_call}\x1b[0m`);
}
const systemInstructions = `
If you can infer any tags from the user's message, please do so. 
Give these tags to the function 'get_clothes_by_tags' to get clothes that match the tags.
If you can't infer any tags, please ask the user for more information.
Respond to the user by asking questions or providing suggestions to help them find the clothes they are looking for 
and also getting more information about the clothes they want to wear.
`;

const tools = [
  {
    type: "function",
    function: {
      name: "get_clothes_by_tags",
      description: "Get clothes by tags assigned to them.",
      parameters: {
        type: "object",
        properties: {
          tags: {
            type: "array",
            items: {
              type: "string",
            },
          },
        },
        required: ["tags"],
        additionalProperties: false,
      },
      strict: true,
    },
  },
];

const systamMessages = [
  { role: "system", content: `Date: ${Date.now()}` },
  { role: "system", content: systemInstructions },
];
let messages = [];

tokens_used = systamMessages.reduce(
  (acc, message) => acc + enc.encode(message.content).length,
  0
);
tokens_used += tools.reduce(
  (acc, tool) => acc + enc.encode(JSON.stringify(tool)).length,
  0
);
function check_token_limit_window(messages) {
  while (tokens_used > MAX_TOKENS) {
    tokens_used -= enc.encode(messages.shift().content).length;
  }
}

// if (completion.choices[0].message.tool_calls) {
//   completion.choices[0].message.tool_calls.forEach((tool_call) => {
//     console.log(tool_call.function.parsed_arguments);
//   });
//   messages.push(completion.choices[0].message);
//   messages.push({
//     role: "tool",
//     tool_call_id: completion.choices[0].message.tool_calls[0].id,
//     content: "Party dress",
//   });
//   let response = await openai.beta.chat.completions.parse({
//     model: "gpt-4o-2024-08-06",
//     messages,
//   });
//   console.log(response.choices[0].message);
// } else {
//   console.log(completion.choices[0].message);
// }
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function add_response_to_messages(response) {
    if(response.choices[0].message.content) {
        tokens_used += enc.encode(response.choices[0].message.content).length;
        messages.push(response.choices[0].message);
    }
    if (response.choices[0].message.tool_calls) {
        response.choices[0].message.tool_calls.forEach((tool_call) => {
            console.log(tool_call.function.parsed_arguments);
        });
        tokens_used += enc.encode(response.choices[0].message.tool_calls[0].function.arguements).length;
        messages.push({
            role: "tool",
            tool_call_id: response.choices[0].message.tool_calls[0].id,
            content: response.choices[0].message.tool_calls[0].function.parsed_arguments,
        });
        tokens_used += enc.encode(response.choices[0].message.tool_calls[0].function.arguements).length;
    }
}

async function getResponse(userMessage) {
  messages.push({ role: "user", content: userMessage });
  tokens_used += enc.encode(userMessage).length;
  console.log("tokens used before", tokens_used);
  check_token_limit_window(messages);
  console.log("tokens used before", tokens_used);
  const response = await openai.beta.chat.completions.parse({
    model: "gpt-4o-mini",
    messages: [...systamMessages, ...messages],
    tools: tools,
    max_tokens: MAX_TOKENS - tokens_used,
  });

  colorMessage(response.choices[0].message.content);
    if (response.choices[0].message.tool_calls) {
        response.choices[0].message.tool_calls.forEach((tool_call) => {
        colorToolCall(tool_call.function.parsed_arguments);
        });
    }
  console.log(
    `Promt tokens: ${response.usage.prompt_tokens}\nCompletion tokens: ${response.usage.completion_tokens}\nTotal tokens: ${response.usage.total_tokens}`
  );
  add_response_to_messages(response);
  return;
}

async function main() {
  while (true) {
    console.log("Type a message (or type 'exit' to quit):");
    const userMessage = await new Promise((resolve) =>
      rl.question("> ", resolve)
    );

    if (userMessage.toLowerCase() === "exit") {
      console.log("Exiting...");
      rl.close();
      break;
    }
    console.log("Getting response...");
    await getResponse(userMessage);
  }
}
main().catch((err) => console.log(err));
// enc.free();
