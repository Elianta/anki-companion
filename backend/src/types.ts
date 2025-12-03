import type {
  ChatCompletion,
  ChatCompletionCreateParamsNonStreaming,
} from "openai/resources";
import type { DraftEntry, GeneratedCard } from "./cards.js";
import type {
  SimpleTranslationEntry,
  TranslationRequest,
} from "./translations.js";
import type {
  GenerateContentParameters,
  GenerateContentResponse,
} from "@google/genai";

export type LLMProvider = "openai" | "googleai";

export type LLMModelConfig = {
  provider: LLMProvider;
  model: string;
};

export type LLMClient = {
  translate: (request: TranslationRequest) => Promise<SimpleTranslationEntry>;
  generateCard: (draft: DraftEntry) => Promise<GeneratedCard>;
};

export type OpenAIClient = {
  chat: {
    completions: {
      create: (
        params: ChatCompletionCreateParamsNonStreaming
      ) => Promise<ChatCompletion>;
    };
  };
};

export type GeminiClient = {
  models: {
    generateContent: (
      params: GenerateContentParameters
    ) => Promise<GenerateContentResponse>;
  };
};
