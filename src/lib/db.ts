import Dexie, { type Table } from 'dexie';
import type { LangPair } from '@/lib/llm';

export type DraftNoteType = 'EN: Default' | 'PL: Default' | 'PL: Verb';

export type DraftEntry = {
  id?: number;
  term: string;
  language: LangPair;
  translation: string;
  senseNote?: string;
  partOfSpeech?: string;
  senseId: string;
  noteType: DraftNoteType;
};

class AppDatabase extends Dexie {
  drafts!: Table<DraftEntry, number>;

  constructor() {
    super('anki-companion');
    this.version(1).stores({
      drafts: '++id, senseId, term, language',
    });
  }
}

export const db = new AppDatabase();
