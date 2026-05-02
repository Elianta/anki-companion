import { GoogleGenAI } from "@google/genai";
import { OpenAI } from "openai";
import { LLMClient, LLMModel, LLMProvider } from "../types.js";
import { GeminiLLMClient } from "./gemini-adapter.js";
import { OpenAILLMClient } from "./openai-adapter.js";

const clientCache = new Map<string, LLMClient>();
const DEFAULT_PROVIDER: LLMProvider = "googleai";
const DEFAULT_MODEL: LLMModel = "gemini-3.1-flash-lite-preview";
const SUPPORTED_PROVIDERS: readonly LLMProvider[] = [
  "openai",
  "googleai",
] as const;

function buildCacheKey(provider: LLMProvider, model: string) {
  return `${provider}:${model}`;
}

function createOpenAIClient(model: string): LLMClient | undefined {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    console.warn("Missing OPENAI_API_KEY; set it before making requests.");
    return;
  }

  const cacheKey = buildCacheKey("openai", model);
  const cached = clientCache.get(cacheKey);
  if (cached) return cached;

  const openai = new OpenAI({ apiKey: openaiApiKey });
  const client = new OpenAILLMClient({ client: openai, model });
  clientCache.set(cacheKey, client);
  return client;
}

function createGeminiClient(model: string): LLMClient | undefined {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    console.warn("Missing GEMINI_API_KEY; set it before making requests.");
    return undefined;
  }

  const cacheKey = buildCacheKey("googleai", model);
  const cached = clientCache.get(cacheKey);
  if (cached) return cached;

  const googleai = new GoogleGenAI({ apiKey: geminiApiKey });
  const client = new GeminiLLMClient({ client: googleai, model });
  clientCache.set(cacheKey, client);
  return client;
}

export function createLLMClientFromEnv(
  overrides?: Partial<{ provider: LLMProvider; model: string }>
): LLMClient {
  const requestedProvider = overrides?.provider;
  const provider = SUPPORTED_PROVIDERS.includes(
    requestedProvider as LLMProvider
  )
    ? requestedProvider!
    : DEFAULT_PROVIDER;

  if (requestedProvider && provider !== requestedProvider) {
    console.warn(
      `Unsupported LLM provider "${requestedProvider}". Falling back to default "${DEFAULT_PROVIDER}".`
    );
  }

  const model = overrides?.model ?? DEFAULT_MODEL;

  if (provider === "openai") {
    return (
      createOpenAIClient(model) ??
      createGeminiClient(DEFAULT_MODEL) ??
      (() => {
        throw new Error("No LLM clients available (missing API keys).");
      })()
    );
  }

  return (
    createGeminiClient(model) ??
    createOpenAIClient(DEFAULT_MODEL) ??
    (() => {
      throw new Error("No LLM clients available (missing API keys).");
    })()
  );
}
