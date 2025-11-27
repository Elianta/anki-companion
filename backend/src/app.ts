import cors from 'cors';
import express from 'express';
import type OpenAI from 'openai';

type OpenAIClient = Pick<OpenAI, 'chat'>;

type CreateAppOptions = {
  openaiClient?: OpenAIClient;
  allowedOrigins?: string[];
};

export function createApp(options: CreateAppOptions = {}) {
  const { openaiClient, allowedOrigins } = options;
  const app = express();

  const corsOrigin = allowedOrigins && allowedOrigins.length > 0 ? allowedOrigins : true;
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json({ limit: '2mb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/chat', async (req, res) => {
    if (!openaiClient) {
      return res.status(500).json({ error: 'Server missing OPENAI_API_KEY' });
    }

    const { messages, model = 'gpt-4o-mini', temperature = 0.2 } = req.body ?? {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages must be a non-empty array' });
    }

    try {
      const completion = await openaiClient.chat.completions.create({
        model,
        temperature,
        messages,
      });

      const choice = completion.choices?.[0]?.message;
      return res.json({
        model: completion.model,
        usage: completion.usage,
        message: choice,
      });
    } catch (error) {
      console.error('OpenAI request failed', error);
      const status = (error as { status?: number })?.status ?? 500;
      return res.status(status).json({ error: (error as Error).message ?? 'OpenAI request failed' });
    }
  });

  return app;
}
