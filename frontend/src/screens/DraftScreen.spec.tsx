import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DraftScreen } from './DraftScreen';
import type { Sense } from '@/lib/llm';
import * as draftStorage from '@/services/draft-storage';
import * as exportStorage from '@/services/export-storage';
import type { DraftEntry } from '@/lib/db';
import { toast } from 'sonner';

const navigateMock = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('sonner');
const toastErrorMock = vi.mocked(toast.error);

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

vi.mock('@/services/draft-storage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/draft-storage')>();
  return {
    ...actual,
    generateCardForDraft: vi.fn(actual.generateCardForDraft),
    removeDraft: vi.fn(actual.removeDraft),
    updateDraftNoteType: vi.fn(actual.updateDraftNoteType),
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

let user: ReturnType<typeof userEvent.setup>;

describe('DraftScreen', () => {
  const updateDraftNoteTypeMock = vi.mocked(draftStorage.updateDraftNoteType);
  const generateCardForDraftMock = vi.mocked(draftStorage.generateCardForDraft);
  const removeDraftMock = vi.mocked(draftStorage.removeDraft);

  beforeEach(async () => {
    user = userEvent.setup();
    await draftStorage.clearDrafts();
    await exportStorage.clearExportGroups();
    vi.clearAllMocks();
    navigateMock.mockReset();
    toastErrorMock.mockReset();
  });

  it('renders empty state when no drafts are present', async () => {
    render(<DraftScreen />);

    await waitFor(() => expect(screen.queryByText(/Loading drafts/i)).not.toBeInTheDocument());
    expect(screen.getByText(/No drafts yet\. Open the "Senses" tab/i)).toBeInTheDocument();
  });

  it('shows an error message when drafts fail to load', async () => {
    vi.spyOn(draftStorage, 'fetchDrafts').mockRejectedValueOnce(new Error('DB down'));

    render(<DraftScreen />);

    expect(
      await screen.findByText(/Failed to load drafts\. Refresh the page\./i),
    ).toBeInTheDocument();
  });

  it('shows stored drafts with key fields', async () => {
    await draftStorage.saveDraftFromSense({
      sense: buildSense({
        id: '1',
        translationRU: 'first',
        notes: 'note-a',
        partOfSpeech: 'noun',
      }),
      term: 'apple',
      language: 'EN',
    });

    await draftStorage.saveDraftFromSense({
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

    const selectAll = await screen.findByLabelText('Select all ready drafts');
    expect(selectAll).toBeEnabled();

    const enItem = screen.getByTestId(/draft-item-1/);
    expect(within(enItem).getByText('apple')).toBeInTheDocument();
    expect(within(enItem).getByText('first')).toBeInTheDocument();
    expect(within(enItem).queryByText('note-a')).not.toBeInTheDocument();
    expect(within(enItem).queryByText('noun')).not.toBeInTheDocument();

    const plItem = screen.getByTestId(/draft-item-2/);
    expect(within(plItem).getByText('pisać')).toBeInTheDocument();
    expect(within(plItem).getByText('drugi')).toBeInTheDocument();
    expect(within(plItem).queryByText('second note')).not.toBeInTheDocument();
    expect(within(plItem).queryByText('verb')).not.toBeInTheDocument();

    expect(screen.getByLabelText('Select draft apple')).toBeInTheDocument();
    expect(screen.getByLabelText('Select draft pisać')).toBeInTheDocument();
  });

  it('disables export button when no ready drafts are selected', async () => {
    await draftStorage.saveDraftFromSense({
      sense: buildSense({ id: 'en-1', translationRU: 'hello ru', partOfSpeech: 'noun' }),
      term: 'hello',
      language: 'EN',
    });

    render(<DraftScreen />);

    const exportButton = await screen.findByLabelText('Export selected drafts');
    expect(exportButton).toBeDisabled();
  });

  it('disables select all when there are no ready cards', async () => {
    vi.spyOn(draftStorage, 'fetchDrafts').mockResolvedValueOnce([
      {
        id: 1,
        term: 'apple',
        language: 'EN',
        noteType: 'EN: Default',
        exported: false,
        exportedAt: null,
        card: null,
        sense: buildSense({ id: '1', translationRU: 'first', partOfSpeech: 'noun' }),
      },
    ]);

    render(<DraftScreen />);

    const selectAll = await screen.findByLabelText('Select all ready drafts');
    expect(selectAll).toBeDisabled();
  });

  it('allows changing note type and removing a draft', async () => {
    const plDraftId = await draftStorage.saveDraftFromSense({
      sense: buildSense({ id: 'pl-1', translationRU: 'drugi', partOfSpeech: 'verb' }),
      term: 'pisać',
      language: 'PL',
    });

    render(<DraftScreen />);

    const noteTypeTrigger = await screen.findByLabelText('Note type for pisać');
    await user.click(noteTypeTrigger);
    const verbOption = await screen.findByText('PL: Verb');
    await user.click(verbOption);

    await waitFor(() => {
      expect(noteTypeTrigger).toHaveTextContent('PL: Verb');
      expect(updateDraftNoteTypeMock).toHaveBeenCalledWith(plDraftId, 'PL: Verb');
      expect(generateCardForDraftMock).toHaveBeenCalledWith(plDraftId);
    });

    const removeButton = await screen.findByLabelText('Delete draft pisać');
    await user.click(removeButton);

    await waitFor(() =>
      expect(screen.queryByTestId(`draft-item-${plDraftId}`)).not.toBeInTheDocument(),
    );

    expect(removeDraftMock).toHaveBeenCalledWith(plDraftId);
  });

  it('exports selected drafts and removes them from list', async () => {
    const enId = await draftStorage.saveDraftFromSense({
      sense: buildSense({ id: 'en-1', translationRU: 'hello ru', partOfSpeech: 'noun' }),
      term: 'hello',
      language: 'EN',
    });
    const plId = await draftStorage.saveDraftFromSense({
      sense: buildSense({ id: 'pl-1', translationRU: 'cześć', partOfSpeech: 'verb' }),
      term: 'cześć',
      language: 'PL',
    });
    const createExportGroupFromDraftsSpy = vi.spyOn(exportStorage, 'createExportGroupFromDrafts');

    render(<DraftScreen />);

    const selectAll = await screen.findByLabelText('Select all ready drafts');
    await user.click(selectAll);

    const exportButton = screen.getByLabelText('Export selected drafts');
    await user.click(exportButton);

    await waitFor(() => {
      expect(createExportGroupFromDraftsSpy).toHaveBeenCalledWith([plId, enId]);
      expect(navigateMock).toHaveBeenCalledWith({ to: '/export' });
      expect(screen.queryByTestId(`draft-item-${enId}`)).not.toBeInTheDocument();
      expect(screen.queryByTestId(`draft-item-${plId}`)).not.toBeInTheDocument();
    });
  });

  it('shows toast on export error', async () => {
    vi.spyOn(exportStorage, 'createExportGroupFromDrafts').mockRejectedValueOnce(
      new Error('Export failed'),
    );

    await draftStorage.saveDraftFromSense({
      sense: buildSense({ id: 'err-1', translationRU: 'oops', partOfSpeech: 'noun' }),
      term: 'oops',
      language: 'EN',
    });

    render(<DraftScreen />);

    const draftCheckbox = await screen.findByLabelText('Select draft oops');
    await user.click(draftCheckbox);

    const exportButton = screen.getByLabelText('Export selected drafts');
    await user.click(exportButton);

    await waitFor(() =>
      expect(toastErrorMock).toHaveBeenCalledWith(expect.stringMatching(/Export failed/i)),
    );
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
