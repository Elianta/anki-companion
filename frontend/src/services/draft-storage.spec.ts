import { describe, expect, it, vi } from 'vitest';

import { getDefaultNoteType, getNoteTypesForLanguage } from './draft-storage';

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

  it('notifies subscribers of draft count changes via subscribeDraftCount', async () => {
    const { db } = await import('@/lib/db');
    const { subscribeDraftCount, saveDraftFromSense, removeDraft } =
      await import('./draft-storage');
    await db.drafts.clear();

    const counts: number[] = [];
    const unsubscribe = subscribeDraftCount((count) => {
      counts.push(count);
    });

    // Wait for initial count
    await new Promise((resolve) => setTimeout(resolve, 50));

    const draftId = await saveDraftFromSense(
      {
        sense: { id: 'sense-apple', translationRU: 'яблоко' },
        term: 'apple',
        language: 'EN',
      },
      { backgroundGenerate: false },
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    await removeDraft(draftId);

    await new Promise((resolve) => setTimeout(resolve, 50));

    unsubscribe();

    expect(counts).toEqual([0, 1, 0]);
  });
});
