import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HistoryScreen } from './HistoryScreen';
import type { Sense } from '@/lib/llm';
import * as draftStorage from '@/services/draft-storage';
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

const renderScreen = () => render(<HistoryScreen />);

const createExportedDraft = async ({
  sense,
  term,
  language,
}: {
  sense: Sense;
  term: string;
  language: 'EN' | 'PL';
}) => {
  const draftId = await draftStorage.saveDraftFromSense({ sense, term, language });
  await db.drafts.update(draftId, { exported: true });
  return draftId;
};

let user: ReturnType<typeof userEvent.setup>;
let consoleWarnMock: ReturnType<typeof vi.spyOn>;

describe('HistoryScreen', () => {
  const returnDraftMock = vi.mocked(draftStorage.returnDraftToQueue);

  beforeEach(async () => {
    user = userEvent.setup();
    consoleWarnMock = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await draftStorage.clearDrafts();
    vi.clearAllMocks();
    returnDraftMock.mockReset();
    consoleWarnMock.mockClear();
  });

  it('renders empty state when there are no exported drafts', async () => {
    renderScreen();

    await waitFor(() => expect(screen.queryByText(/Loading history/i)).not.toBeInTheDocument());

    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Previously exported drafts.')).toBeInTheDocument();
    expect(screen.getByText(/No exported drafts yet/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/select exported draft/i)).not.toBeInTheDocument();
  });

  it('shows exported drafts with note type, term, translation, and bulk controls', async () => {
    await createExportedDraft({
      sense: buildSense({ id: 'first', translationRU: 'hello ru' }),
      term: 'hello',
      language: 'EN',
    });
    await createExportedDraft({
      sense: buildSense({ id: 'second', translationRU: 'cześć' }),
      term: 'czesc',
      language: 'PL',
    });

    renderScreen();

    expect(await screen.findByText('Select all (2 items)')).toBeInTheDocument();
    expect(screen.getByLabelText('Select all exported drafts')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete selected/i })).toBeDisabled();

    expect(await screen.findByText('hello')).toBeInTheDocument();
    expect(screen.getByText('hello ru')).toBeInTheDocument();
    expect(screen.getByLabelText('Note type for hello')).toHaveTextContent('EN: Default');

    expect(screen.getByText('czesc')).toBeInTheDocument();
    expect(screen.getByText('cześć')).toBeInTheDocument();
    expect(screen.getByLabelText('Note type for czesc')).toHaveTextContent('PL: Default');
  });

  it('restores a draft and removes it from history', async () => {
    const draftId = await createExportedDraft({
      sense: buildSense({ id: 'restore', translationRU: 'back' }),
      term: 'return me',
      language: 'EN',
    });

    renderScreen();

    await user.click(await screen.findByLabelText('Restore draft return me'));

    await waitFor(() => {
      expect(returnDraftMock).toHaveBeenCalledWith(draftId);
      expect(screen.queryByLabelText('Select exported draft return me')).not.toBeInTheDocument();
    });

    const restoredDraft = await db.drafts.get(draftId);
    expect(restoredDraft?.exported).toBe(false);
  });

  it('selects all exported drafts and deletes them', async () => {
    const firstId = await createExportedDraft({
      sense: buildSense({ id: 'delete-1', translationRU: 'bye' }),
      term: 'delete me',
      language: 'EN',
    });
    const secondId = await createExportedDraft({
      sense: buildSense({ id: 'delete-2', translationRU: 'pa' }),
      term: 'usuń mnie',
      language: 'PL',
    });

    renderScreen();

    const selectAll = await screen.findByLabelText('Select all exported drafts');
    const deleteButton = screen.getByRole('button', { name: /delete selected/i });

    expect(deleteButton).toBeDisabled();

    await user.click(selectAll);

    expect(deleteButton).toBeEnabled();

    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.queryByLabelText('Select exported draft delete me')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Select exported draft usuń mnie')).not.toBeInTheDocument();
    });

    expect(await db.drafts.get(firstId)).toBeUndefined();
    expect(await db.drafts.get(secondId)).toBeUndefined();
    expect(screen.getByText(/No exported drafts yet/i)).toBeInTheDocument();
  });

  it('shows an error message when history loading fails', async () => {
    vi.spyOn(draftStorage, 'fetchDrafts').mockRejectedValueOnce(new Error('DB down'));

    renderScreen();

    expect(await screen.findByText('Failed to load history.')).toBeInTheDocument();
  });
});
