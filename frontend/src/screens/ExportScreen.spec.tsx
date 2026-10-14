import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ExportScreen } from './ExportScreen';
import { db, type DraftEntry } from '@/lib/db';
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

const seedDraft = async ({
  term,
  language,
  sense,
}: {
  term: string;
  language: 'EN' | 'PL';
  sense?: Partial<Sense>;
}) =>
  saveDraftFromSense({
    sense: buildSense(sense),
    term,
    language,
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
    const enDraftId = await seedDraft({
      term: 'hello',
      language: 'EN',
      sense: { id: 'en-1', translationRU: 'привет' },
    });
    const plDraftId = await seedDraft({
      term: 'cześć',
      language: 'PL',
      sense: { id: 'pl-1', translationRU: 'cześć', partOfSpeech: 'noun' },
    });

    await createExportGroupFromDrafts([enDraftId!, plDraftId!]);

    render(<ExportScreen />);

    const trigger = await screen.findByRole('button', { name: 'Words (2)' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('list', { name: 'Exported words' })).not.toBeInTheDocument();
    await userEvent.click(trigger);

    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    expect(await screen.findByText('hello')).toBeInTheDocument();
    expect(screen.getByText('cześć')).toBeInTheDocument();

    const files = screen.getAllByRole('button', { name: /download .* csv for export/i });
    expect(files.length).toBeGreaterThanOrEqual(2);

    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('list', { name: 'Exported words' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /download .* csv for export/i })).toHaveLength(2);
  });

  it('downloads the original CSV with its stored file name', async () => {
    const draftId = await seedDraft({ term: 'murmur', language: 'EN' });
    const group = await createExportGroupFromDrafts([draftId!]);
    const createUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:export-preview');
    const revokeUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    try {
      render(<ExportScreen />);
      await userEvent.click(
        await screen.findByRole('button', { name: /Download EN: Default CSV/i }),
      );

      const blob = createUrl.mock.calls[0][0] as Blob;
      expect(blob.type).toBe('text/csv;charset=utf-8;');
      expect(await blob.text()).toBe(group.files[0].content);
      expect(anchorClick.mock.instances[0]).toHaveAttribute('download', group.files[0].fileName);
      expect(anchorClick.mock.instances[0]).toHaveAttribute('href', 'blob:export-preview');
      expect(revokeUrl).toHaveBeenCalledWith('blob:export-preview');
    } finally {
      createUrl.mockRestore();
      revokeUrl.mockRestore();
      anchorClick.mockRestore();
    }
  });

  it('keeps each word list independent and supports older exports without saved words', async () => {
    const firstId = await seedDraft({ term: 'write', language: 'EN', sense: { id: 'write' } });
    const secondId = await seedDraft({ term: 'eat', language: 'EN', sense: { id: 'eat' } });
    const first = await createExportGroupFromDrafts([firstId!]);
    await createExportGroupFromDrafts([secondId!]);
    await db.exportGroups.update(first.id!, { words: [] });

    render(<ExportScreen />);
    const triggers = await screen.findAllByRole('button', { name: 'Words (1)' });
    await userEvent.click(triggers[0]);
    expect(screen.getAllByRole('list', { name: 'Exported words' })).toHaveLength(1);
    await userEvent.click(triggers[1]);
    const lists = screen.getAllByRole('list', { name: 'Exported words' });
    expect(lists).toHaveLength(2);
    expect(lists.some((list) => within(list).queryByText('write'))).toBe(true);
    expect(lists.some((list) => within(list).queryByText('eat'))).toBe(true);
  });

  it('shows the empty state after loading', async () => {
    render(<ExportScreen />);
    expect(await screen.findByText('No exports yet.')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
