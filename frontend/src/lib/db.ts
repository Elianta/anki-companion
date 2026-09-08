/* eslint-disable @typescript-eslint/no-explicit-any */
import Dexie, { type Table } from 'dexie';
import type { LangPair, Sense } from '@/lib/llm';

export type DraftNoteType =
  | 'EN: Default'
  | 'PL: Default'
  | 'PL: Verbs'
  | 'PL: Nouns'
  | 'PL: Verbs Inf';

export type GeneratedCard = {
  noteType: DraftNoteType;
  fields: Record<string, any>;
  schemaName: string;
  generatedAt: string;
};

export type DraftEntry = {
  id?: number;
  senseId?: string;
  term: string;
  language: LangPair;
  noteType: DraftNoteType;
  sense: Sense;
  card?: GeneratedCard | null;
  exported?: boolean;
  exportedAt?: string | null;
};

export type ExportedFile = {
  id?: number;
  noteType: DraftNoteType;
  fileName: string;
  createdAt: string;
  content: string;
};

export type ExportGroup = {
  id?: number;
  createdAt: string;
  draftIds: number[];
  words: string[];
  files: ExportedFile[];
};

class AppDatabase extends Dexie {
  drafts!: Table<DraftEntry, number>;
  exportGroups!: Table<ExportGroup, number>;

  constructor() {
    super('anki-companion');
    this.version(1).stores({
      drafts: '++id, senseId, term, language',
    });
    this.version(2)
      .stores({
        drafts: '++id, senseId, term, language, exported',
        exportGroups: '++id, createdAt',
      })
      .upgrade((tx) => {
        return tx
          .table('drafts')
          .toCollection()
          .modify((draft: DraftEntry) => {
            draft.exported = draft.exported ?? false;
            draft.exportedAt = draft.exportedAt ?? null;
          });
      });
    this.version(3)
      .stores({
        drafts: '++id, senseId, term, language, exported',
        exportGroups: '++id, createdAt',
      })
      .upgrade((tx) => {
        return tx
          .table('exportGroups')
          .toCollection()
          .modify((group: ExportGroup) => {
            group.words = group.words ?? [];
          });
      });
    this.version(4)
      .stores({
        drafts: '++id, senseId, term, language, exported',
        exportGroups: '++id, createdAt',
      })
      .upgrade((tx) => {
        tx.table('drafts')
          .toCollection()
          .modify((draft: DraftEntry) => {
            if (draft.noteType === ('PL: Verb' as any)) {
              draft.noteType = 'PL: Verbs';
            }
            if (draft.card && draft.card.noteType === ('PL: Verb' as any)) {
              draft.card.noteType = 'PL: Verbs';
            }
          });

        tx.table('exportGroups')
          .toCollection()
          .modify((group: ExportGroup) => {
            if (group.files) {
              group.files.forEach((file) => {
                if (file.noteType === ('PL: Verb' as any)) {
                  file.noteType = 'PL: Verbs';
                }
              });
            }
          });
      });
  }
}

export const db = new AppDatabase();
