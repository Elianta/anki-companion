import { z } from 'zod';
import { apiPath, buildApiError, parseJsonOrThrow } from './api';

export type SourceLanguage = 'pl' | 'en';

const TRANSLATIONS_ENDPOINT = apiPath('/api/translations');

export const translationEntrySchema = z.object({
  raw_input: z.string(),
  source_word: z.string(),
  source_language: z.union([z.literal('pl'), z.literal('en')]),
  target_language: z.literal('ru'),
  senses: z
    .array(
      z.object({
        translation: z.string(),
        part_of_speech: z.string().nullable(),
        sense_note: z.string().nullable(),
        usage_frequency: z
          .object({
            level: z.enum(['low', 'medium', 'high']),
            comment: z.string().optional(),
          })
          .nullable(),
        examples: z.array(
          z.union([
            z.object({
              pl: z.string(),
              ru: z.string(),
            }),
            z.object({
              en: z.string(),
              ru: z.string(),
            }),
          ]),
        ),
      }),
    )
    .default([]),
});

export type SimpleTranslationEntry = z.infer<typeof translationEntrySchema>;

const fetchTranslations = async (
  rawInput: string,
  sourceLanguage: SourceLanguage,
): Promise<SimpleTranslationEntry> => {
  const response = await fetch(TRANSLATIONS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ rawInput, sourceLanguage }),
  });

  if (!response.ok) {
    await buildApiError(response, 'Translation API request failed');
  }

  const payload = await parseJsonOrThrow<unknown>(
    response,
    'Translation API returned invalid JSON',
  );
  return translationEntrySchema.parse(payload);
};

export const fetchPolishTranslations = (rawInput: string) =>
  fetchTranslations(rawInput, 'pl');

export const fetchEnglishTranslations = (rawInput: string) =>
  fetchTranslations(rawInput, 'en');
