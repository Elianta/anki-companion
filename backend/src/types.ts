import type {
  ChatCompletion,
  ChatCompletionCreateParamsNonStreaming,
} from "openai/resources";

export type OpenAIClient = {
  chat: {
    completions: {
      create: (
        params: ChatCompletionCreateParamsNonStreaming
      ) => Promise<ChatCompletion>;
    };
  };
};
