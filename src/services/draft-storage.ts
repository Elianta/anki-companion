import { db, type DraftEntry, type DraftNoteType } from '@/lib/db';
import type { LangPair, Sense } from '@/lib/llm';
import { generateCardPayload } from '@/services/card-generator';

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
    noteType: getDefaultNoteType(language),
    sense,
    card: null,
  };

  const existing = await db.drafts
    .where('senseId')
    .equals(sense.id)
    .filter((entry) => entry.language === language)
    .first();

  if (existing) {
    if (!existing.card) {
      await generateCardForDraft(existing.id!);
    }
    return existing.id;
  }

  const draftId = await db.drafts.add(baseEntry);
  await generateCardForDraft(draftId);
  return draftId;
}

export async function fetchDrafts(): Promise<DraftEntry[]> {
  return db.drafts.orderBy('id').reverse().toArray();
}

export async function updateDraftNoteType(id: number, noteType: DraftNoteType) {
  await db.drafts.update(id, { noteType, card: null });
}

export async function removeDraft(id: number) {
  await db.drafts.delete(id);
}

export async function clearDrafts() {
  await db.drafts.clear();
}

export async function generateCardForDraft(id: number) {
  const draft = await db.drafts.get(id);
  if (!draft) {
    return;
  }

  const card = await generateCardPayload({ draft });
  await db.drafts.update(id, { card });
  return { ...draft, card } as DraftEntry;
}
