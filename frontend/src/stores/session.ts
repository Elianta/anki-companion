import { create } from 'zustand';
import type { LangPair, Sense } from '@/lib/llm';

type SessionSnapshot = {
  term: string;
  language: LangPair;
  senses: Sense[];
};

export type SessionState = SessionSnapshot & {
  setLanguage: (language: LangPair) => void;
  setTerm: (term: string) => void;
  setSenses: (senses: Sense[]) => void;
  reset: () => void;
};

const DEFAULT_LANGUAGE: LangPair = 'EN';
const STORAGE_KEY = 'anki-session-language';

const readLanguage = (): LangPair => {
  if (typeof localStorage === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'EN' || raw === 'PL') {
      return raw;
    }
  } catch {
    // ignore storage errors and fall back to defaults
  }

  return DEFAULT_LANGUAGE;
};

const writeLanguage = (language: LangPair) => {
  if (typeof localStorage === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // ignore storage errors
  }
};

export const createSessionSnapshot = (): SessionSnapshot => ({
  term: '',
  language: readLanguage(),
  senses: [],
});

export const useSessionStore = create<SessionState>((set) => ({
  ...createSessionSnapshot(),
  setLanguage: (language) => {
    writeLanguage(language);
    set({ language });
  },
  setTerm: (term) => set({ term }),
  setSenses: (senses) => set({ senses }),
  reset: () => set(createSessionSnapshot()),
}));
