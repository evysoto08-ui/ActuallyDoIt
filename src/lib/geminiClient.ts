import { GoogleGenAI } from "@google/genai";

// Free-tier Gemini model. "gemini-flash-latest" is an alias Google keeps
// pointed at their current Flash model, so this shouldn't need updating
// every time they ship a new version.
export const GEMINI_MODEL = "gemini-flash-latest";

let client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
}
