import { describe, expect, it } from 'vitest';

import { getDefaultNoteType, getNoteTypesForLanguage } from './draft-storage';

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
