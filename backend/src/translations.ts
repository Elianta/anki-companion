import { z } from "zod";

export type SourceLanguage = "pl" | "en";

const buildSystemPrompt = (sourceLanguage: SourceLanguage) =>
  `You are a bilingual lexicographer (${sourceLanguage === "pl" ? "Polish" : "English"} → Russian).

Input may include an extra hint in square brackets, e.g.:
${sourceLanguage === "pl" ? "- 'zamek [do drzwi]'\n- 'zamek [warownia]'" : "- 'castle [door hardware]'\n- 'castle [fortress]'"}
Treat EVERYTHING inside square brackets as contextual disambiguation ONLY.
Strip it from the lemma: source_word MUST be the clean ${
    sourceLanguage === "pl" ? "Polish" : "English"
  } lemma without any square brackets or their content.
Do NOT echo the square brackets text in translations; use it only to pick the correct sense.

Task:
Given one ${sourceLanguage === "pl" ? "Polish" : "English"} word or short phrase, produce Russian translations.
If multiple distinct senses exist, return multiple sense entries.
If input is not a valid word or phrase in ${sourceLanguage === "pl" ? "Polish" : "English"}, return an empty senses array.
Provide 1 example sentence in ${
    sourceLanguage === "pl" ? "Polish" : "English"
  } with Russian translation.
Output MUST be valid JSON ONLY, matching exactly the response schema. Do not output any fields that are not defined in the schema.`;

const buildEntrySchema = (sourceLanguage: SourceLanguage) =>
  z.strictObject({
    raw_input: z.string().meta({
      description:
        "Original user text exactly as entered, including brackets and context.",
    }),
    source_word: z.string().meta({
      description:
        sourceLanguage === "pl"
          ? "Polish lemma stripped of brackets and bracketed hints."
          : "English lemma stripped of brackets and bracketed hints.",
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
            .meta({ description: "Short Russian gloss clarifying nuance." }),
          usage_frequency_level: z
            .enum(["low", "medium", "high"])
            .meta({ description: "Relative frequency bucket." }),
          ...(sourceLanguage === "pl" && {
            example_pl: z
              .string()
              .meta({ description: "Example sentence in Polish." }),
          }),
          ...(sourceLanguage === "en" && {
            example_en: z
              .string()
              .meta({ description: "Example sentence in English." }),
          }),
          example_ru: z
            .string()
            .meta({ description: "Russian translation of the sentence." }),
        })
      )
      .default([])
      .meta({
        description: "List of sense entries with Russian translations.",
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
});

export type TranslationRequest = z.infer<typeof translationRequestSchema>;

export type TranslationPrompt = {
  systemPrompt: string;
  jsonSchema: ReturnType<typeof buildJsonSchema>;
};

export const buildTranslationPrompt = (
  rawInput: string,
  sourceLanguage: SourceLanguage
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
  content: string
): SimpleTranslationEntry => {
  const parsedJson = JSON.parse(content);
  return translationEntrySchema.parse(parsedJson);
};
