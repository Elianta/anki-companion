import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SensesScreen } from './SensesScreen';
import { useSessionStore, createSessionSnapshot } from '@/stores/session';
import type { Sense } from '@/lib/llm';
import { saveDraftFromSense } from '@/services/draft-storage';
import { toast } from 'sonner';

const navigateMock = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('@/services/draft-storage', () => ({
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
  useSessionStore.setState({
    ...createSessionSnapshot(),
    senses,
    term,
    language,
  });

  render(<SensesScreen />);

  return {
    saveButton: () => screen.getByRole('button', { name: /save to draft/i }),
    senseOption: (id: string) => screen.getByLabelText(`sense-${id}`),
  };
};

const expectSelectedSense = (id: string, isSelected: boolean) => {
  expect(screen.getByLabelText(`sense-${id}`)).toHaveAttribute(
    'aria-selected',
    isSelected ? 'true' : 'false',
  );
};

let user: ReturnType<typeof userEvent.setup>;

describe('SensesScreen', () => {
  const saveDraftMock = vi.mocked(saveDraftFromSense);

  beforeEach(() => {
    user = userEvent.setup();
    navigateMock.mockReset();
    saveDraftMock.mockReset();
    saveDraftMock.mockResolvedValue(1);
    toastErrorMock.mockReset();
    toastSuccessMock.mockReset();
  });

  it('renders empty state when there are no senses', () => {
    renderScreen({ senses: [] });

    expect(screen.getByText('No senses found for test')).toBeInTheDocument();
    expect(screen.getByText(/Try adjusting your query/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to search/i })).toBeInTheDocument();

    expect(screen.queryByText(/Possible senses for/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('listbox', { name: /senses list/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('renders senses from session store', () => {
    renderScreen();

    expect(screen.getByRole('listbox', { name: /senses list/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'sense-a' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'sense-b' })).toBeInTheDocument();
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

  it('saves selected sense to draft and navigates', async () => {
    const { saveButton, senseOption } = renderScreen();

    await user.click(senseOption('b'));
    await user.click(saveButton());

    await waitFor(() => {
      expect(saveDraftMock).toHaveBeenCalledWith(
        {
          sense: expect.objectContaining({ id: 'b' }),
          term: 'test',
          language: 'EN',
        },
        { backgroundGenerate: true },
      );
    });

    expect(toastSuccessMock).toHaveBeenCalled();
    expect(toastErrorMock).not.toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith({ to: '/' });
  });

  it('shows error and does not navigate when save fails', async () => {
    saveDraftMock.mockRejectedValueOnce(new Error('boom'));

    const { saveButton, senseOption } = renderScreen();

    await user.click(senseOption('b'));
    await user.click(saveButton());

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalled();
    });

    expect(screen.getByText(/Failed to save draft/i)).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
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
