/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  SIMPLE_SCHEMA_PL,
  SIMPLE_SCHEMA_EN,
  fetchPolishTranslations,
  fetchEnglishTranslations,
type SimpleTranslationEntry,
} from './openai.ts';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const apiKeyName = 'VITE_OPENAI_API_KEY';
const TEST_API_KEY = 'test-api-key';

describe('OpenAI translation helpers', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.stubEnv(apiKeyName, TEST_API_KEY);
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('SIMPLE_SCHEMA_PL is configured for Polish -> Russian', () => {
    expect(SIMPLE_SCHEMA_PL.name).toBe('simple_translation_entry_pl');
    expect(SIMPLE_SCHEMA_PL.schema.properties.source_language.enum).toEqual(['pl']);
    expect(SIMPLE_SCHEMA_PL.schema.properties.target_language.enum).toEqual(['ru']);
  });

  it('SIMPLE_SCHEMA_EN is configured for English -> Russian', () => {
    expect(SIMPLE_SCHEMA_EN.name).toBe('simple_translation_entry_en');
    expect(SIMPLE_SCHEMA_EN.schema.properties.source_language.enum).toEqual(['en']);
    expect(SIMPLE_SCHEMA_EN.schema.properties.target_language.enum).toEqual(['ru']);
  });

  it('fetchPolishTranslations sends correct request and returns parsed data', async () => {
    const rawInput = 'zamek [do drzwi]';

    const mockPayload: SimpleTranslationEntry = {
      raw_input: rawInput,
      source_word: 'zamek',
      source_language: 'pl',
      target_language: 'ru',
      senses: [
        {
          translation: 'замок',
          part_of_speech: 'noun',
          sense_note: 'дверной замок',
          usage_frequency: {
            level: 'high',
            comment: 'часто используется',
          },
          examples: [
            { pl: 'Zamknij zamek w drzwiach.', ru: 'Закрой замок в двери.' },
            { pl: 'Zamek był uszkodzony.', ru: 'Замок был поврежден.' },
          ],
        },
      ],
    };

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify(mockPayload),
            },
          },
        ],
      }),
    } as any);

    const result = await fetchPolishTranslations(rawInput);

    // Check URL and basic options
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];

    expect(url).toBe(OPENAI_URL);
    expect(options.method).toBe('POST');
    expect(options.headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TEST_API_KEY}`,
    });

    // Check request body
    const body = JSON.parse(options.body);
    expect(body.model).toBe('gpt-4.1-mini');
    expect(body.temperature).toBe(0.2);

    expect(body.response_format).toEqual({
      type: 'json_schema',
      json_schema: SIMPLE_SCHEMA_PL,
    });

    expect(body.messages[0]).toEqual(
      expect.objectContaining({
        role: 'system',
        content: expect.any(String),
      }),
    );
    expect(body.messages[1]).toEqual({
      role: 'user',
      content: rawInput,
    });

    expect(result).toEqual(mockPayload);
  });

  it('fetchEnglishTranslations uses English schema and language', async () => {
    const rawInput = 'castle [fortress]';

    const mockPayload: SimpleTranslationEntry = {
      raw_input: rawInput,
      source_word: 'castle',
      source_language: 'en',
      target_language: 'ru',
      senses: [
        {
          translation: 'крепость',
          part_of_speech: 'noun',
          sense_note: 'крепостное сооружение',
          usage_frequency: {
            level: 'medium',
            comment: 'используется реже, чем базовое значение',
          },
          examples: [
            { en: 'The castle stands on the hill.', ru: 'Замок стоит на холме.' },
            { en: 'They toured the ancient castle.', ru: 'Они осмотрели древний замок.' },
          ],
        },
      ],
    };

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify(mockPayload),
            },
          },
        ],
      }),
    } as any);

    const result = await fetchEnglishTranslations(rawInput);

    const [, options] = fetchMock.mock.calls[0];
    const body = JSON.parse(options.body);

    expect(body.response_format.json_schema).toEqual(SIMPLE_SCHEMA_EN);
    expect(result.source_language).toBe('en');
    expect(result).toEqual(mockPayload);
  });

  it('throws if API key is missing', async () => {
    vi.stubEnv(apiKeyName, undefined);

    await expect(fetchEnglishTranslations('word')).rejects.toThrow('Missing OpenAI API key');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws if OpenAI responds with non-ok status', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal error',
    } as any);

    await expect(fetchPolishTranslations('zamek')).rejects.toThrow(
      'OpenAI request failed: 500 Internal error',
    );
  });

  it('throws if OpenAI returns empty content', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: '   ', // only whitespace
            },
          },
        ],
      }),
    } as any);

    await expect(fetchPolishTranslations('zamek')).rejects.toThrow(
      'OpenAI returned an empty response',
    );
  });

  it('throws if OpenAI returns no choices', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({}), // no choices at all
    } as any);

    await expect(fetchEnglishTranslations('castle')).rejects.toThrow(
      'OpenAI returned an empty response',
    );
  });

  it('throws if OpenAI content is not valid JSON', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: 'not-json',
            },
          },
        ],
      }),
    } as any);

    await expect(fetchPolishTranslations('zamek')).rejects.toThrow(
      'Unable to parse OpenAI response',
    );
  });

  it('coerces missing senses to an empty array', async () => {
    const payloadWithoutSenses = {
      raw_input: 'cat',
      source_word: 'cat',
      source_language: 'en',
      target_language: 'ru',
      // no senses field
    };

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify(payloadWithoutSenses),
            },
          },
        ],
      }),
    } as any);

    const result = await fetchEnglishTranslations('cat');

    expect(result.raw_input).toBe('cat');
    expect(result.senses).toEqual([]);
  });
});
