import type OpenAI from "openai";
import { z } from "zod";

export type SourceLanguage = "pl" | "en";

export const OPENAI_MODEL = "gpt-4.1-mini";

type SimpleSchemaConfig = {
  name: string;
  sourceLanguage: SourceLanguage;
  targetLanguage: "ru";
};

const buildSystemPrompt = (sourceLanguage: SourceLanguage) =>
  `You are a bilingual lexicographer (${sourceLanguage === "pl" ? "Polish" : "English"} → Russian).

Input may include an extra hint in square brackets, e.g.:
  - 'zamek [do drzwi]'
  - 'zamek [warownia]'
Treat EVERYTHING inside square brackets as contextual disambiguation ONLY.
Strip it from the lemma: source_word MUST be the clean ${
    sourceLanguage === "pl" ? "Polish" : "English"
  } lemma without any square brackets or their content.
Do NOT echo the square brackets text in translations; use it only to pick the correct sense.

Task:
Given one ${sourceLanguage === "pl" ? "Polish" : "English"} word or short phrase, produce Russian translations.
If multiple distinct senses exist, return multiple sense entries.
If input is not a valid word or phrase in ${sourceLanguage === "pl" ? "Polish" : "English"}, return an empty senses array.
Provide 2 example sentences in ${
    sourceLanguage === "pl" ? "Polish" : "English"
  } with Russian translations.
Output MUST be valid JSON ONLY, matching exactly the schema below. No prose, no markdown.`;

const createSimpleSchema = ({
  name,
  sourceLanguage,
  targetLanguage,
}: SimpleSchemaConfig) =>
  ({
    name,
    strict: true,
    schema: {
      type: "object",
      properties: {
        raw_input: {
          type: "string",
          description:
            "Original user text exactly as entered, including brackets and context.",
        },
        source_word: {
          type: "string",
          description:
            sourceLanguage === "pl"
              ? "Polish lemma stripped of brackets and bracketed hints."
              : "English lemma stripped of brackets and bracketed hints.",
        },
        source_language: {
          type: "string",
          enum: [sourceLanguage],
          description: `Source language code (${sourceLanguage === "pl" ? "Polish" : "English"}).`,
        },
        target_language: {
          type: "string",
          enum: [targetLanguage],
          description: "Target language code (Russian).",
        },
        senses: {
          type: "array",
          description: "List of sense entries with Russian translations.",
          items: {
            type: "object",
            properties: {
              translation: {
                type: "string",
                description: "Russian translation for this sense.",
              },
              part_of_speech: {
                type: ["string", "null"],
                description: `Part of speech label (e.g., noun, verb, adj) in ${
                  sourceLanguage === "pl" ? "Polish" : "English"
                } language.`,
              },
              sense_note: {
                type: ["string", "null"],
                description: "Short Russian gloss clarifying nuance.",
              },
              usage_frequency: {
                type: "object",
                description:
                  "Optional frequency metadata describing sense prevalence.",
                properties: {
                  level: {
                    type: "string",
                    enum: ["low", "medium", "high"],
                    description: "Relative frequency bucket.",
                  },
                  comment: {
                    type: "string",
                    description:
                      "Optional Russian remark elaborating on usage frequency.",
                  },
                },
                required: ["level", "comment"],
                additionalProperties: false,
              },
              examples: {
                type: "array",
                description: "Example sentences with translations.",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required:
                    sourceLanguage === "pl" ? ["pl", "ru"] : ["en", "ru"],
                  properties:
                    sourceLanguage === "pl"
                      ? {
                          pl: {
                            type: "string",
                            description: "Sentence in Polish.",
                          },
                          ru: {
                            type: "string",
                            description: "Russian translation of the sentence.",
                          },
                        }
                      : {
                          en: {
                            type: "string",
                            description: "Sentence in English.",
                          },
                          ru: {
                            type: "string",
                            description: "Russian translation of the sentence.",
                          },
                        },
                },
              },
            },
            required: [
              "translation",
              "part_of_speech",
              "sense_note",
              "usage_frequency",
              "examples",
            ],
            additionalProperties: false,
          },
        },
      },
      required: [
        "raw_input",
        "source_word",
        "source_language",
        "target_language",
        "senses",
      ],
      additionalProperties: false,
    },
  }) as const;

export const SIMPLE_SCHEMA_PL = createSimpleSchema({
  name: "simple_translation_entry_pl",
  sourceLanguage: "pl",
  targetLanguage: "ru",
});

export const SIMPLE_SCHEMA_EN = createSimpleSchema({
  name: "simple_translation_entry_en",
  sourceLanguage: "en",
  targetLanguage: "ru",
});

export const translationEntrySchema = z.object({
  raw_input: z.string(),
  source_word: z.string(),
  source_language: z.union([z.literal("pl"), z.literal("en")]),
  target_language: z.literal("ru"),
  senses: z
    .array(
      z.object({
        translation: z.string(),
        part_of_speech: z.string().nullable(),
        sense_note: z.string().nullable(),
        usage_frequency: z
          .object({
            level: z.enum(["low", "medium", "high"]),
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
          ])
        ),
      })
    )
    .default([]),
});

export type SimpleTranslationEntry = z.infer<typeof translationEntrySchema>;

type OpenAIClient = Pick<OpenAI, "chat">;

const buildRequestBody = (
  rawInput: string,
  sourceLanguage: SourceLanguage
): OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming => {
  const schema = sourceLanguage === "pl" ? SIMPLE_SCHEMA_PL : SIMPLE_SCHEMA_EN;

  return {
    model: OPENAI_MODEL,
    temperature: 0.2,
    response_format: {
      type: "json_schema",
      json_schema: schema,
    },
    messages: [
      { role: "system", content: buildSystemPrompt(sourceLanguage) },
      { role: "user", content: rawInput },
    ],
  };
};

export const translationRequestSchema = z.object({
  rawInput: z.string().trim().min(1, "rawInput is required"),
  sourceLanguage: z.enum(["pl", "en"]),
});

export type TranslationRequest = z.infer<typeof translationRequestSchema>;

export async function requestTranslationFromOpenAI(
  openaiClient: OpenAIClient,
  rawInput: string,
  sourceLanguage: SourceLanguage
): Promise<SimpleTranslationEntry> {
  const payload = buildRequestBody(rawInput, sourceLanguage);
  const completion = await openaiClient.chat.completions.create(payload);

  const content = completion.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("OpenAI returned an empty response");
  }

  try {
    const parsedJson = JSON.parse(content);
    return translationEntrySchema.parse(parsedJson);
  } catch {
    throw new Error("Unable to parse OpenAI response");
  }
}
