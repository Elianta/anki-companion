import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SensesResults } from './SensesResults';
import type { Sense } from '@/lib/llm';
import { saveDraftFromSense } from '@/services/draft-storage';
import { toast } from 'sonner';

vi.mock('@/services/draft-storage', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/draft-storage')>()),
  saveDraftFromSense: vi.fn(),
}));

vi.mock('sonner');
const toastErrorMock = vi.mocked(toast.error);
const toastSuccessMock = vi.mocked(toast.success);

const buildSense = (overrides: Partial<Sense> & Pick<Sense, 'id' | 'translationRU'>): Sense => ({
  id: overrides.id,
  translationRU: overrides.translationRU,
  partOfSpeech: overrides.partOfSpeech,
  usageLevel: overrides.usageLevel,
  notes: overrides.notes,
  examples: overrides.examples ?? ['ex 1', 'ex 2'],
});

const defaultSenses = [
  buildSense({
    id: 'a',
    translationRU: 'first translation',
    partOfSpeech: 'noun',
    usageLevel: 'high',
  }),
  buildSense({
    id: 'b',
    translationRU: 'second translation',
    usageLevel: 'medium',
    notes: 'note-b',
  }),
];

const renderScreen = ({
  senses = defaultSenses,
  term = 'test',
  language = 'EN',
}: {
  senses?: Sense[];
  term?: string;
  language?: 'EN' | 'PL';
} = {}) => {
  render(<SensesResults term={term} senses={senses} language={language} />);

  return {
    saveButton: () => screen.getByRole('button', { name: /save to draft/i }),
    senseOption: (id: string) =>
      screen.getByRole('option', { name: id === 'a' ? 'first translation' : 'second translation' }),
  };
};

const expectSelectedSense = (id: string, isSelected: boolean) => {
  expect(
    screen.getByRole('option', { name: id === 'a' ? 'first translation' : 'second translation' }),
  ).toHaveAttribute('aria-selected', isSelected ? 'true' : 'false');
};

let user: ReturnType<typeof userEvent.setup>;

describe('SensesResults', () => {
  const saveDraftMock = vi.mocked(saveDraftFromSense);

  beforeEach(() => {
    user = userEvent.setup();
    saveDraftMock.mockReset();
    saveDraftMock.mockResolvedValue(1);
    toastErrorMock.mockReset();
    toastSuccessMock.mockReset();
  });

  it('renders empty state when there are no senses', () => {
    renderScreen({ senses: [] });

    expect(screen.getByText('No senses found for test')).toBeInTheDocument();
    expect(screen.getByText(/Try adjusting your query/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /save to draft/i })).not.toBeInTheDocument();

    expect(screen.queryByText(/Possible senses for/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('listbox', { name: /senses list/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('renders senses passed through props', () => {
    renderScreen();

    expect(screen.getByRole('listbox', { name: /senses list/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'first translation' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'second translation' })).toBeInTheDocument();
    expect(screen.getByText('Possible senses for test:')).toBeInTheDocument();
    expect(screen.getByText('first translation')).toBeInTheDocument();
    expect(screen.getByText('second translation')).toBeInTheDocument();
    expect(screen.getByText('noun')).toBeInTheDocument();
    expect(screen.getByText('note-b')).toBeInTheDocument();
  });

  it('marks a sense as selected on click', async () => {
    const { senseOption } = renderScreen();

    expectSelectedSense('a', true);
    expectSelectedSense('b', false);

    await user.click(senseOption('b'));

    expectSelectedSense('a', false);
    expectSelectedSense('b', true);
  });

  it('exposes the actual usage frequency for each sense', () => {
    renderScreen();
    expect(screen.getByRole('img', { name: 'Usage frequency: high' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Usage frequency: medium' })).toBeInTheDocument();
  });

  it('moves selection and focus with arrow keys, Home, and End', async () => {
    const { senseOption } = renderScreen();
    senseOption('a').focus();
    await user.keyboard('{ArrowDown}');
    expectSelectedSense('b', true);
    expect(senseOption('b')).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expectSelectedSense('a', true);
    await user.keyboard('{End}');
    expectSelectedSense('b', true);
    await user.keyboard('{Home}');
    expectSelectedSense('a', true);
    await user.keyboard('{ArrowUp}');
    expectSelectedSense('b', true);
  });

  it('disables saving during persistence and prevents duplicate requests', async () => {
    let resolveSave!: (id: number) => void;
    saveDraftMock.mockReturnValue(
      new Promise((resolve) => {
        resolveSave = resolve;
      }),
    );
    const { saveButton } = renderScreen({ language: 'PL' });
    const button = saveButton();
    await user.click(button);
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Saving…');
    expect(screen.getByRole('combobox', { name: 'Note type' })).toBeDisabled();
    await user.click(button);
    expect(saveDraftMock).toHaveBeenCalledTimes(1);

    await act(async () => resolveSave(1));
    expect(button).not.toBeDisabled();
  });

  it('saves selected sense and keeps results available', async () => {
    const { saveButton, senseOption } = renderScreen();

    await user.click(senseOption('b'));
    await user.click(saveButton());

    await waitFor(() => {
      expect(saveDraftMock).toHaveBeenCalledWith(
        {
          sense: expect.objectContaining({ id: 'b' }),
          term: 'test',
          language: 'EN',
          noteType: 'EN: Default',
        },
        { backgroundGenerate: true },
      );
    });

    expect(toastSuccessMock).toHaveBeenCalled();
    expect(toastErrorMock).not.toHaveBeenCalled();
    expect(screen.getByRole('listbox', { name: 'Senses list' })).toBeInTheDocument();
  });

  it('shows the only English note type as disabled', () => {
    renderScreen();

    const noteTypeSelect = screen.getByRole('combobox', { name: 'Note type' });
    expect(screen.queryByText('Note type')).not.toBeInTheDocument();
    expect(noteTypeSelect).toHaveTextContent('EN: Default');
    expect(noteTypeSelect).toBeDisabled();
  });

  it.each(['PL: Default', 'PL: Verbs', 'PL: Nouns', 'PL: Verbs Inf'])(
    'saves the selected Polish note type %s before background generation',
    async (noteType) => {
      const { saveButton, senseOption } = renderScreen({ language: 'PL' });
      const noteTypeSelect = screen.getByRole('combobox', { name: 'Note type' });
      expect(noteTypeSelect).toHaveTextContent('PL: Default');

      await user.click(noteTypeSelect);
      await user.click(await screen.findByRole('option', { name: noteType }));
      await user.click(senseOption('b'));
      await user.click(saveButton());

      await waitFor(() => {
        expect(saveDraftMock).toHaveBeenCalledWith(
          {
            sense: expect.objectContaining({ id: 'b' }),
            term: 'test',
            language: 'PL',
            noteType,
          },
          { backgroundGenerate: true },
        );
      });
      expect(screen.getByRole('listbox', { name: 'Senses list' })).toBeInTheDocument();
    },
  );

  it('shows an error and keeps the selection when save fails', async () => {
    saveDraftMock.mockRejectedValueOnce(new Error('boom'));

    const { saveButton, senseOption } = renderScreen();

    await user.click(senseOption('b'));
    await user.click(saveButton());

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalled();
    });

    expect(screen.getByText(/Failed to save draft/i)).toBeInTheDocument();
    expectSelectedSense('b', true);
  });

  it('allows selecting a sense with keyboard (Enter/Space)', async () => {
    const { senseOption } = renderScreen();
    const first = senseOption('a');
    const second = senseOption('b');

    expectSelectedSense('a', true);
    expectSelectedSense('b', false);

    second.focus();
    await user.keyboard('{Enter}');

    expectSelectedSense('a', false);
    expectSelectedSense('b', true);

    first.focus();
    await user.keyboard(' ');

    expectSelectedSense('a', true);
    expectSelectedSense('b', false);
  });
});
