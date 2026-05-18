import { z } from "zod";
import { LLM_MODELS, LLM_PROVIDERS } from "./types.js";

export type SourceLanguage = "pl" | "en";

const buildSystemPrompt = (sourceLanguage: SourceLanguage) =>
  `You are a bilingual lexicographer (${sourceLanguage === "pl" ? "Polish" : "English"} → Russian).

Task:
Given one ${sourceLanguage === "pl" ? "Polish" : "English"} word or short phrase, produce Russian translations.
Input may include a hint in square brackets, e.g., 'zamek [do drzwi]' or 'castle [door hardware]'. Treat text in square brackets as context, but never include them in output fields.
If multiple distinct senses exist, return a maximum of 2 most relevant senses.
If input is not a valid word or phrase in ${sourceLanguage === "pl" ? "Polish" : "English"}, return an empty senses array.

Rules for fields (see schema for full details):
- source_word: Remove square brackets and their content.
- sense_note: A concise dictionary gloss in ${sourceLanguage === "pl" ? "Polish" : "English"}. For inflected/derived forms, briefly identify the relation to the base form (e.g., "past tense of X; X: definition of X").
- Example sentence: Must use the exact user-provided surface form. Express bracketed context naturally without brackets in the sentences.

Output MUST be valid JSON, strictly matching the provided schema.`;

const buildEntrySchema = (sourceLanguage: SourceLanguage) =>
  z.strictObject({
    raw_input: z.string().meta({
      description: "Original user text, including brackets and context.",
    }),
    source_word: z.string().meta({
      description: `${sourceLanguage === "pl" ? "Polish" : "English"} lemma, stripped of any bracketed context.`,
    }),
    source_language: z.enum([sourceLanguage]),
    target_language: z.enum(["ru"]),
    senses: z
      .array(
        z.strictObject({
          translation: z
            .string()
            .meta({ description: "Russian translation for this sense." }),
          part_of_speech: z
            .string()
            .nullable()
            .meta({
              description: `Part of speech label (e.g., noun, verb, adj) in ${
                sourceLanguage === "pl" ? "Polish" : "English"
              }.`,
            }),
          sense_note: z
            .string()
            .nullable()
            .meta({
              description: `Concise ${
                sourceLanguage === "pl" ? "Polish" : "English"
              } dictionary gloss. For inflected forms, explain relation to base form, then define the base form.`,
            }),
          usage_frequency_level: z
            .enum(["low", "medium", "high"])
            .meta({ description: "Relative frequency (low, medium, high)." }),
          ...(sourceLanguage === "pl" && {
            example_pl: z.string().meta({
              description: "Example sentence in Polish.",
            }),
          }),
          ...(sourceLanguage === "en" && {
            example_en: z.string().meta({
              description: "Example sentence in English.",
            }),
          }),
          example_ru: z.string().meta({
            description: "Natural Russian translation of the example sentence.",
          }),
        }),
      )
      .default([])
      .meta({
        description:
          "List of up to 2 most relevant sense entries with translations.",
      }),
  });

export const translationEntrySchema = z.union([
  buildEntrySchema("pl"),
  buildEntrySchema("en"),
]);

export type SimpleTranslationEntry = z.infer<typeof translationEntrySchema>;

const buildJsonSchema = (sourceLanguage: SourceLanguage) => ({
  name:
    sourceLanguage === "pl"
      ? "simple_translation_entry_pl"
      : "simple_translation_entry_en",
  strict: true,
  schema: z.toJSONSchema(buildEntrySchema(sourceLanguage)),
});

export const SIMPLE_SCHEMA_PL = buildJsonSchema("pl");
export const SIMPLE_SCHEMA_EN = buildJsonSchema("en");

export const translationRequestSchema = z.object({
  rawInput: z.string().trim().min(1, "rawInput is required"),
  sourceLanguage: z.enum(["pl", "en"]),
  llmProvider: z.enum(LLM_PROVIDERS).optional(),
  llmModel: z.enum(LLM_MODELS).optional(),
});

export const translationPayloadSchema = translationRequestSchema.pick({
  rawInput: true,
  sourceLanguage: true,
});

export type TranslationRequest = z.infer<typeof translationPayloadSchema>;

export type TranslationPrompt = {
  systemPrompt: string;
  jsonSchema: ReturnType<typeof buildJsonSchema>;
};

export const buildTranslationPrompt = (
  rawInput: string,
  sourceLanguage: SourceLanguage,
): TranslationPrompt & { userPrompt: string } => {
  const jsonSchema =
    sourceLanguage === "pl" ? SIMPLE_SCHEMA_PL : SIMPLE_SCHEMA_EN;

  return {
    systemPrompt: buildSystemPrompt(sourceLanguage),
    userPrompt: rawInput,
    jsonSchema,
  };
};

export const parseTranslationResponse = (
  content: string,
): SimpleTranslationEntry => {
  const parsedJson = JSON.parse(content);
  return translationEntrySchema.parse(parsedJson);
};
