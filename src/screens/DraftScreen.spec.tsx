import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { DraftScreen } from './DraftScreen';
import type { Sense } from '@/lib/llm';
import { clearDrafts, saveDraftFromSense } from '@/services/draft-storage';

const buildSense = (overrides: Partial<Sense> = {}): Sense => ({
  id: overrides.id ?? 'sense-1',
  translationRU: overrides.translationRU ?? 'translation',
  notes: overrides.notes,
  partOfSpeech: overrides.partOfSpeech,
  usageLevel: overrides.usageLevel,
  examples: [],
});

describe('DraftScreen', () => {
  beforeEach(async () => {
    await clearDrafts();
  });

  it('renders empty state when no drafts are present', async () => {
    render(<DraftScreen />);

    await waitFor(() =>
      expect(screen.getByText(/No drafts yet\. Open the “Senses” tab/i)).toBeInTheDocument(),
    );
  });

  it('shows stored drafts with key fields', async () => {
    await saveDraftFromSense({
      sense: buildSense({
        id: '1',
        translationRU: 'first',
        notes: 'note-a',
        partOfSpeech: 'noun',
      }),
      term: 'apple',
      language: 'EN',
    });

    await saveDraftFromSense({
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

    expect(await screen.findByText('apple')).toBeInTheDocument();
    expect(screen.getByText('first')).toBeInTheDocument();
    expect(screen.getByText('note-a')).toBeInTheDocument();
    expect(screen.getByText('noun')).toBeInTheDocument();

    expect(screen.getByText('pisać')).toBeInTheDocument();
    expect(screen.getByText('drugi')).toBeInTheDocument();
    expect(screen.getByText('second note')).toBeInTheDocument();
    expect(screen.getByText('verb')).toBeInTheDocument();
  });

  it('allows changing note type and removing a draft', async () => {
    const plDraftId = await saveDraftFromSense({
      sense: buildSense({ id: 'pl-1', translationRU: 'drugi', partOfSpeech: 'verb' }),
      term: 'pisać',
      language: 'PL',
    });

    const user = userEvent.setup();
    render(<DraftScreen />);

    const noteTypeTrigger = await screen.findByTestId(`note-type-${plDraftId}`);
    await user.click(noteTypeTrigger);
    const verbOption = await screen.findByText('PL: Verb');
    await user.click(verbOption);

    await waitFor(() => expect(noteTypeTrigger).toHaveTextContent('PL: Verb'));

    const removeButton = screen.getByTestId(`remove-draft-${plDraftId}`);
    fireEvent.click(removeButton);

    await waitFor(() =>
      expect(screen.queryByTestId(`draft-item-${plDraftId}`)).not.toBeInTheDocument(),
    );
  });
});
