import type { GenerateContentResponse } from "@google/genai";
import {
  buildCardPrompt,
  parseGeneratedCard,
  type DraftEntry,
  type GeneratedCard,
} from "../cards.js";
import {
  buildTranslationPrompt,
  parseTranslationResponse,
  type SimpleTranslationEntry,
  type TranslationRequest,
} from "../translations.js";
import { GeminiClient, LLMClient } from "../types.js";

const DEFAULT_TEMPERATURE = 0.2;

const ensureContent = (result: GenerateContentResponse) => {
  const content = result.text?.trim();
  if (!content) {
    throw new Error("Gemini returned an empty response");
  }
  return content;
};

const parseGeminiTranslation = (content: string) => {
  try {
    return parseTranslationResponse(content);
  } catch {
    throw new Error("Unable to parse Gemini response");
  }
};

const parseGeminiCard = (draft: DraftEntry, content: string) => {
  try {
    return parseGeneratedCard(draft, content);
  } catch {
    throw new Error("Unable to parse Gemini response");
  }
};

type GeminiAdapterOptions = {
  client: GeminiClient;
  model: string;
  temperature?: number;
};

export class GeminiLLMClient implements LLMClient {
  private readonly client: GeminiClient;
  private readonly model: string;
  private readonly temperature: number;

  constructor(options: GeminiAdapterOptions) {
    this.client = options.client;
    this.model = options.model;
    this.temperature = options.temperature ?? DEFAULT_TEMPERATURE;
  }

  async translate({
    rawInput,
    sourceLanguage,
  }: TranslationRequest): Promise<SimpleTranslationEntry> {
    const { systemPrompt, userPrompt, jsonSchema } = buildTranslationPrompt(
      rawInput,
      sourceLanguage
    );

    const result = await this.client.models.generateContent({
      model: this.model,
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      config: {
        temperature: this.temperature,
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: "application/json",
        systemInstruction: { role: "system", parts: [{ text: systemPrompt }] },
        responseJsonSchema: jsonSchema.schema,
      },
    });

    const content = ensureContent(result);
    return parseGeminiTranslation(content);
  }

  async generateCard(draft: DraftEntry): Promise<GeneratedCard> {
    const { systemPrompt, userPrompt, schemaDefinition } =
      buildCardPrompt(draft);

    const result = await this.client.models.generateContent({
      model: this.model,
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      config: {
        temperature: this.temperature,
        responseMimeType: "application/json",
        systemInstruction: { role: "system", parts: [{ text: systemPrompt }] },
        responseJsonSchema: schemaDefinition.jsonSchema,
      },
    });

    const content = ensureContent(result);
    return parseGeminiCard(draft, content);
  }
}
