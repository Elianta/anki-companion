import { create } from 'zustand';

export type LLMProvider = 'openai' | 'googleai';
export type LLMModel = 'gpt-4.1-mini' | 'gemini-2.5-flash';

type LLMState = {
  llmProvider: LLMProvider;
  llmModel: LLMModel;
  setLLMConfig: (provider: LLMProvider, model: LLMModel) => void;
  reset: () => void;
};

export const DEFAULT_LLM_PROVIDER: LLMProvider = 'googleai';
export const DEFAULT_LLM_MODEL: LLMModel = 'gemini-2.5-flash';

const defaultState = {
  llmProvider: DEFAULT_LLM_PROVIDER,
  llmModel: DEFAULT_LLM_MODEL,
};

export const useLLMStore = create<LLMState>((set) => ({
  ...defaultState,
  setLLMConfig: (provider, model) => set({ llmProvider: provider, llmModel: model }),
  reset: () => set(defaultState),
}));

export const getLLMSelection = () => {
  const { llmProvider, llmModel } = useLLMStore.getState();
  return { llmProvider, llmModel };
};
