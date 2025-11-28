import OpenAI from 'openai';
import { createApp } from './app.js';

function parseAllowedOrigins(rawOrigins?: string) {
  return rawOrigins
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function buildAppFromEnv() {
  const allowedOrigins = parseAllowedOrigins(process.env.ALLOWED_ORIGINS);

  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    console.warn('Missing OPENAI_API_KEY; set it before making requests.');
  }

  const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : undefined;

  return createApp({ openaiClient: openai, allowedOrigins });
}
