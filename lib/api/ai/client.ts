import "server-only";

// packages
import OpenAI from "openai";

// the one openai client: the chat contact-info guard and the pleading summary draft
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
