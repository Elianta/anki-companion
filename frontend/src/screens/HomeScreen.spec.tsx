import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import { HomeScreen } from './HomeScreen';
import { disambiguate, type DisambiguateResult, type Sense } from '@/lib/llm';
import { useSessionStore } from '@/stores/session';
import { isRateLimitError, formatRateLimitMessage } from '@/services/api';
import { toast } from 'sonner';
import { saveDraftFromSense } from '@/services/draft-storage';

const mockNavigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/lib/llm');
const disambiguateMock = vi.mocked(disambiguate);

vi.mock('sonner');
const toastErrorMock = vi.mocked(toast.error);
const toastWarningMock = vi.mocked(toast.warning);

vi.mock('@/services/api');
vi.mock('@/services/draft-storage', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/draft-storage')>()),
  saveDraftFromSense: vi.fn(),
}));
const saveDraftMock = vi.mocked(saveDraftFromSense);

const renderScreen = () => render(<HomeScreen />);
const getTermInput = () => screen.getByRole('textbox');
const getLanguageSelect = () => screen.getByRole('combobox', { name: /source language/i });
const getSearchButton = () => screen.getByRole('button', { name: /search/i });

const setup = () => {
  renderScreen();

  return {
    input: getTermInput(),
    languageSelect: getLanguageSelect(),
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
    localStorage.clear();
    useSessionStore.setState({ language: 'EN' });
    mockNavigate.mockReset();
    disambiguateMock.mockReset();
    toastErrorMock.mockReset();
    toastWarningMock.mockReset();
    saveDraftMock.mockReset();
    saveDraftMock.mockResolvedValue(1);
    vi.mocked(isRateLimitError).mockReset();
    vi.mocked(formatRateLimitMessage).mockReset();
  });

  it('renders input + language selector + search button', () => {
    const { input, languageSelect, searchButton } = setup();

    expect(input).toBeInTheDocument();
    expect(languageSelect).toBeInTheDocument();
    expect(searchButton).toBeInTheDocument();
  });

  it('defaults language to EN (UI + store)', () => {
    const { languageSelect } = setup();

    expect(languageSelect).toHaveTextContent('EN');
    expect(useSessionStore.getState().language).toBe('EN');
  });

  it('changes the language through the selector', async () => {
    const { languageSelect } = setup();

    await user.click(languageSelect);
    await user.click(screen.getByRole('option', { name: /Polish/ }));
    expect(useSessionStore.getState().language).toBe('PL');
    expect(languageSelect).toHaveTextContent('PL');

    await user.click(languageSelect);
    await user.click(screen.getByRole('option', { name: /English/ }));
    expect(useSessionStore.getState().language).toBe('EN');
    expect(languageSelect).toHaveTextContent('EN');
  });

  it('clears focus after selecting a language with the pointer', async () => {
    const { languageSelect, input } = setup();

    await user.click(languageSelect);
    await user.click(screen.getByRole('option', { name: /Polish/ }));

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(languageSelect).not.toHaveFocus();
    });
    expect(input).not.toHaveFocus();
    expect(languageSelect).toHaveTextContent('PL');
  });

  it('clears focus when selecting the current language with the pointer', async () => {
    const { languageSelect } = setup();

    await user.click(languageSelect);
    await user.click(screen.getByRole('option', { name: /English/ }));

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(languageSelect).not.toHaveFocus();
    });
    expect(languageSelect).toHaveTextContent('EN');
  });

  it('restores trigger focus after keyboard selection', async () => {
    const { languageSelect } = setup();

    await user.tab();
    expect(languageSelect).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    await waitFor(() => {
      expect(screen.getByRole('option', { name: /English/ })).toHaveFocus();
    });
    await user.keyboard('{ArrowDown}');
    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Polish/ })).toHaveFocus();
    });
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(languageSelect).toHaveFocus();
    });
    expect(languageSelect).toHaveTextContent('PL');
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

  it('searches with the selected language', async () => {
    const { input, languageSelect, searchButton } = setup();
    mockSuccessfulSearch({ term: 'szukać', langPair: 'PL' });

    await user.click(languageSelect);
    await user.click(screen.getByRole('option', { name: /Polish/ }));
    expect(languageSelect).toHaveTextContent('PL');

    await user.type(input, 'zamek');
    await user.click(searchButton);

    await waitFor(() => {
      expect(disambiguateMock).toHaveBeenCalledWith('zamek', 'PL');
    });
  });

  it('renders the resolved senses and term', async () => {
    const { input, searchButton } = setup();
    const senses: Sense[] = [{ id: 'sense-1', translationRU: 'example' }];
    mockSuccessfulSearch({ senses });

    await user.type(input, 'focus');
    await user.click(searchButton);

    expect(await screen.findByRole('option', { name: 'example' })).toBeInTheDocument();
    expect(screen.getByText('Possible senses for focus:')).toBeInTheDocument();
  });

  it('shows senses directly below search without navigation', async () => {
    const { input, searchButton } = setup();
    mockSuccessfulSearch({ senses: [{ id: 'a', translationRU: 'фокус' }] });

    await user.type(input, 'focus');
    await user.click(searchButton);

    expect(await screen.findByRole('option', { name: 'фокус' })).toBeInTheDocument();
    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(input).toHaveValue('focus');
    expect(mockNavigate).not.toHaveBeenCalled();

    expect(screen.getByText('Possible senses for focus:')).toBeInTheDocument();
  });

  it('shows an empty result below the form and allows another search', async () => {
    const { input, searchButton } = setup();
    mockSuccessfulSearch();
    await user.type(input, 'focus');
    await user.click(searchButton);

    expect(await screen.findByText('No senses found for focus')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /save to draft/i })).not.toBeInTheDocument();

    mockSuccessfulSearch({ term: 'learn', senses: [{ id: 'new', translationRU: 'учить' }] });
    await user.clear(input);
    await user.type(input, 'learn{enter}');

    expect(await screen.findByRole('option', { name: 'учить' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.queryByText('No senses found for focus')).not.toBeInTheDocument();
  });

  it('clears the input and senses only after saving succeeds and preserves the language', async () => {
    useSessionStore.setState({ language: 'PL' });
    mockSuccessfulSearch({
      term: 'zamek',
      langPair: 'PL',
      senses: [{ id: 'lock', translationRU: 'замок' }],
    });
    let resolveSave!: (id: number) => void;
    saveDraftMock.mockReturnValue(
      new Promise((resolve) => {
        resolveSave = resolve;
      }),
    );
    const { input, languageSelect } = setup();
    await user.click(input);
    await user.paste('zamek [do drzwi]');
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('option', { name: 'замок' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save to draft' }));
    expect(input).toHaveValue('zamek [do drzwi]');
    expect(screen.getByRole('listbox', { name: 'Senses list' })).toBeInTheDocument();
    expect(saveDraftMock).toHaveBeenCalledWith(
      expect.objectContaining({ term: 'zamek', language: 'PL' }),
      { backgroundGenerate: true },
    );

    await act(async () => resolveSave(1));
    expect(input).toHaveValue('');
    expect(screen.queryByRole('region', { name: 'Search results' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save to draft' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /What do you want/ })).toBeInTheDocument();
    expect(languageSelect).toHaveTextContent('PL');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('keeps the input and selected sense when saving fails', async () => {
    mockSuccessfulSearch({ senses: [{ id: 'focus', translationRU: 'фокус' }] });
    saveDraftMock.mockRejectedValueOnce(new Error('Storage unavailable'));
    const { input } = setup();
    await user.type(input, 'focus{enter}');
    await user.click(await screen.findByRole('button', { name: 'Save to draft' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to save draft.');
    expect(input).toHaveValue('focus');
    expect(screen.getByRole('option', { name: 'фокус' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('button', { name: 'Save to draft' })).toBeEnabled();
  });

  it('starts with an empty search after remounting the screen', async () => {
    mockSuccessfulSearch({ senses: [{ id: 'a', translationRU: 'фокус' }] });
    const { unmount } = renderScreen();
    await user.type(getTermInput(), 'focus{enter}');
    expect(await screen.findByRole('option', { name: 'фокус' })).toBeInTheDocument();

    unmount();
    renderScreen();

    expect(getTermInput()).toHaveValue('');
    expect(screen.queryByRole('listbox', { name: 'Senses list' })).not.toBeInTheDocument();
    expect(screen.getByText(/What do you want/)).toBeInTheDocument();
  });

  it('clears results when switching languages so they cannot be saved in the wrong language', async () => {
    mockSuccessfulSearch({ senses: [{ id: 'a', translationRU: 'фокус' }] });
    const { languageSelect, input } = setup();
    await user.type(input, 'focus{enter}');
    expect(await screen.findByRole('option', { name: 'фокус' })).toBeInTheDocument();

    await user.click(languageSelect);
    await user.click(screen.getByRole('option', { name: /Polish/ }));

    expect(screen.queryByRole('listbox', { name: 'Senses list' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /save to draft/i })).not.toBeInTheDocument();
    expect(input).toHaveValue('focus');
    expect(useSessionStore.getState().language).toBe('PL');
  });

  it('resets selection and card type on a new search', async () => {
    useSessionStore.setState({ language: 'PL' });
    mockSuccessfulSearch({
      langPair: 'PL',
      senses: [
        { id: 'a', translationRU: 'первое' },
        { id: 'b', translationRU: 'второе' },
      ],
    });
    const { input, searchButton } = setup();
    await user.type(input, 'focus');
    await user.click(searchButton);
    await user.click(await screen.findByRole('option', { name: 'второе' }));
    await user.click(screen.getByRole('combobox', { name: 'Note type' }));
    await user.click(screen.getByRole('option', { name: 'PL: Verbs' }));

    mockSuccessfulSearch({
      term: 'learn',
      langPair: 'PL',
      senses: [{ id: 'new', translationRU: 'учить' }],
    });
    await user.clear(input);
    await user.type(input, 'learn');
    await user.click(searchButton);

    expect(await screen.findByRole('option', { name: 'учить' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('combobox', { name: 'Note type' })).toHaveTextContent('PL: Default');
  });

  it('keeps the result term while the next query is being typed', async () => {
    mockSuccessfulSearch({ senses: [{ id: 'a', translationRU: 'фокус' }] });
    const { input } = setup();
    await user.type(input, 'focus{enter}');
    expect(await screen.findByRole('option', { name: 'фокус' })).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, 'learn');

    expect(screen.getByText('Possible senses for focus:')).toBeInTheDocument();
    expect(input).toHaveValue('learn');
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
    expect(screen.getByRole('search')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Searching for “focus”…');
    expect(screen.getByRole('status')).toHaveTextContent('This may take a few seconds.');
    expect(screen.getByRole('region', { name: 'Loading senses' })).toHaveAttribute(
      'aria-busy',
      'true',
    );

    resolve({ term: 'focus', langPair: 'EN', senses: [] });

    await waitFor(() => {
      expect(searchButton).not.toBeDisabled();
      expect(screen.queryByText('Searching for “focus”…')).not.toBeInTheDocument();
      expect(screen.queryByRole('region', { name: 'Loading senses' })).not.toBeInTheDocument();
    });
  });

  it('shows the submitted query while the input is edited during search', async () => {
    let resolve!: (result: DisambiguateResult) => void;
    disambiguateMock.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const { input, searchButton } = setup();
    fireEvent.change(input, { target: { value: '  przełom  ' } });
    await user.click(searchButton);

    await user.clear(input);
    await user.type(input, 'zamek');
    expect(screen.getByRole('status')).toHaveTextContent('Searching for “przełom”…');

    resolve({ term: 'przełom', langPair: 'EN', senses: [{ id: 'a', translationRU: 'прорыв' }] });
    expect(await screen.findByRole('option', { name: 'прорыв' })).toBeInTheDocument();
    expect(screen.queryByText(/Searching for/)).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Loading senses' })).not.toBeInTheDocument();
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
      expect(toastWarningMock).toHaveBeenCalledWith('Try again in 30s');
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
