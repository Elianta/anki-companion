import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { HistoryPagination } from './HistoryPagination';

describe('HistoryPagination', () => {
  it.each([
    { page: 1, pageCount: 25, pages: [1, 2, 3, 4, 5, 25], gaps: 1 },
    { page: 13, pageCount: 25, pages: [1, 11, 12, 13, 14, 15, 25], gaps: 2 },
    { page: 25, pageCount: 25, pages: [1, 21, 22, 23, 24, 25], gaps: 1 },
    { page: 3, pageCount: 5, pages: [1, 2, 3, 4, 5], gaps: 0 },
  ])('shows the page range around page $page of $pageCount', ({ page, pageCount, pages, gaps }) => {
    render(
      <HistoryPagination
        page={page}
        pageCount={pageCount}
        disabled={false}
        onPageChange={vi.fn()}
      />,
    );
    const navigation = within(screen.getByRole('navigation', { name: 'History pagination' }));
    expect(
      navigation
        .getAllByRole('button', { name: /^Page / })
        .map((button) => Number(button.textContent)),
    ).toEqual(pages);
    expect(navigation.queryAllByText('…')).toHaveLength(gaps);
    expect(navigation.getByRole('button', { name: `Page ${page}` })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(navigation.getByRole('button', { name: 'Previous page' })).toHaveProperty(
      'disabled',
      page === 1,
    );
    expect(navigation.getByRole('button', { name: 'Next page' })).toHaveProperty(
      'disabled',
      page === pageCount,
    );
  });

  it('allows jumping to a numbered page', async () => {
    const onPageChange = vi.fn();
    render(
      <HistoryPagination page={1} pageCount={25} disabled={false} onPageChange={onPageChange} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Page 5' }));
    expect(onPageChange).toHaveBeenCalledWith(5);
  });
});
