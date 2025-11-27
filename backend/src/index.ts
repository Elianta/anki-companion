import 'dotenv/config';
import OpenAI from 'openai';
import { createApp } from './app.js';

const port = Number(process.env.PORT) || 3001;
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean);

const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
  console.warn('Missing OPENAI_API_KEY; set it in .env before making requests.');
}

const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : undefined;
const app = createApp({ openaiClient: openai, allowedOrigins });

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
