import OpenAI from "openai";
import { env } from "../../config/env.js";

let openaiClient;

export function getOpenAiClient() {
  if (!env.openaiApiKey) return null;

  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: env.openaiApiKey });
  }

  return openaiClient;
}

export function isOpenAiReady() {
  return Boolean(getOpenAiClient());
}

export async function createTextResponse({ instructions, input, maxOutputTokens = 900 }) {
  const client = getOpenAiClient();
  if (!client) return null;

  return client.responses.create({
    model: env.openaiModel,
    instructions,
    input,
    max_output_tokens: maxOutputTokens
  });
}

export async function createParsedResponse({ instructions, input, textFormat, maxOutputTokens = 1500 }) {
  const client = getOpenAiClient();
  if (!client) return null;

  return client.responses.parse({
    model: env.openaiModel,
    instructions,
    input,
    text: {
      format: textFormat
    },
    max_output_tokens: maxOutputTokens
  });
}

export async function createTextStream({ instructions, input, maxOutputTokens = 900 }) {
  const client = getOpenAiClient();
  if (!client) return null;

  return client.responses.create({
    model: env.openaiModel,
    instructions,
    input,
    max_output_tokens: maxOutputTokens,
    stream: true
  });
}
