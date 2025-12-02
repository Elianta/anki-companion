import { OpenAI } from "openai";
import { LLMClient } from "../types.js";
import { getModelConfigFromEnv } from "./config.js";
import { OpenAILLMClient } from "./openai-adapter.js";

export function createLLMClientFromEnv(): LLMClient | undefined {
  let config: ReturnType<typeof getModelConfigFromEnv>;

  try {
    config = getModelConfigFromEnv();
  } catch (error) {
    console.warn((error as Error).message);
    return undefined;
  }

  if (config.provider === "openai") {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.warn("Missing OPENAI_API_KEY; set it before making requests.");
      return undefined;
    }

    const openai = new OpenAI({ apiKey: openaiApiKey });
    return new OpenAILLMClient({
      client: openai,
      model: config.model,
    });
  }
}
