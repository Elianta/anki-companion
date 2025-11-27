import { describe, expect, it, beforeEach, vi } from 'vitest';
import { disambiguate } from './llm';
import type { SimpleTranslationEntry } from '@/services/openai';
import { fetchEnglishTranslations, fetchPolishTranslations } from '@/services/openai';

vi.mock(import('@/services/openai'), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    fetchPolishTranslations: vi.fn(),
    fetchEnglishTranslations: vi.fn(),
    translationEntrySchema: actual.translationEntrySchema,
  };
});

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
      examples: [
        { pl: 'Zamknij zamek.', ru: 'Закрой замок.' },
        { pl: 'Zamek był zepsuty.', ru: 'Замок был сломан.' },
      ],
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
      expect(typeof sense.translationRU).toBe('string');

      const originalSense = mockEntry.senses![index];
      expect(typeof sense.notes).toBe('string');
      expect(sense.partOfSpeech).toBe(originalSense.part_of_speech);
      expect(sense.usageLevel).toBe(originalSense.usage_frequency?.level);
      expect(sense.examples?.length).toBeGreaterThan(0);
    });
  });

  it('uses fetchEnglishTranslations when langPair === "EN" and returns correctly shaped result', async () => {
    const entry = {
      ...mockEntry,
      raw_input: 'lock',
      source_word: 'lock',
      source_language: 'en',
      senses: [
        {
          translation: 'замок',
          part_of_speech: 'noun',
          sense_note: 'механизм',
          usage_frequency: {
            level: 'high',
          },
          examples: [
            { en: 'Lock the door.', ru: 'Закрой дверь на замок.' },
            { en: 'The lock jammed.', ru: 'Замок заклинило.' },
          ],
        },
      ],
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
    expect(typeof sense.translationRU).toBe('string');
    expect(sense.translationRU).toBe(entry.senses[0]!.translation);
    expect(typeof sense.notes).toBe('string');
    expect(sense.partOfSpeech).toBe('noun');
    expect(sense.examples?.length).toBe(2);
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
