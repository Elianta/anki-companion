import type { LLMProvider } from '@/stores/llm';

import { GeminiIcon, OpenAIIcon } from '@/components/icons/LLMProviderIcons';

export const getProviderLabel = (provider: LLMProvider) =>
  provider === 'openai' ? 'GPT' : 'Gemini';

export const getProviderIcon = (provider: LLMProvider) =>
  provider === 'openai' ? OpenAIIcon : GeminiIcon;
