import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ExportScreen } from './ExportScreen';
import type { DraftEntry } from '@/lib/db';
import type { Sense } from '@/lib/llm';
import { clearDrafts, saveDraftFromSense } from '@/services/draft-storage';
import {
  buildCsvContent,
  clearExportGroups,
  createExportGroupFromDrafts,
} from '@/services/export-storage';

vi.mock('@/services/card-generator', () => ({
  generateCardPayload: vi.fn(async ({ draft }: { draft: DraftEntry }) => ({
    noteType: draft.noteType,
    fields: {
      Word: draft.term,
      Definition: `${draft.term}-definition`,
    },
    schemaName: `${draft.noteType}-schema`,
    generatedAt: '2024-01-01T00:00:00.000Z',
  })),
}));

const buildSense = (overrides: Partial<Sense> = {}): Sense => ({
  id: overrides.id ?? 'sense-1',
  translationRU: overrides.translationRU ?? 'translation',
  notes: overrides.notes,
  partOfSpeech: overrides.partOfSpeech,
  usageLevel: overrides.usageLevel,
  examples: [],
});

describe('ExportScreen', () => {
  beforeEach(async () => {
    await clearDrafts();
    await clearExportGroups();
    vi.clearAllMocks();
  });

  it('builds CSV content with headers and values', () => {
    const draft: DraftEntry = {
      id: 1,
      term: 'hello',
      language: 'EN',
      noteType: 'EN: Default',
      sense: buildSense({ id: 's-1', translationRU: 'привет' }),
      exported: false,
      exportedAt: null,
      card: {
        noteType: 'EN: Default',
        fields: {
          Word: 'hello',
          Definition: 'greeting',
        },
        schemaName: 'en_default',
        generatedAt: '2024-01-01T00:00:00.000Z',
      },
    };

    const csv = buildCsvContent([draft], draft.noteType);
    expect(csv).toContain('#separator:Comma');
    expect(csv).toContain('#notetype column:3');
    expect(csv).toContain('#columns:Word,Definition,"notetype"');
    expect(csv).toContain('"hello","greeting","EN: Default"');
  });

  it('shows export groups with word list and download buttons', async () => {
    const enDraftId = await saveDraftFromSense({
      sense: buildSense({ id: 'en-1', translationRU: 'привет' }),
      term: 'hello',
      language: 'EN',
    });
    const plDraftId = await saveDraftFromSense({
      sense: buildSense({ id: 'pl-1', translationRU: 'cześć', partOfSpeech: 'noun' }),
      term: 'cześć',
      language: 'PL',
    });

    await createExportGroupFromDrafts([enDraftId!, plDraftId!]);

    render(<ExportScreen />);

    const group = await screen.findByTestId(/export-group-/);
    expect(group).toBeInTheDocument();
    expect(group).toHaveTextContent('hello');
    expect(group).toHaveTextContent('cześć');

    const files = screen.getAllByRole('button', { name: /CSV/ });
    expect(files.length).toBeGreaterThanOrEqual(2);
  });
});
