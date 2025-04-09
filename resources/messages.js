import { encoding_for_model } from "tiktoken";
const enc = encoding_for_model("gpt-4o-mini");

const MAX_TOKENS = 100000;

const sessionMessages = {};

function tokensUsed(msgs) {
  return msgs.reduce((acc, msg) => acc + enc.encode(msg.content).length, 0);
}

function slideTokenLimitWindow(msgs) {
  let usedTokens = tokensUsed(msgs);
  while (usedTokens > MAX_TOKENS) {
    usedTokens -= enc.encode(msgs.shift().content).length;
  }
}

export function requireMessages(session) {
  if (!sessionMessages[session]) {
    sessionMessages[session] = [];
  }
  /**
   * @type {string[]}
   */
  let msgs = sessionMessages[session];
  slideTokenLimitWindow(msgs);
  return msgs;
}

export function pushMessages(session, msg) {
  /**
   * @type {string[]}
   */
  let msgs = sessionMessages[session];
  msgs.push(msg);
}
