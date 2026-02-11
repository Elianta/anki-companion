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

const buildSense = (
  id: string,
  translationRU: string,
  partOfSpeech?: string,
  usageLevel?: 'low' | 'medium' | 'high',
  notes?: string,
): Sense => ({
  id,
  translationRU,
  partOfSpeech,
  usageLevel,
  notes,
  examples: ['ex 1', 'ex 2'],
});

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

    useSessionStore.setState({
      ...createSessionSnapshot(),
      senses: [
        buildSense('a', 'first translation', 'noun', 'high', undefined),
        buildSense('b', 'second translation', undefined, 'medium', 'note-b'),
      ],
      term: 'test',
    });
  });

  it('renders empty state when there are no senses', () => {
    useSessionStore.setState({
      ...createSessionSnapshot(),
      senses: [],
      term: 'test',
    });

    render(<SensesScreen />);

    expect(screen.getByText('No senses found for test')).toBeInTheDocument();
    expect(screen.getByText(/Try adjusting your query/i)).toBeInTheDocument();
    expect(screen.getByText('Back to search')).toBeInTheDocument();

    expect(screen.queryByText(/Possible senses for/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('listbox', { name: /senses list/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('renders senses from session store', () => {
    render(<SensesScreen />);

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
    render(<SensesScreen />);
    const first = screen.getByLabelText('sense-a');
    const second = screen.getByLabelText('sense-b');

    // initial selection defaults to first
    expect(first).toHaveAttribute('aria-selected', 'true');
    expect(second).toHaveAttribute('aria-selected', 'false');

    await user.click(second);
    expect(first).toHaveAttribute('aria-selected', 'false');
    expect(second).toHaveAttribute('aria-selected', 'true');
  });

  it('saves selected sense to draft and navigates', async () => {
    render(<SensesScreen />);

    await user.click(screen.getByLabelText('sense-b'));
    await user.click(screen.getByRole('button', { name: /save to draft/i }));

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

    render(<SensesScreen />);

    await user.click(screen.getByLabelText('sense-b'));
    await user.click(screen.getByRole('button', { name: /save to draft/i }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalled();
    });

    expect(screen.getByText(/Failed to save draft/i)).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('allows selecting a sense with keyboard (Enter/Space)', async () => {
    render(<SensesScreen />);

    const first = screen.getByLabelText('sense-a');
    const second = screen.getByLabelText('sense-b');

    expect(first).toHaveAttribute('aria-selected', 'true');
    expect(second).toHaveAttribute('aria-selected', 'false');

    second.focus();
    await user.keyboard('{Enter}');

    expect(first).toHaveAttribute('aria-selected', 'false');
    expect(second).toHaveAttribute('aria-selected', 'true');

    first.focus();
    await user.keyboard(' ');

    expect(first).toHaveAttribute('aria-selected', 'true');
    expect(second).toHaveAttribute('aria-selected', 'false');
  });
});
