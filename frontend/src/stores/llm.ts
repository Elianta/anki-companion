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

const STORAGE_KEY = 'anki-llm-selection';

const readSelection = (): Pick<LLMState, 'llmProvider' | 'llmModel'> => {
  if (typeof localStorage === 'undefined') {
    return { llmProvider: DEFAULT_LLM_PROVIDER, llmModel: DEFAULT_LLM_MODEL };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { llmProvider: DEFAULT_LLM_PROVIDER, llmModel: DEFAULT_LLM_MODEL };
    }
    const parsed = JSON.parse(raw) as Partial<LLMState>;
    if (parsed.llmProvider && parsed.llmModel) {
      return {
        llmProvider: parsed.llmProvider as LLMProvider,
        llmModel: parsed.llmModel as LLMModel,
      };
    }
  } catch {
    // ignore parse errors and fall back to defaults
  }
  return { llmProvider: DEFAULT_LLM_PROVIDER, llmModel: DEFAULT_LLM_MODEL };
};

const writeSelection = (selection: Pick<LLMState, 'llmProvider' | 'llmModel'>) => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
  } catch {
    // ignore storage errors
  }
};

export const useLLMStore = create<LLMState>((set) => ({
  ...readSelection(),
  setLLMConfig: (provider, model) => {
    writeSelection({ llmProvider: provider, llmModel: model });
    set({ llmProvider: provider, llmModel: model });
  },
  reset: () => set({ ...readSelection() }),
}));

export const getLLMSelection = () => {
  const { llmProvider, llmModel } = useLLMStore.getState();
  return { llmProvider, llmModel };
};
