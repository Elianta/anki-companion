import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DraftEntry } from '@/lib/db';
import { generateCardPayload } from './card-generator';
import { ApiError } from './api';
import { useLLMStore, DEFAULT_LLM_MODEL, DEFAULT_LLM_PROVIDER } from '@/stores/llm';

describe('generateCardPayload (backend API)', () => {
  const fetchMock = vi.fn();
  const draft: DraftEntry = {
    id: 1,
    term: 'zamek',
    language: 'PL',
    noteType: 'PL: Default',
    sense: {
      id: 'zamek-1',
      translationRU: 'замок',
      notes: 'door lock',
      partOfSpeech: 'noun',
      usageLevel: 'high',
      examples: ['zamek jest zamknięty — замок закрыт'],
    },
    card: null,
    exported: false,
    exportedAt: null,
  };

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    useLLMStore.setState({ llmProvider: DEFAULT_LLM_PROVIDER, llmModel: DEFAULT_LLM_MODEL });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('sends draft data to backend and returns generated card', async () => {
    const generatedCard = {
      noteType: draft.noteType,
      fields: { Word: 'zamek', Translation: 'замок' },
      schemaName: 'pl_default_note',
      generatedAt: '2024-01-01T00:00:00.000Z',
    };

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => generatedCard,
    });

    const result = await generateCardPayload({ draft });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/api/cards-generate');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({
      draft,
      llmProvider: DEFAULT_LLM_PROVIDER,
      llmModel: DEFAULT_LLM_MODEL,
    });
    expect(result).toEqual(generatedCard);
  });

  it('throws when backend responds with an error', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server missing OPENAI_API_KEY' }),
    });

    await expect(generateCardPayload({ draft })).rejects.toThrow(
      'Card generation request failed: 500 Server missing OPENAI_API_KEY',
    );
  });

  it('throws ApiError with retryAfterSeconds on 429 responses', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 429,
      headers: new Headers({ 'retry-after': '20' }),
      json: async () => ({ error: 'Too many requests' }),
    });

    const error = (await generateCardPayload({ draft }).catch((err) => err)) as ApiError;

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(429);
    expect(error.retryAfterSeconds).toBe(20);
    expect(error.message).toBe('Too many requests');
  });

  it('throws when backend returns invalid JSON', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => {
        throw new Error('bad json');
      },
    });

    await expect(generateCardPayload({ draft })).rejects.toThrow(
      'Card generation API returned invalid JSON',
    );
  });

  it('validates generated card shape', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        noteType: draft.noteType,
        fields: 'not-an-object',
        schemaName: 'pl_default_note',
        generatedAt: '2024-01-01T00:00:00.000Z',
      }),
    });

    await expect(generateCardPayload({ draft })).rejects.toThrow();
  });
});
