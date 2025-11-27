import { z } from 'zod';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
export const OPENAI_MODEL = 'gpt-4.1-mini';

const buildSystemPrompt = (sourceLanguage: SourceLanguage) =>
  `You are a bilingual lexicographer (${sourceLanguage === 'pl' ? 'Polish' : 'English'} → Russian).

Input may include an extra hint in square brackets, e.g.:
  - 'zamek [do drzwi]'
  - 'zamek [warownia]'
Treat EVERYTHING inside square brackets as contextual disambiguation ONLY.
Strip it from the lemma: source_word MUST be the clean ${sourceLanguage === 'pl' ? 'Polish' : 'English'} lemma without any square brackets or their content.
Do NOT echo the square brackets text in translations; use it only to pick the correct sense.

Task:
Given one ${sourceLanguage === 'pl' ? 'Polish' : 'English'} word or short phrase, produce Russian translations.
If multiple distinct senses exist, return multiple sense entries.
If input is not a valid word or phrase in ${sourceLanguage === 'pl' ? 'Polish' : 'English'}, return an empty senses array.
Provide several example sentences (1 or 2) in ${sourceLanguage === 'pl' ? 'Polish' : 'English'} with Russian translations.
Output MUST be valid JSON ONLY, matching exactly the schema below. No prose, no markdown.`;

type SourceLanguage = 'pl' | 'en';

type SimpleSchemaConfig = {
  name: string;
  sourceLanguage: SourceLanguage;
  targetLanguage: 'ru';
};

const createSimpleSchema = ({ name, sourceLanguage, targetLanguage }: SimpleSchemaConfig) =>
  ({
    name,
    strict: true,
    schema: {
      type: 'object',
      properties: {
        raw_input: {
          type: 'string',
          description: 'Original user text exactly as entered, including brackets and context.',
        },
        source_word: {
          type: 'string',
          description:
            sourceLanguage === 'pl'
              ? 'Polish lemma stripped of brackets and bracketed hints.'
              : 'English lemma stripped of brackets and bracketed hints.',
        },
        source_language: {
          type: 'string',
          enum: [sourceLanguage],
          description: `Source language code (${sourceLanguage === 'pl' ? 'Polish' : 'English'}).`,
        },
        target_language: {
          type: 'string',
          enum: [targetLanguage],
          description: 'Target language code (Russian).',
        },
        senses: {
          type: 'array',
          description: 'List of sense entries with Russian translations.',
          items: {
            type: 'object',
            properties: {
              translation: {
                type: 'string',
                description: 'Russian translation for this sense.',
              },
              part_of_speech: {
                type: ['string', 'null'],
                description: `Part of speech label (e.g., noun, verb, adj) in ${sourceLanguage === 'pl' ? 'Polish' : 'English'} language.`,
              },
              sense_note: {
                type: ['string', 'null'],
                description: 'Short Russian gloss clarifying nuance.',
              },
              usage_frequency: {
                type: 'object',
                description: 'Optional frequency metadata describing sense prevalence.',
                properties: {
                  level: {
                    type: 'string',
                    enum: ['low', 'medium', 'high'],
                    description: 'Relative frequency bucket.',
                  },
                  comment: {
                    type: 'string',
                    description: 'Optional Russian remark elaborating on usage frequency.',
                  },
                },
                required: ['level', 'comment'],
                additionalProperties: false,
              },
              examples: {
                type: 'array',
                description: 'Example sentences with translations.',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  required: sourceLanguage === 'pl' ? ['pl', 'ru'] : ['en', 'ru'],
                  properties:
                    sourceLanguage === 'pl'
                      ? {
                          pl: { type: 'string', description: 'Sentence in Polish.' },
                          ru: {
                            type: 'string',
                            description: 'Russian translation of the sentence.',
                          },
                        }
                      : {
                          en: { type: 'string', description: 'Sentence in English.' },
                          ru: {
                            type: 'string',
                            description: 'Russian translation of the sentence.',
                          },
                        },
                },
              },
            },
            required: [
              'translation',
              'part_of_speech',
              'sense_note',
              'usage_frequency',
              'examples',
            ],
            additionalProperties: false,
          },
        },
      },
      required: ['raw_input', 'source_word', 'source_language', 'target_language', 'senses'],
      additionalProperties: false,
    },
  }) as const;

export const SIMPLE_SCHEMA_PL = createSimpleSchema({
  name: 'simple_translation_entry_pl',
  sourceLanguage: 'pl',
  targetLanguage: 'ru',
});

export const SIMPLE_SCHEMA_EN = createSimpleSchema({
  name: 'simple_translation_entry_en',
  sourceLanguage: 'en',
  targetLanguage: 'ru',
});

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

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const buildHeaders = (apiKey: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${apiKey}`,
});

const resolveApiKey = (): string | undefined => {
  return import.meta.env.VITE_OPENAI_API_KEY;
};

export const requestJsonCompletion = async (body: Record<string, unknown>): Promise<string> => {
  const apiKey = resolveApiKey();
  if (!apiKey) {
    throw new Error('Missing OpenAI API key');
  }

  const response = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: buildHeaders(apiKey),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => 'Unknown error');
    throw new Error(`OpenAI request failed: ${response.status} ${message}`);
  }

  const completion = (await response.json()) as OpenRouterResponse;
  const content = completion.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('OpenAI returned an empty response');
  }

  return content;
};

const fetchTranslations = async (
  rawInput: string,
  sourceLanguage: SourceLanguage,
  schema: ReturnType<typeof createSimpleSchema>,
): Promise<SimpleTranslationEntry> => {
  const content = await requestJsonCompletion({
    model: OPENAI_MODEL,
    temperature: 0.2,
    response_format: {
      type: 'json_schema',
      json_schema: schema,
    },
    messages: [
      { role: 'system', content: buildSystemPrompt(sourceLanguage) },
      { role: 'user', content: rawInput },
    ],
  });

  try {
    const parsedJson = JSON.parse(content);
    return translationEntrySchema.parse(parsedJson);
  } catch {
    throw new Error('Unable to parse OpenAI response');
  }
};

export const fetchPolishTranslations = (rawInput: string) =>
  fetchTranslations(rawInput, 'pl', SIMPLE_SCHEMA_PL);

export const fetchEnglishTranslations = (rawInput: string) =>
  fetchTranslations(rawInput, 'en', SIMPLE_SCHEMA_EN);
