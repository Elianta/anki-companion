import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import { HomeScreen } from './HomeScreen';
import { disambiguate, type DisambiguateResult, type Sense } from '@/lib/llm';
import { useSessionStore, createSessionSnapshot } from '@/stores/session';
import { isRateLimitError, formatRateLimitMessage } from '@/services/api';
import { toast } from 'sonner';

const mockNavigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/lib/llm');
const disambiguateMock = vi.mocked(disambiguate);

vi.mock('sonner');
const toastErrorMock = vi.mocked(toast.error);

vi.mock('@/services/api');

const renderScreen = () => render(<HomeScreen />);
const getTermInput = () => screen.getByRole('textbox');
const getLanguageToggle = () => screen.getByRole('button', { name: /toggle source language/i });
const getSearchButton = () => screen.getByRole('button', { name: /search/i });
let user: ReturnType<typeof userEvent.setup>;

describe('HomeScreen', () => {
  beforeEach(() => {
    user = userEvent.setup();
    useSessionStore.setState(createSessionSnapshot());
    mockNavigate.mockReset();
    disambiguateMock.mockReset();
    toastErrorMock.mockReset();
    vi.mocked(isRateLimitError).mockReset();
    vi.mocked(formatRateLimitMessage).mockReset();
  });

  it('renders input + language toggle + search button', () => {
    renderScreen();
    expect(getTermInput()).toBeInTheDocument();
    expect(getLanguageToggle()).toBeInTheDocument();
    expect(getSearchButton()).toBeInTheDocument();
  });

  it('defaults language to EN (UI + store)', () => {
    renderScreen();
    expect(getLanguageToggle()).toHaveTextContent('EN');
    expect(useSessionStore.getState().language).toBe('EN');
  });

  it('toggles the language when clicking the toggle button', async () => {
    renderScreen();
    const toggle = getLanguageToggle();

    await user.click(toggle);
    expect(useSessionStore.getState().language).toBe('PL');
    expect(toggle).toHaveTextContent('PL');

    await user.click(toggle);
    expect(useSessionStore.getState().language).toBe('EN');
    expect(toggle).toHaveTextContent('EN');
  });

  it('ignores search when input is empty or whitespace', async () => {
    renderScreen();

    await user.click(getSearchButton());
    expect(disambiguateMock).not.toHaveBeenCalled();

    await user.type(getTermInput(), '   ');
    await user.click(getSearchButton());
    expect(disambiguateMock).not.toHaveBeenCalled();
  });

  it('calls disambiguate with trimmed term and current language', async () => {
    renderScreen();

    const input = getTermInput();
    disambiguateMock.mockResolvedValue({
      term: 'drew [himself] up',
      langPair: 'EN',
      senses: [],
    });

    const typedTerm = 'drew [himself] up';
    fireEvent.change(input, {
      target: { value: `   ${typedTerm}   ` },
    });
    await user.click(getSearchButton());

    await waitFor(() => {
      expect(disambiguateMock).toHaveBeenCalledWith(typedTerm, 'EN');
    });
  });

  it('searches with the toggled language', async () => {
    renderScreen();
    const input = getTermInput();
    const toggle = getLanguageToggle();
    disambiguateMock.mockResolvedValue({
      term: 'szukać',
      langPair: 'PL',
      senses: [],
    });

    await user.click(toggle);
    expect(toggle).toHaveTextContent('PL');

    await user.type(input, 'zamek');
    await user.click(getSearchButton());

    await waitFor(() => {
      expect(disambiguateMock).toHaveBeenCalledWith('zamek', 'PL');
    });
  });

  it('stores the resolved senses and term', async () => {
    renderScreen();
    const input = getTermInput();
    const senses: Sense[] = [{ id: 'sense-1', translationRU: 'example' }];
    disambiguateMock.mockResolvedValue({
      term: 'focus',
      langPair: 'EN',
      senses,
    });

    await user.type(input, 'focus');
    await user.click(getSearchButton());

    await waitFor(() => {
      const state = useSessionStore.getState();
      expect(state.term).toBe('focus');
      expect(state.senses).toEqual(senses);
    });
  });

  it('navigates to /senses after storing results', async () => {
    renderScreen();
    const input = getTermInput();
    disambiguateMock.mockResolvedValue({
      term: 'focus',
      langPair: 'EN',
      senses: [],
    });

    await user.type(input, 'focus');
    await user.click(getSearchButton());

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/senses' });
    });

    // store updated
    expect(useSessionStore.getState().term).toBe('focus');

    // optional ordering check: disambiguate called before navigate
    expect(disambiguateMock.mock.invocationCallOrder[0]).toBeLessThan(
      mockNavigate.mock.invocationCallOrder[0],
    );
  });

  it('disables submit while request is in-flight and prevents double submit', async () => {
    renderScreen();

    let resolve!: (v: DisambiguateResult) => void;
    const pending: Promise<DisambiguateResult> = new Promise((r) => (resolve = r));
    disambiguateMock.mockReturnValue(pending);

    await user.type(getTermInput(), 'focus');
    await user.click(getSearchButton());
    await user.click(getSearchButton()); // second click should be ignored

    expect(disambiguateMock).toHaveBeenCalledTimes(1);
    expect(getSearchButton()).toBeDisabled();

    resolve({ term: 'focus', langPair: 'EN', senses: [] });

    await waitFor(() => {
      expect(getSearchButton()).not.toBeDisabled();
    });
  });

  it('shows an error toast and does not navigate when disambiguate fails', async () => {
    renderScreen();
    disambiguateMock.mockRejectedValue(new Error('error'));

    await user.type(getTermInput(), 'focus');
    await user.click(getSearchButton());

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('shows rate limit toast message when API reports rate limit', async () => {
    renderScreen();

    vi.mocked(isRateLimitError).mockReturnValue(true);
    vi.mocked(formatRateLimitMessage).mockReturnValue('Try again in 30s');

    disambiguateMock.mockRejectedValue({ retryAfterSeconds: 30 });

    await user.type(getTermInput(), 'focus');
    await user.click(getSearchButton());

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('Try again in 30s');
    });
  });

  it('submits on Enter key (form submit)', async () => {
    renderScreen();
    disambiguateMock.mockResolvedValue({ term: 'focus', langPair: 'EN', senses: [] });

    const input = getTermInput();
    await user.type(input, 'focus{enter}');

    await waitFor(() => {
      expect(disambiguateMock).toHaveBeenCalledWith('focus', 'EN');
    });
  });
});
