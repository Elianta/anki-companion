import { OpenAI } from "openai";
import { z } from "zod";
import { OpenAIClient } from "./types.js";

export type SourceLanguage = "pl" | "en";

export const OPENAI_MODEL = "gpt-4.1-mini";

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

const usageFrequencySchema = z
  .strictObject({
    level: z
      .enum(["low", "medium", "high"])
      .meta({ description: "Relative frequency bucket." }),
    comment: z.string().optional().meta({
      description: "Optional Russian remark elaborating on usage frequency.",
    }),
  })
  .nullable()
  .meta({
    description: "Optional frequency metadata describing sense prevalence.",
  });

const exampleSchemaPl = z.strictObject({
  pl: z.string().meta({ description: "Sentence in Polish." }),
  ru: z.string().meta({ description: "Russian translation of the sentence." }),
});

const exampleSchemaEn = z.strictObject({
  en: z.string().meta({ description: "Sentence in English." }),
  ru: z.string().meta({ description: "Russian translation of the sentence." }),
});

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
    source_language: z.literal(sourceLanguage).meta({
      description: `Source language code (${sourceLanguage === "pl" ? "Polish" : "English"}).`,
    }),
    target_language: z
      .literal("ru")
      .meta({ description: "Target language code (Russian)." }),
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
          usage_frequency: usageFrequencySchema,
          examples: z
            .array(sourceLanguage === "pl" ? exampleSchemaPl : exampleSchemaEn)
            .meta({ description: "Example sentences with translations." }),
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
