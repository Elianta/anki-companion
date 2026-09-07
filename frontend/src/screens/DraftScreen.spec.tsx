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

const seedDraft = async ({
  term,
  language,
  sense,
}: {
  term: string;
  language: 'EN' | 'PL';
  sense?: Partial<Sense>;
}) =>
  draftStorage.saveDraftFromSense({
    sense: buildSense(sense),
    term,
    language,
  });

const renderScreen = () => {
  render(<DraftScreen />);

  return {
    exportButton: () => screen.findByLabelText('Export selected drafts'),
    selectAll: () => screen.findByLabelText('Select all ready drafts'),
    draftItem: (id: number | string) => screen.queryByTestId(`draft-item-${id}`),
    draftCheckbox: (term: string) => screen.findByLabelText(`Select draft ${term}`),
    noteTypeTrigger: (term: string) => screen.findByLabelText(`Note type for ${term}`),
    removeButton: (term: string) => screen.findByLabelText(`Delete draft ${term}`),
  };
};

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
    renderScreen();

    await waitFor(() => expect(screen.queryByText(/Loading drafts/i)).not.toBeInTheDocument());
    expect(screen.getByText(/No drafts yet\. Open the "Senses" tab/i)).toBeInTheDocument();
  });

  it('shows an error message when drafts fail to load', async () => {
    vi.spyOn(draftStorage, 'fetchDrafts').mockRejectedValueOnce(new Error('DB down'));

    renderScreen();

    expect(
      await screen.findByText(/Failed to load drafts\. Refresh the page\./i),
    ).toBeInTheDocument();
  });

  it('shows stored drafts with key fields', async () => {
    await seedDraft({
      term: 'apple',
      language: 'EN',
      sense: { id: '1', translationRU: 'first', notes: 'note-a', partOfSpeech: 'noun' },
    });
    await seedDraft({
      term: 'pisać',
      language: 'PL',
      sense: { id: '2', translationRU: 'drugi', notes: 'second note', partOfSpeech: 'verb' },
    });

    const { selectAll } = renderScreen();

    expect(await selectAll()).toBeEnabled();

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
    await seedDraft({
      term: 'hello',
      language: 'EN',
      sense: { id: 'en-1', translationRU: 'hello ru', partOfSpeech: 'noun' },
    });

    const { exportButton } = renderScreen();

    expect(await exportButton()).toBeDisabled();
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

    const { selectAll } = renderScreen();

    expect(await selectAll()).toBeDisabled();
  });

  it('allows changing note type', async () => {
    const plDraftId = await seedDraft({
      term: 'pisać',
      language: 'PL',
      sense: { id: 'pl-1', translationRU: 'drugi', partOfSpeech: 'verb' },
    });

    const { noteTypeTrigger } = renderScreen();

    const trigger = await noteTypeTrigger('pisać');
    await user.click(trigger);
    const verbOption = await screen.findByText('PL: Verbs');
    await user.click(verbOption);

    await waitFor(() => {
      expect(trigger).toHaveTextContent('PL: Verbs');
      expect(updateDraftNoteTypeMock).toHaveBeenCalledWith(plDraftId, 'PL: Verbs');
      expect(generateCardForDraftMock).toHaveBeenCalledWith(plDraftId);
    });
  });

  it('allows removing a draft', async () => {
    const plDraftId = await seedDraft({
      term: 'pisać',
      language: 'PL',
      sense: { id: 'pl-1', translationRU: 'drugi', partOfSpeech: 'verb' },
    });

    const { draftItem, removeButton } = renderScreen();

    await user.click(await removeButton('pisać'));

    await waitFor(() => expect(draftItem(plDraftId)).not.toBeInTheDocument());

    expect(removeDraftMock).toHaveBeenCalledWith(plDraftId);
  });

  it('exports selected drafts and removes them from list', async () => {
    const enId = await seedDraft({
      term: 'hello',
      language: 'EN',
      sense: { id: 'en-1', translationRU: 'hello ru', partOfSpeech: 'noun' },
    });
    const plId = await seedDraft({
      term: 'cześć',
      language: 'PL',
      sense: { id: 'pl-1', translationRU: 'cześć', partOfSpeech: 'verb' },
    });
    const createExportGroupFromDraftsSpy = vi.spyOn(exportStorage, 'createExportGroupFromDrafts');

    const { draftItem, exportButton, selectAll } = renderScreen();

    await user.click(await selectAll());

    await user.click(await exportButton());

    await waitFor(() => {
      expect(createExportGroupFromDraftsSpy).toHaveBeenCalledWith(
        expect.arrayContaining([enId, plId]),
      );
      expect(navigateMock).toHaveBeenCalledWith({ to: '/export' });
      expect(draftItem(enId)).not.toBeInTheDocument();
      expect(draftItem(plId)).not.toBeInTheDocument();
    });
  });

  it('shows toast on export error', async () => {
    vi.spyOn(exportStorage, 'createExportGroupFromDrafts').mockRejectedValueOnce(
      new Error('Export failed'),
    );

    await seedDraft({
      term: 'oops',
      language: 'EN',
      sense: { id: 'err-1', translationRU: 'oops', partOfSpeech: 'noun' },
    });

    const { draftCheckbox, exportButton } = renderScreen();

    await user.click(await draftCheckbox('oops'));
    await user.click(await exportButton());

    await waitFor(() =>
      expect(toastErrorMock).toHaveBeenCalledWith(expect.stringMatching(/Export failed/i)),
    );
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
