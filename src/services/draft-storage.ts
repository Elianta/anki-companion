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
    exported: false,
    exportedAt: null,
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
  const drafts = await db.drafts.orderBy('id').reverse().toArray();
  return drafts.map((draft) => ({
    ...draft,
    exported: draft.exported ?? false,
    exportedAt: draft.exportedAt ?? null,
  }));
}

export async function updateDraftNoteType(id: number, noteType: DraftNoteType) {
  await db.drafts.update(id, { noteType, card: null, exported: false, exportedAt: null });
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
  await db.drafts.update(id, { card, exported: false, exportedAt: null });
  return { ...draft, card, exported: false, exportedAt: null } as DraftEntry;
}

export async function updateDraftCardFields(id: number, fields: Record<string, unknown>) {
  const draft = await db.drafts.get(id);
  if (!draft || !draft.card) {
    throw new Error('Card not found for this draft');
  }

  const updatedCard = { ...draft.card, fields, generatedAt: new Date().toISOString() };
  await db.drafts.update(id, { card: updatedCard, exported: false, exportedAt: null });
  return { ...draft, card: updatedCard, exported: false, exportedAt: null } as DraftEntry;
}

export async function returnDraftToQueue(id: number) {
  await db.drafts.update(id, { exported: false, exportedAt: null });
}
