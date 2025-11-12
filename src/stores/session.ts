import { create } from "zustand"
import type { LangPair, Sense } from "@/lib/llm"

type SessionSnapshot = {
  term: string
  language: LangPair
  senses: Sense[]
}

export type SessionState = SessionSnapshot & {
  setLanguage: (language: LangPair) => void
  setTerm: (term: string) => void
  setSenses: (senses: Sense[]) => void
  reset: () => void
}

export const createSessionSnapshot = (): SessionSnapshot => ({
  term: "",
  language: "EN",
  senses: [],
})

export const useSessionStore = create<SessionState>((set) => ({
  ...createSessionSnapshot(),
  setLanguage: (language) => set({ language }),
  setTerm: (term) => set({ term }),
  setSenses: (senses) => set({ senses }),
  reset: () => set(createSessionSnapshot()),
}))
