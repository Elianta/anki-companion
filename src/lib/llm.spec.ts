import { describe, expect, it, beforeEach, vi } from 'vitest';
import { disambiguate } from './llm';
import type { SimpleTranslationEntry } from '@/services/openai';
import { fetchEnglishTranslations, fetchPolishTranslations } from '@/services/openai';

vi.mock(import('@/services/openai'), () => ({
  fetchPolishTranslations: vi.fn(),
  fetchEnglishTranslations: vi.fn(),
}));

const mockEntry: SimpleTranslationEntry = {
  raw_input: 'zamek [do drzwi]',
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
        comment: 'часто',
      },
    },
  ],
};

describe('disambiguate', () => {
  const fetchPolishMock = vi.mocked(fetchPolishTranslations);
  const fetchEnglishMock = vi.mocked(fetchEnglishTranslations);

  beforeEach(() => {
    fetchPolishMock.mockReset();
    fetchEnglishMock.mockReset();
  });

  it('uses fetchPolishTranslations when langPair === "PL" and returns correctly shaped result', async () => {
    fetchPolishMock.mockResolvedValue(mockEntry);

    const result = await disambiguate(mockEntry.raw_input, 'PL');

    // correct function called
    expect(fetchPolishMock).toHaveBeenCalledTimes(1);
    expect(fetchPolishMock).toHaveBeenCalledWith(mockEntry.raw_input);
    expect(fetchEnglishMock).not.toHaveBeenCalled();

    expect(typeof result.term).toBe('string');
    expect(result.term).toBe(mockEntry.source_word);

    expect(result.langPair).toBe<'PL'>('PL');

    expect(Array.isArray(result.senses)).toBe(true);
    expect(result.senses).toHaveLength(mockEntry.senses.length);

    result.senses.forEach((sense, index) => {
      expect(typeof sense.id).toBe('string');
      expect(sense.id).toBe(`${mockEntry.source_word}-${index + 1}`);
      expect(typeof sense.gloss).toBe('string');

      const originalSense = mockEntry.senses![index];
      if (originalSense.part_of_speech) {
        expect(sense.gloss).toContain(`(${originalSense.part_of_speech})`);
      }

      expect(typeof sense.notes).toBe('string');
    });
  });

  it('uses fetchEnglishTranslations when langPair === "EN" and returns correctly shaped result', async () => {
    const entry = {
      ...mockEntry,
      raw_input: 'lock',
      source_word: 'lock',
      source_language: 'en',
    } as SimpleTranslationEntry;
    fetchEnglishMock.mockResolvedValue(entry);

    const result = await disambiguate(entry.raw_input, 'EN');

    // correct function called
    expect(fetchEnglishMock).toHaveBeenCalledTimes(1);
    expect(fetchEnglishMock).toHaveBeenCalledWith(entry.raw_input);
    expect(fetchPolishMock).not.toHaveBeenCalled();

    expect(result.term).toBe(entry.source_word);
    expect(result.langPair).toBe<'EN'>('EN');
    expect(Array.isArray(result.senses)).toBe(true);
    expect(result.senses).toHaveLength(1);

    const [sense] = result.senses;
    expect(typeof sense.id).toBe('string');
    expect(sense.id).toBe(`${entry.source_word}-1`);
    expect(typeof sense.gloss).toBe('string');
    expect(sense.gloss).toContain(entry.senses[0]!.translation);
    expect(sense.gloss).toContain('(noun)');
    expect(typeof sense.notes).toBe('string');
  });

  it('returns empty senses array when entry.senses is empty', async () => {
    const entry = { ...mockEntry, senses: [] };
    fetchPolishMock.mockResolvedValue(entry);

    const result = await disambiguate('anything', 'PL');

    expect(result.term).toBe(entry.source_word);
    expect(Array.isArray(result.senses)).toBe(true);
    expect(result.senses).toHaveLength(0);
  });
});
