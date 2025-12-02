import { LLMModelConfig, LLMProvider } from "../types.js";

export const SUPPORTED_PROVIDERS: readonly LLMProvider[] = ["openai"] as const;

export const DEFAULT_MODELS: Record<LLMProvider, string> = {
  openai: "gpt-4.1-mini",
};

export function getModelConfigFromEnv(): LLMModelConfig {
  const rawProvider = (process.env.LLM_PROVIDER ?? "openai").toLowerCase();
  const provider = SUPPORTED_PROVIDERS.find(
    (candidate) => candidate === rawProvider
  );

  if (!provider) {
    throw new Error(
      `Unsupported LLM_PROVIDER "${rawProvider}". Expected one of: ${SUPPORTED_PROVIDERS.join(
        ", "
      )}`
    );
  }

  const model = process.env.LLM_MODEL || DEFAULT_MODELS[provider];

  return { provider, model };
}
