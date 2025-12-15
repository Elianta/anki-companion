import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import { HomeScreen } from './HomeScreen';
import { disambiguate } from '@/lib/llm';
import { useSessionStore, createSessionSnapshot } from '@/stores/session';

const mockNavigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/lib/llm', () => ({
  disambiguate: vi.fn(),
}));

const disambiguateMock = vi.mocked(disambiguate);

const renderScreen = () => render(<HomeScreen />);
const getLanguageToggle = () => screen.getByTestId('language-toggle');
const getTermInput = () => screen.getByTestId('term-input');
const getSearchButton = () => screen.getByTestId('search-button');

describe('HomeScreen', () => {
  beforeEach(() => {
    useSessionStore.setState(createSessionSnapshot());
    mockNavigate.mockResolvedValue(undefined);
    disambiguateMock.mockReset();
  });

  it('renders the input and language toggle', () => {
    renderScreen();
    expect(getTermInput()).toBeInTheDocument();
    expect(getLanguageToggle()).toBeInTheDocument();
  });

  it('defaults language to EN', () => {
    renderScreen();
    expect(getLanguageToggle()).toHaveTextContent('EN');
  });

  it('toggles the language when clicking the toggle button', async () => {
    renderScreen();
    const toggle = getLanguageToggle();

    await userEvent.click(toggle);
    expect(useSessionStore.getState().language).toBe('PL');
    expect(toggle).toHaveTextContent('PL');

    await userEvent.click(toggle);
    expect(useSessionStore.getState().language).toBe('EN');
    expect(toggle).toHaveTextContent('EN');
  });

  it('updates the input value when typing', async () => {
    renderScreen();
    const input = getTermInput();
    await userEvent.type(input, 'chunk');
    expect(input).toHaveValue('chunk');
  });

  it('ignores search when the input is empty', async () => {
    renderScreen();
    await userEvent.click(getSearchButton());
    expect(disambiguate).not.toHaveBeenCalled();
  });

  it('calls disambiguate with the provided term and language', async () => {
    renderScreen();
    const input = getTermInput();
    disambiguateMock.mockResolvedValue({
      term: 'drew [himself] up',
      langPair: 'EN',
      senses: [],
    });

    const typedTerm = 'drew [himself] up';
    fireEvent.change(input, { target: { value: typedTerm } });
    await userEvent.click(getSearchButton());

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

    await userEvent.click(toggle);
    await userEvent.type(input, 'zamek');
    await userEvent.click(getSearchButton());

    await waitFor(() => {
      expect(disambiguateMock).toHaveBeenCalledWith('zamek', 'PL');
    });
  });

  it('stores the resolved senses and term', async () => {
    renderScreen();
    const input = getTermInput();
    const senses = [{ id: 'sense-1', translationRU: 'example' }];
    disambiguateMock.mockResolvedValue({
      term: 'focus',
      langPair: 'EN',
      senses,
    });

    await userEvent.type(input, 'focus');
    await userEvent.click(getSearchButton());

    await waitFor(() => {
      const state = useSessionStore.getState();
      expect(state.term).toBe('focus');
      expect(state.senses).toEqual(senses);
    });
  });

  it('navigates to /senses after a successful lookup', async () => {
    renderScreen();
    const input = getTermInput();
    disambiguateMock.mockResolvedValue({
      term: 'focus',
      langPair: 'EN',
      senses: [],
    });

    await userEvent.type(input, 'focus');
    await userEvent.click(getSearchButton());

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/senses' });
    });
  });
});
