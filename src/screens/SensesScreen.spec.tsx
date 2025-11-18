import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';

import { SensesScreen } from './SensesScreen';
import { useSessionStore, createSessionSnapshot } from '@/stores/session';
import type { Sense } from '@/lib/llm';

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

describe('SensesScreen', () => {
  beforeEach(() => {
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

    expect(
      screen.getByText('Enter your query on the main page to see results.'),
    ).toBeInTheDocument();

    expect(screen.queryByText(/Possible senses for/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('renders senses from session store', () => {
    render(<SensesScreen />);
    expect(screen.getByText('Possible senses for test:')).toBeInTheDocument();
    expect(screen.getByText('first translation')).toBeInTheDocument();
    expect(screen.getByText('second translation')).toBeInTheDocument();
    expect(screen.getByText('noun')).toBeInTheDocument();
    expect(screen.getByText('note-b')).toBeInTheDocument();
  });

  it('marks a sense as selected on click', () => {
    render(<SensesScreen />);
    const first = screen.getByTestId('sense-a');
    const second = screen.getByTestId('sense-b');

    // initial selection defaults to first
    expect(first.getAttribute('data-selected')).toBe('true');
    expect(second.getAttribute('data-selected')).toBe('false');

    fireEvent.click(second);
    expect(first.getAttribute('data-selected')).toBe('false');
    expect(second.getAttribute('data-selected')).toBe('true');
  });
});
