import { beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/lib/db';
import { useDraftCountStore } from '@/stores/drafts';
import {
  clearDrafts,
  getDefaultNoteType,
  getNoteTypesForLanguage,
  removeDraft,
  saveDraftFromSense,
} from './draft-storage';

vi.mock('@/services/card-generator', () => ({
  generateCardPayload: vi.fn(async () => ({
    fields: { Word: 'test' },
    schemaName: 'mock',
    prompt: 'prompt',
    noteType: 'EN: Default',
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
