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

export const LLM_PROVIDERS = ["googleai", "openai"] as const;
export type LLMProvider = (typeof LLM_PROVIDERS)[number];

export const LLM_MODELS = [
  "gpt-4.1-mini",
  "gemini-3.1-flash-lite-preview",
] as const;
export type LLMModel = (typeof LLM_MODELS)[number];

export type LLMModelConfig = {
  provider: LLMProvider;
  model: LLMModel;
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
