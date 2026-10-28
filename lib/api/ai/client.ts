import "server-only";

// packages
import OpenAI from "openai";

let client: OpenAI | null = null;

// the one openai client: the chat contact-info guard, the pleading summary draft and the review /
// profile checks (lib/api/ai/ai.ts). built on the first call, once, never at import: a missing
// OPENAI_API_KEY throws here, inside the caller's own try/catch
export function openai(): OpenAI {
  client ??= new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  return client;
}
