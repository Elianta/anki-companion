import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HistoryScreen } from './HistoryScreen';
import type { Sense } from '@/lib/llm';
import { clearDrafts, returnDraftToQueue, saveDraftFromSense } from '@/services/draft-storage';
import { db, type DraftEntry } from '@/lib/db';

vi.mock('@/services/card-generator', () => ({
  generateCardPayload: vi.fn(async ({ draft }: { draft: DraftEntry }) => ({
    fields: { Word: draft.term },
    schemaName: 'mock',
    prompt: 'prompt',
    noteType: draft.noteType,
    generatedAt: '2024-01-01T00:00:00.000Z',
  })),
}));

vi.mock('@/services/draft-storage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/draft-storage')>();
  return {
    ...actual,
    returnDraftToQueue: vi.fn(actual.returnDraftToQueue),
  };
});

const buildSense = (overrides: Partial<Sense> = {}): Sense => ({
  id: overrides.id ?? 'sense-1',
  translationRU: overrides.translationRU ?? 'translation',
  notes: overrides.notes,
  partOfSpeech: overrides.partOfSpeech,
  usageLevel: overrides.usageLevel,
  examples: [],
});

describe('HistoryScreen', () => {
  const returnDraftMock = vi.mocked(returnDraftToQueue);
  const markExported = async (...ids: number[]) => {
    await Promise.all(ids.map((id) => db.drafts.update(id, { exported: true })));
  };

  beforeEach(async () => {
    await clearDrafts();
    returnDraftMock.mockClear();
  });

  it('renders empty state', async () => {
    render(<HistoryScreen />);
    await waitFor(() =>
      expect(screen.getByText(/No exported drafts yet/i)).toBeInTheDocument(),
    );
  });

  it('lists exported drafts with term and translation', async () => {
    const firstId = await saveDraftFromSense({
      sense: buildSense({ id: 'first', translationRU: 'hello ru' }),
      term: 'hello',
      language: 'EN',
    });
    const secondId = await saveDraftFromSense({
      sense: buildSense({ id: 'second', translationRU: 'cześć' }),
      term: 'czesc',
      language: 'PL',
    });

    await markExported(firstId!, secondId!);

    render(<HistoryScreen />);

    expect(await screen.findByTestId(`history-item-${firstId}`)).toBeInTheDocument();
    expect(screen.getByText('hello')).toBeInTheDocument();
    expect(screen.getByText('hello ru')).toBeInTheDocument();

    expect(screen.getByText('czesc')).toBeInTheDocument();
    expect(screen.getByText('cześć')).toBeInTheDocument();

    expect(screen.getAllByTestId(/select-history-/)).toHaveLength(2);
  });

  it('restores a draft', async () => {
    const draftId = await saveDraftFromSense({
      sense: buildSense({ id: 'restore', translationRU: 'back' }),
      term: 'return me',
      language: 'EN',
    });
    await markExported(draftId!);

    render(<HistoryScreen />);
    const restoreButton = await screen.findByTestId(`restore-draft-${draftId}`);
    await userEvent.click(restoreButton);

    await waitFor(() => expect(returnDraftMock).toHaveBeenCalledWith(draftId));
  });

  it('selects and deletes history items', async () => {
    const draftId = await saveDraftFromSense({
      sense: buildSense({ id: 'delete', translationRU: 'bye' }),
      term: 'delete me',
      language: 'EN',
    });
    await markExported(draftId!);

    render(<HistoryScreen />);

    const checkbox = await screen.findByTestId(`select-history-${draftId}`);
    await userEvent.click(checkbox);

    const deleteButton = screen.getByTestId('delete-selected-history');
    await userEvent.click(deleteButton);

    await waitFor(() =>
      expect(screen.queryByTestId(`history-item-${draftId}`)).not.toBeInTheDocument(),
    );
  });
});
