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

const setup = () => {
  renderScreen();

  return {
    input: getTermInput(),
    languageToggle: getLanguageToggle(),
    searchButton: getSearchButton(),
  };
};

const mockSuccessfulSearch = (overrides: Partial<DisambiguateResult> = {}) => {
  const result: DisambiguateResult = {
    term: 'focus',
    langPair: 'EN',
    senses: [],
    ...overrides,
  };
  disambiguateMock.mockResolvedValue(result);
  return result;
};

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
    const { input, languageToggle, searchButton } = setup();

    expect(input).toBeInTheDocument();
    expect(languageToggle).toBeInTheDocument();
    expect(searchButton).toBeInTheDocument();
  });

  it('defaults language to EN (UI + store)', () => {
    const { languageToggle } = setup();

    expect(languageToggle).toHaveTextContent('EN');
    expect(useSessionStore.getState().language).toBe('EN');
  });

  it('toggles the language when clicking the toggle button', async () => {
    const { languageToggle } = setup();

    await user.click(languageToggle);
    expect(useSessionStore.getState().language).toBe('PL');
    expect(languageToggle).toHaveTextContent('PL');

    await user.click(languageToggle);
    expect(useSessionStore.getState().language).toBe('EN');
    expect(languageToggle).toHaveTextContent('EN');
  });

  it('ignores search when input is empty or whitespace', async () => {
    const { input, searchButton } = setup();

    await user.click(searchButton);
    expect(disambiguateMock).not.toHaveBeenCalled();

    await user.type(input, '   ');
    await user.click(searchButton);
    expect(disambiguateMock).not.toHaveBeenCalled();
  });

  it('calls disambiguate with trimmed term and current language', async () => {
    const { input, searchButton } = setup();

    const typedTerm = 'drew [himself] up';
    mockSuccessfulSearch({ term: typedTerm });
    fireEvent.change(input, {
      target: { value: `   ${typedTerm}   ` },
    });
    await user.click(searchButton);

    await waitFor(() => {
      expect(disambiguateMock).toHaveBeenCalledWith(typedTerm, 'EN');
    });
  });

  it('searches with the toggled language', async () => {
    const { input, languageToggle, searchButton } = setup();
    mockSuccessfulSearch({ term: 'szukać', langPair: 'PL' });

    await user.click(languageToggle);
    expect(languageToggle).toHaveTextContent('PL');

    await user.type(input, 'zamek');
    await user.click(searchButton);

    await waitFor(() => {
      expect(disambiguateMock).toHaveBeenCalledWith('zamek', 'PL');
    });
  });

  it('stores the resolved senses and term', async () => {
    const { input, searchButton } = setup();
    const senses: Sense[] = [{ id: 'sense-1', translationRU: 'example' }];
    mockSuccessfulSearch({ senses });

    await user.type(input, 'focus');
    await user.click(searchButton);

    await waitFor(() => {
      const state = useSessionStore.getState();
      expect(state.term).toBe('focus');
      expect(state.senses).toEqual(senses);
    });
  });

  it('navigates to /senses after storing results', async () => {
    const { input, searchButton } = setup();
    mockSuccessfulSearch();

    await user.type(input, 'focus');
    await user.click(searchButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/senses' });
    });

    expect(useSessionStore.getState().term).toBe('focus');
  });

  it('disables submit while request is in-flight and prevents double submit', async () => {
    const { input, searchButton } = setup();

    let resolve!: (v: DisambiguateResult) => void;
    const pending: Promise<DisambiguateResult> = new Promise((r) => (resolve = r));
    disambiguateMock.mockReturnValue(pending);

    await user.type(input, 'focus');
    await user.click(searchButton);
    await user.click(searchButton);

    expect(disambiguateMock).toHaveBeenCalledTimes(1);
    expect(searchButton).toBeDisabled();

    resolve({ term: 'focus', langPair: 'EN', senses: [] });

    await waitFor(() => {
      expect(searchButton).not.toBeDisabled();
    });
  });

  it('shows an error toast and does not navigate when disambiguate fails', async () => {
    const { input, searchButton } = setup();
    disambiguateMock.mockRejectedValue(new Error('error'));

    await user.type(input, 'focus');
    await user.click(searchButton);

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('shows rate limit toast message when API reports rate limit', async () => {
    const { input, searchButton } = setup();

    vi.mocked(isRateLimitError).mockReturnValue(true);
    vi.mocked(formatRateLimitMessage).mockReturnValue('Try again in 30s');

    disambiguateMock.mockRejectedValue({ retryAfterSeconds: 30 });

    await user.type(input, 'focus');
    await user.click(searchButton);

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('Try again in 30s');
    });
  });

  it('submits on Enter key (form submit)', async () => {
    const { input } = setup();
    mockSuccessfulSearch();

    await user.type(input, 'focus{enter}');

    await waitFor(() => {
      expect(disambiguateMock).toHaveBeenCalledWith('focus', 'EN');
    });
  });
});
