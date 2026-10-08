import { beforeEach, describe, expect, it, vi } from 'vitest';

import { db, type DraftEntry } from '@/lib/db';
import { generateCardPayload } from '@/services/card-generator';
import { useDraftCountStore } from '@/stores/drafts';
import {
  clearDrafts,
  getDefaultNoteType,
  getNoteTypesForLanguage,
  removeDraft,
  saveDraftFromSense,
} from './draft-storage';

vi.mock('@/services/card-generator', () => ({
  generateCardPayload: vi.fn(async ({ draft }: { draft: DraftEntry }) => ({
    fields: { Word: 'test' },
    schemaName: 'mock',
    prompt: 'prompt',
    noteType: draft.noteType,
    generatedAt: '2024-01-01T00:00:00.000Z',
  })),
}));

describe('draft-storage note type helpers', () => {
  it('returns all supported Polish note types in stable order', () => {
    expect(getNoteTypesForLanguage('PL')).toEqual([
      'PL: Default',
      'PL: Verbs',
      'PL: Nouns',
      'PL: Verbs Inf',
    ]);
  });

  it('keeps PL default note type unchanged', () => {
    expect(getDefaultNoteType('PL')).toBe('PL: Default');
  });
});

describe('saving drafts with a selected note type', () => {
  const params = {
    sense: { id: 'polish-sense', translationRU: 'писать' },
    term: 'pisać',
    language: 'PL' as const,
  };

  beforeEach(async () => {
    await clearDrafts();
    vi.mocked(generateCardPayload).mockClear();
  });

  it('uses the default note type when none is selected', async () => {
    const draftId = await saveDraftFromSense(params);

    expect(await db.drafts.get(draftId)).toMatchObject({
      noteType: 'PL: Default',
      card: { noteType: 'PL: Default' },
    });
  });

  it('persists the selected type and uses it for card generation', async () => {
    const draftId = await saveDraftFromSense({ ...params, noteType: 'PL: Verbs Inf' });

    expect(await db.drafts.get(draftId)).toMatchObject({
      noteType: 'PL: Verbs Inf',
      card: { noteType: 'PL: Verbs Inf' },
    });
    expect(generateCardPayload).toHaveBeenCalledWith({
      draft: expect.objectContaining({ noteType: 'PL: Verbs Inf' }),
    });
  });

  it('reuses an existing draft with the same sense and note type', async () => {
    const draftId = await saveDraftFromSense({ ...params, noteType: 'PL: Verbs' });
    const repeatedId = await saveDraftFromSense({ ...params, noteType: 'PL: Verbs' });

    expect(repeatedId).toBe(draftId);
    expect(await db.drafts.count()).toBe(1);
    expect(useDraftCountStore.getState().count).toBe(1);
    expect(generateCardPayload).toHaveBeenCalledTimes(1);
  });

  it('saves the chosen type even when the sense already has a draft of another type', async () => {
    const defaultId = await saveDraftFromSense(params);
    const verbId = await saveDraftFromSense({ ...params, noteType: 'PL: Verbs' });

    expect(verbId).not.toBe(defaultId);
    expect(await db.drafts.get(defaultId)).toMatchObject({ noteType: 'PL: Default' });
    expect(await db.drafts.get(verbId)).toMatchObject({
      noteType: 'PL: Verbs',
      card: { noteType: 'PL: Verbs' },
    });
    expect(useDraftCountStore.getState().count).toBe(2);
  });

  it('rejects note types from another language before saving or generating', async () => {
    await expect(saveDraftFromSense({ ...params, noteType: 'EN: Default' })).rejects.toThrow(
      'Unsupported note type for PL',
    );

    expect(await db.drafts.count()).toBe(0);
    expect(generateCardPayload).not.toHaveBeenCalled();
    expect(useDraftCountStore.getState().count).toBe(0);
  });
});

describe('draft count store integration', () => {
  beforeEach(async () => {
    await clearDrafts();
    useDraftCountStore.getState().setCount(0);
  });

  it('initializes count correctly from existing database records', async () => {
    await db.drafts.add({
      term: 'apple',
      language: 'EN',
      noteType: 'EN: Default',
      sense: { id: 'apple-1', translationRU: 'яблоко' },
      exported: false,
    });
    await db.drafts.add({
      term: 'banana',
      language: 'EN',
      noteType: 'EN: Default',
      sense: { id: 'banana-1', translationRU: 'банан' },
      exported: true,
    });

    await useDraftCountStore.getState().initCount();

    expect(useDraftCountStore.getState().count).toBe(1);
  });

  it('optimistically increments and decrements count on save and remove', async () => {
    expect(useDraftCountStore.getState().count).toBe(0);

    const draftId = await saveDraftFromSense(
      {
        sense: { id: 'sense-apple', translationRU: 'яблоко' },
        term: 'apple',
        language: 'EN',
      },
      { backgroundGenerate: false },
    );

    expect(useDraftCountStore.getState().count).toBe(1);

    await removeDraft(draftId);

    expect(useDraftCountStore.getState().count).toBe(0);
  });

  it('correctly tracks multiple sequential draft additions', async () => {
    expect(useDraftCountStore.getState().count).toBe(0);

    await saveDraftFromSense(
      {
        sense: { id: 'sense-1', translationRU: 'первый' },
        term: 'first',
        language: 'EN',
      },
      { backgroundGenerate: false },
    );
    expect(useDraftCountStore.getState().count).toBe(1);

    await saveDraftFromSense(
      {
        sense: { id: 'sense-2', translationRU: 'второй' },
        term: 'second',
        language: 'EN',
      },
      { backgroundGenerate: false },
    );
    expect(useDraftCountStore.getState().count).toBe(2);
  });

  it('tracks multiple draft additions with backgroundGenerate: true', async () => {
    expect(useDraftCountStore.getState().count).toBe(0);

    await saveDraftFromSense(
      {
        sense: { id: 'sense-1', translationRU: 'первый' },
        term: 'first',
        language: 'EN',
      },
      { backgroundGenerate: true },
    );
    expect(useDraftCountStore.getState().count).toBe(1);

    await saveDraftFromSense(
      {
        sense: { id: 'sense-2', translationRU: 'второй' },
        term: 'second',
        language: 'EN',
      },
      { backgroundGenerate: true },
    );
    expect(useDraftCountStore.getState().count).toBe(2);
  });
});
