import type {
  ChatCompletion,
  ChatCompletionCreateParamsNonStreaming,
} from "openai/resources";
import type { DraftEntry, GeneratedCard } from "./cards.js";
import type {
  SimpleTranslationEntry,
  TranslationRequest,
} from "./translations.js";

export type LLMProvider = "openai";

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
