import { db, type DraftEntry, type DraftNoteType } from '@/lib/db';
import type { LangPair, Sense } from '@/lib/llm';

const NOTE_TYPES_BY_LANGUAGE: Record<LangPair, DraftNoteType[]> = {
  EN: ['EN: Default'],
  PL: ['PL: Default', 'PL: Verb'],
};

export const getNoteTypesForLanguage = (language: LangPair): DraftNoteType[] => {
  return NOTE_TYPES_BY_LANGUAGE[language] ?? ['EN: Default'];
};

export const getDefaultNoteType = (language: LangPair): DraftNoteType => {
  const options = getNoteTypesForLanguage(language);
  return options[0];
};

type SaveDraftParams = {
  sense: Sense;
  term: string;
  language: LangPair;
};

export async function saveDraftFromSense({ sense, term, language }: SaveDraftParams) {
  const baseEntry: DraftEntry = {
    term,
    language,
    translation: sense.translationRU,
    senseNote: sense.notes,
    partOfSpeech: sense.partOfSpeech,
    senseId: sense.id,
    noteType: getDefaultNoteType(language),
  };

  const existing = await db.drafts
    .where('senseId')
    .equals(sense.id)
    .filter((entry) => entry.language === language)
    .first();

  if (existing?.id !== undefined) {
    return existing.id;
  }

  return db.drafts.add(baseEntry);
}

export async function fetchDrafts(): Promise<DraftEntry[]> {
  return db.drafts.orderBy('id').reverse().toArray();
}

export async function updateDraftNoteType(id: number, noteType: DraftNoteType) {
  await db.drafts.update(id, { noteType });
}

export async function removeDraft(id: number) {
  await db.drafts.delete(id);
}

export async function clearDrafts() {
  await db.drafts.clear();
}
