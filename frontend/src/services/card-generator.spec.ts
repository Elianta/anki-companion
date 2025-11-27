import { describe, expect, it, beforeEach, vi } from 'vitest';

import type { DraftEntry } from '@/lib/db';
import { generateCardPayload } from './card-generator';
import { CARD_SCHEMAS } from '@/services/card-schemas';
import { OPENAI_MODEL, requestJsonCompletion } from '@/services/openai';

vi.mock('@/services/openai', () => ({
  OPENAI_MODEL: 'mock-model',
  requestJsonCompletion: vi.fn(),
}));

const buildDraft = (overrides: Partial<DraftEntry> = {}): DraftEntry => ({
  id: 1,
  term: 'zamek',
  language: 'PL',
  noteType: 'PL: Default',
  sense: {
    id: 'zamek-1',
    translationRU: 'замок',
    notes: 'дверной механизм',
    partOfSpeech: 'noun',
    usageLevel: 'high',
    examples: ['zamek jest zamknięty — замок закрыт'],
  },
  card: null,
  ...overrides,
});

describe('generateCardPayload', () => {
  const completionMock = vi.mocked(requestJsonCompletion);

  beforeEach(() => {
    completionMock.mockReset();
  });

  it('generates card payload for PL: Default schema', async () => {
    const draft = buildDraft();
    const schema = CARD_SCHEMAS['PL: Default'];
    const response = Object.fromEntries(schema.jsonSchema.schema.required.map((key) => [key, `${key}-value`]));

    completionMock.mockResolvedValueOnce(JSON.stringify(response));

    const result = await generateCardPayload({ draft });

    expect(requestJsonCompletion).toHaveBeenCalledWith({
      model: OPENAI_MODEL,
      temperature: 0.2,
      response_format: {
        type: 'json_schema',
        json_schema: schema.jsonSchema,
      },
      messages: expect.any(Array),
    });

    expect(result.noteType).toBe('PL: Default');
    expect(result.fields).toEqual(response);
    expect(result.schemaName).toBe(schema.name);
  });

  it('validates response via zod', async () => {
    const draft = buildDraft();
    completionMock.mockResolvedValueOnce(JSON.stringify({ Word: 'zamek' }));

    await expect(generateCardPayload({ draft })).rejects.toThrow();
  });

  it('selects schema based on note type', async () => {
    const draft = buildDraft({ noteType: 'EN: Default', language: 'EN', term: 'lock' });
    const schema = CARD_SCHEMAS['EN: Default'];
    const response = Object.fromEntries(schema.jsonSchema.schema.required.map((key) => [key, `${key}-value`]));
    completionMock.mockResolvedValueOnce(JSON.stringify(response));

    const result = await generateCardPayload({ draft });

    expect(result.noteType).toBe('EN: Default');
    expect(result.fields).toEqual(response);
    expect(result.schemaName).toBe(schema.name);
  });
});
