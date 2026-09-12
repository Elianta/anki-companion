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
import { LLMClient, OpenAIClient } from "../types.js";

const DEFAULT_TEMPERATURE = 0.2;

const parseOpenAIContent = (content: string) => {
  try {
    return parseTranslationResponse(content);
  } catch {
    throw new Error("Unable to parse OpenAI response");
  }
};

const parseCardContent = (draft: DraftEntry, content: string) => {
  try {
    return parseGeneratedCard(draft, content);
  } catch {
    throw new Error("Unable to parse OpenAI response");
  }
};

const ensureContent = (completion: {
  choices?: { message?: { content?: string | null } }[];
}) => {
  const content = completion.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("OpenAI returned an empty response");
  }
  return content;
};

const getDefaultTemperature = (model: string): number =>
  model.startsWith("o1") || model.startsWith("o3") || model.startsWith("gpt-5")
    ? 1
    : DEFAULT_TEMPERATURE;

type OpenAIAdapterOptions = {
  client: OpenAIClient;
  model: string;
  temperature?: number;
};

export class OpenAILLMClient implements LLMClient {
  private readonly client: OpenAIClient;
  private readonly model: string;
  private readonly temperature: number;

  constructor(options: OpenAIAdapterOptions) {
    this.client = options.client;
    this.model = options.model;
    this.temperature =
      options.temperature ?? getDefaultTemperature(options.model);
  }

  async translate({
    rawInput,
    sourceLanguage,
  }: TranslationRequest): Promise<SimpleTranslationEntry> {
    const { jsonSchema, systemPrompt, userPrompt } = buildTranslationPrompt(
      rawInput,
      sourceLanguage,
    );

    const completion = await this.client.chat.completions.create({
      model: this.model,
      temperature: this.temperature,
      response_format: {
        type: "json_schema",
        json_schema: jsonSchema,
      },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = ensureContent(completion);
    return parseOpenAIContent(content);
  }

  async generateCard(draft: DraftEntry): Promise<GeneratedCard> {
    const { schemaDefinition, systemPrompt, userPrompt } =
      buildCardPrompt(draft);

    const completion = await this.client.chat.completions.create({
      model: this.model,
      temperature: this.temperature,
      response_format: {
        type: "json_schema",
        json_schema: schemaDefinition.jsonSchema,
      },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = ensureContent(completion);
    return parseCardContent(draft, content);
  }
}
