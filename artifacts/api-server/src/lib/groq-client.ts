import Groq from "groq-sdk";

const apiKey = process.env.GROQ_API_KEY?.trim();

export const isAiProviderConfigured = Boolean(apiKey);

export const groq = apiKey
  ? new Groq({
      apiKey,
    })
  : null;

export const CHAT_MODEL = "llama-3.3-70b-versatile";
export const FAST_MODEL = "llama-3.1-8b-instant";
