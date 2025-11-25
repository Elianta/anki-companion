import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DraftScreen } from './DraftScreen';
import type { Sense } from '@/lib/llm';
import { clearDrafts, saveDraftFromSense } from '@/services/draft-storage';
import * as exportStorage from '@/services/export-storage';
import type { DraftEntry } from '@/lib/db';

const { navigateMock, toastErrorMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('sonner', () => ({
  toast: {
    error: toastErrorMock,
  },
}));

const mockCardPayload = {
  fields: { Word: 'mock' },
  schemaName: 'mock-schema',
  prompt: 'prompt',
};

vi.mock('@/services/card-generator', () => ({
  generateCardPayload: vi.fn(async ({ draft }: { draft: DraftEntry }) => ({
    ...mockCardPayload,
    noteType: draft.noteType,
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

describe('DraftScreen', () => {
  beforeEach(async () => {
    await clearDrafts();
    await exportStorage.clearExportGroups();
    vi.clearAllMocks();
    navigateMock.mockReset();
    navigateMock.mockResolvedValue(undefined);
    toastErrorMock.mockReset();
  });

  it('renders empty state when no drafts are present', async () => {
    render(<DraftScreen />);

    await waitFor(() =>
      expect(screen.getByText(/No drafts yet\. Open the "Senses" tab/i)).toBeInTheDocument(),
    );
  });

  it('shows stored drafts with key fields', async () => {
    await saveDraftFromSense({
      sense: buildSense({
        id: '1',
        translationRU: 'first',
        notes: 'note-a',
        partOfSpeech: 'noun',
      }),
      term: 'apple',
      language: 'EN',
    });

    await saveDraftFromSense({
      sense: buildSense({
        id: '2',
        translationRU: 'drugi',
        notes: 'second note',
        partOfSpeech: 'verb',
      }),
      term: 'pisać',
      language: 'PL',
    });

    render(<DraftScreen />);

    expect(await screen.findByText('apple')).toBeInTheDocument();
    expect(screen.getByText('first')).toBeInTheDocument();
    expect(screen.getByText('note-a')).toBeInTheDocument();
    expect(screen.getByText('noun')).toBeInTheDocument();

    expect(screen.getByText('pisać')).toBeInTheDocument();
    expect(screen.getByText('drugi')).toBeInTheDocument();
    expect(screen.getByText('second note')).toBeInTheDocument();
    expect(screen.getByText('verb')).toBeInTheDocument();
    expect(screen.getAllByText('Card ready')).toHaveLength(2);
  });

  it('allows changing note type and removing a draft', async () => {
    const plDraftId = await saveDraftFromSense({
      sense: buildSense({ id: 'pl-1', translationRU: 'drugi', partOfSpeech: 'verb' }),
      term: 'pisać',
      language: 'PL',
    });

    const user = userEvent.setup();
    render(<DraftScreen />);

    const noteTypeTrigger = await screen.findByTestId(`note-type-${plDraftId}`);
    await user.click(noteTypeTrigger);
    const verbOption = await screen.findByText('PL: Verb');
    await user.click(verbOption);

    await waitFor(() => expect(noteTypeTrigger).toHaveTextContent('PL: Verb'));

    const removeButton = screen.getByTestId(`remove-draft-${plDraftId}`);
    fireEvent.click(removeButton);

    await waitFor(() =>
      expect(screen.queryByTestId(`draft-item-${plDraftId}`)).not.toBeInTheDocument(),
    );
  });

  it('exports selected drafts and disables exported items', async () => {
    const enId = await saveDraftFromSense({
      sense: buildSense({ id: 'en-1', translationRU: 'hello ru', partOfSpeech: 'noun' }),
      term: 'hello',
      language: 'EN',
    });
    const plId = await saveDraftFromSense({
      sense: buildSense({ id: 'pl-1', translationRU: 'cześć', partOfSpeech: 'verb' }),
      term: 'cześć',
      language: 'PL',
    });

    const user = userEvent.setup();
    render(<DraftScreen />);

    const selectAll = await screen.findByTestId('select-all-drafts');
    await user.click(selectAll);

    const exportButton = screen.getByTestId('export-button');
    await user.click(exportButton);

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith({ to: '/export' }));

    await waitFor(() => {
      expect(screen.getByTestId(`exported-badge-${enId}`)).toBeInTheDocument();
      expect(screen.getByTestId(`exported-badge-${plId}`)).toBeInTheDocument();
    });

    const enCheckbox = screen.getByTestId(`select-draft-${enId}`) as HTMLInputElement;
    const plCheckbox = screen.getByTestId(`select-draft-${plId}`) as HTMLInputElement;
    expect(enCheckbox.disabled).toBe(true);
    expect(plCheckbox.disabled).toBe(true);
  });

  it('shows toast on export error', async () => {
    vi.spyOn(exportStorage, 'createExportGroupFromDrafts').mockRejectedValueOnce(
      new Error('Export failed'),
    );

    const draftId = await saveDraftFromSense({
      sense: buildSense({ id: 'err-1', translationRU: 'oops', partOfSpeech: 'noun' }),
      term: 'oops',
      language: 'EN',
    });

    const user = userEvent.setup();
    render(<DraftScreen />);

    const draftCheckbox = await screen.findByTestId(`select-draft-${draftId}`);
    await user.click(draftCheckbox);

    const exportButton = screen.getByTestId('export-button');
    await user.click(exportButton);

    await waitFor(() => expect(toastErrorMock).toHaveBeenCalled());
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
