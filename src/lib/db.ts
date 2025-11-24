/* eslint-disable @typescript-eslint/no-explicit-any */
import Dexie, { type Table } from 'dexie';
import type { LangPair, Sense } from '@/lib/llm';

export type DraftNoteType = 'EN: Default' | 'PL: Default' | 'PL: Verb';

export type GeneratedCard = {
  noteType: DraftNoteType;
  fields: Record<string, any>;
  schemaName: string;
  generatedAt: string;
};

export type DraftEntry = {
  id?: number;
  term: string;
  language: LangPair;
  noteType: DraftNoteType;
  sense: Sense;
  card?: GeneratedCard | null;
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
