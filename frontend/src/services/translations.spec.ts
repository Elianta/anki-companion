/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchEnglishTranslations,
  fetchPolishTranslations,
  translationEntrySchema,
  type SimpleTranslationEntry,
} from './translations';
import { ApiError } from './api';

describe('translation API helpers', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('fetchPolishTranslations calls backend API and returns parsed data', async () => {
    const rawInput = 'zamek [do drzwi]';
    const payload: SimpleTranslationEntry = {
      raw_input: rawInput,
      source_word: 'zamek',
      source_language: 'pl',
      target_language: 'ru',
      senses: [
        {
          translation: 'замок',
          part_of_speech: 'noun',
          sense_note: 'дверной механизм',
          usage_frequency: {
            level: 'high',
            comment: 'часто используется',
          },
          examples: [
            { pl: 'Zamknij zamek.', ru: 'Закрой замок.' },
            { pl: 'Zamek był zepsuty.', ru: 'Замок был сломан.' },
          ],
        },
      ],
    };

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => payload,
    } as any);

    const result = await fetchPolishTranslations(rawInput);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/api/translations');
    expect(options.method).toBe('POST');
    expect(options.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(options.body)).toEqual({ rawInput, sourceLanguage: 'pl' });
    expect(result).toEqual(payload);
  });

  it('fetchEnglishTranslations sends the correct payload', async () => {
    const rawInput = 'castle [fortress]';
    const payload: SimpleTranslationEntry = {
      raw_input: rawInput,
      source_word: 'castle',
      source_language: 'en',
      target_language: 'ru',
      senses: [],
    };

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => payload,
    } as any);

    const result = await fetchEnglishTranslations(rawInput);

    const [url, options] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/api/translations');
    expect(JSON.parse(options.body)).toEqual({ rawInput, sourceLanguage: 'en' });
    expect(result.source_language).toBe('en');
    expect(result).toEqual(payload);
  });

  it('throws when backend responds with an error', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server missing OPENAI_API_KEY' }),
    } as any);

    await expect(fetchPolishTranslations('zamek')).rejects.toThrow(
      'Translation API request failed: 500 Server missing OPENAI_API_KEY',
    );
  });

  it('exposes retryAfterSeconds when backend returns 429', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 429,
      headers: new Headers({ 'retry-after': '12' }),
      json: async () => ({ error: 'Too many requests' }),
    } as any);

    const error = (await fetchPolishTranslations('zamek').catch((err) => err)) as ApiError;

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(429);
    expect(error.retryAfterSeconds).toBe(12);
    expect(error.message).toBe('Too many requests');
  });

  it('throws when backend returns invalid JSON', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => {
        throw new Error('boom');
      },
    } as any);

    await expect(fetchEnglishTranslations('castle')).rejects.toThrow(
      'Translation API returned invalid JSON',
    );
  });

  it('coerces missing senses to an empty array', async () => {
    const payloadWithoutSenses = {
      raw_input: 'cat',
      source_word: 'cat',
      source_language: 'en',
      target_language: 'ru',
    };

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => payloadWithoutSenses,
    } as any);

    const result = await fetchEnglishTranslations('cat');

    expect(result.raw_input).toBe('cat');
    expect(result.senses).toEqual([]);
    expect(() => translationEntrySchema.parse(payloadWithoutSenses)).not.toThrow();
  });
});
