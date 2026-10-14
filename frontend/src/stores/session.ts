import { create } from 'zustand';
import type { LangPair } from '@/lib/llm';

export type SessionState = {
  language: LangPair;
  setLanguage: (language: LangPair) => void;
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

export const useSessionStore = create<SessionState>((set) => ({
  language: readLanguage(),
  setLanguage: (language) => {
    writeLanguage(language);
    set({ language });
  },
}));
