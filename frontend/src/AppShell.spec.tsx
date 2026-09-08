import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppShell } from './AppShell';
import { db } from '@/lib/db';
import { saveDraftFromSense, clearDrafts } from '@/services/draft-storage';

vi.mock('@/services/card-generator', () => ({
  generateCardPayload: vi.fn(async () => ({
    fields: { Word: 'test' },
    schemaName: 'mock',
    prompt: 'prompt',
    noteType: 'EN: Default',
    generatedAt: '2024-01-01T00:00:00.000Z',
  })),
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    ...rest
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { to?: string }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  Outlet: () => <div data-test-id="outlet">Outlet Content</div>,
  useRouterState: () => ({
    location: { pathname: '/' },
  }),
}));

describe('AppShell', () => {
  beforeEach(async () => {
    await clearDrafts();
  });

  it('does not display draft badges when draft count is 0', async () => {
    render(<AppShell />);

    expect(screen.queryByTestId('drafts-badge-mobile')).not.toBeInTheDocument();
    expect(screen.queryByTestId('drafts-badge-desktop')).not.toBeInTheDocument();
  });

  it('displays and updates badge count when drafts are added to the database', async () => {
    render(<AppShell />);

    expect(screen.queryByTestId('drafts-badge-mobile')).not.toBeInTheDocument();

    await saveDraftFromSense(
      {
        sense: { id: 'sense-1', translationRU: 'тест' },
        term: 'test',
        language: 'EN',
      },
      { backgroundGenerate: false },
    );

    await waitFor(() => {
      expect(screen.getByTestId('drafts-badge-mobile')).toHaveTextContent('1');
      expect(screen.getByTestId('drafts-badge-desktop')).toHaveTextContent('1');
    });

    await saveDraftFromSense(
      {
        sense: { id: 'sense-2', translationRU: 'тест 2' },
        term: 'test2',
        language: 'EN',
      },
      { backgroundGenerate: false },
    );

    await waitFor(() => {
      expect(screen.getByTestId('drafts-badge-mobile')).toHaveTextContent('2');
      expect(screen.getByTestId('drafts-badge-desktop')).toHaveTextContent('2');
    });
  });

  it('removes badge count when drafts are cleared or exported', async () => {
    await saveDraftFromSense(
      {
        sense: { id: 'sense-1', translationRU: 'тест' },
        term: 'test',
        language: 'EN',
      },
      { backgroundGenerate: false },
    );

    render(<AppShell />);

    await waitFor(() => {
      expect(screen.getByTestId('drafts-badge-mobile')).toHaveTextContent('1');
    });

    await db.drafts.clear();

    await waitFor(() => {
      expect(screen.queryByTestId('drafts-badge-mobile')).not.toBeInTheDocument();
      expect(screen.queryByTestId('drafts-badge-desktop')).not.toBeInTheDocument();
    });
  });
});
