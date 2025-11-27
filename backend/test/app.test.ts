import { describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import { createRequest, createResponse } from 'node-mocks-http';
import { createApp } from '../src/app.js';

const mockCompletionResponse = {
  choices: [{ message: { role: 'assistant', content: 'Hello!' } }],
  model: 'gpt-4o-mini',
  usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
};

const createMockOpenAI = () => {
  const create = vi.fn().mockResolvedValue(mockCompletionResponse);
  return {
    chat: {
      completions: {
        create,
      },
    },
  };
};

async function runRequest(app, options: { method: string; url: string; body?: unknown }) {
  const req = createRequest({
    method: options.method,
    url: options.url,
    headers: { 'content-type': 'application/json' },
    body: options.body,
  });
  const res = createResponse({ eventEmitter: EventEmitter });

  await new Promise<void>((resolve) => {
    res.on('end', () => resolve());
    app.handle(req, res);
  });

  return res;
}

describe('createApp', () => {
  it('returns health status', async () => {
    const app = createApp();
    const res = await runRequest(app, { method: 'GET', url: '/health' });

    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual({ status: 'ok' });
  });

  it('rejects missing messages', async () => {
    const app = createApp({ openaiClient: createMockOpenAI() });
    const res = await runRequest(app, { method: 'POST', url: '/api/chat', body: {} });

    expect(res.statusCode).toBe(400);
    expect(res._getJSONData().error).toMatch(/messages must be a non-empty array/i);
  });

  it('fails without OPENAI_API_KEY', async () => {
    const app = createApp();
    const res = await runRequest(app, {
      method: 'POST',
      url: '/api/chat',
      body: { messages: [{ role: 'user', content: 'Hello' }] },
    });

    expect(res.statusCode).toBe(500);
    expect(res._getJSONData().error).toMatch(/OPENAI_API_KEY/i);
  });

  it('forwards chat requests to OpenAI client', async () => {
    const openaiClient = createMockOpenAI();
    const app = createApp({ openaiClient });

    const payload = {
      messages: [
        { role: 'system', content: 'You are a test bot.' },
        { role: 'user', content: 'Say hi' },
      ],
      model: 'gpt-4o-mini',
      temperature: 0.3,
    };

    const res = await runRequest(app, { method: 'POST', url: '/api/chat', body: payload });

    expect(res.statusCode).toBe(200);
    expect(openaiClient.chat.completions.create).toHaveBeenCalledWith(payload);
    expect(res._getJSONData().message).toEqual(mockCompletionResponse.choices[0].message);
    expect(res._getJSONData().model).toBe(mockCompletionResponse.model);
    expect(res._getJSONData().usage).toEqual(mockCompletionResponse.usage);
  });
});
