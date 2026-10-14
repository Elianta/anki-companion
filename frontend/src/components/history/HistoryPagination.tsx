import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type HistoryPaginationProps = {
  page: number;
  pageCount: number;
  disabled: boolean;
  onPageChange: (page: number) => void;
};

export function HistoryPagination({
  page,
  pageCount,
  disabled,
  onPageChange,
}: HistoryPaginationProps) {
  if (pageCount < 2) return null;

  const start = Math.max(1, Math.min(page - 2, pageCount - 4));
  const end = Math.min(pageCount, start + 4);
  const pages: (number | string)[] = [];
  if (start > 1) pages.push(1);
  if (start > 2) pages.push('before');
  for (let value = start; value <= end; value += 1) pages.push(value);
  if (end < pageCount - 1) pages.push('after');
  if (end < pageCount) pages.push(pageCount);

  return (
    <nav
      aria-label="History pagination"
      className="flex min-w-0 items-center justify-center sm:gap-2"
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        smSize="lg"
        icon
        aria-label="Previous page"
        disabled={disabled || page === 1}
        onClick={() => onPageChange(page - 1)}
        className="min-w-0 shrink text-text-secondary disabled:bg-transparent disabled:text-text-secondary sm:shrink-0"
      >
        <ChevronLeftIcon className="size-5" aria-hidden="true" />
      </Button>
      {pages.map((value) =>
        typeof value === 'number' ? (
          <Button
            key={value}
            type="button"
            variant="ghost"
            size="sm"
            smSize="lg"
            icon
            disabled={disabled}
            aria-label={`Page ${value}`}
            aria-current={value === page ? 'page' : undefined}
            onClick={() => onPageChange(value)}
            className={cn(
              'min-w-0 shrink text-text-secondary sm:shrink-0',
              value === page && 'bg-highlight/15 font-semibold text-highlight',
            )}
          >
            {value}
          </Button>
        ) : (
          <span
            key={value}
            aria-hidden="true"
            className="w-4 text-center text-sm text-text-secondary"
          >
            …
          </span>
        ),
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        smSize="lg"
        icon
        aria-label="Next page"
        disabled={disabled || page === pageCount}
        onClick={() => onPageChange(page + 1)}
        className="min-w-0 shrink text-text-secondary disabled:bg-transparent disabled:text-text-secondary sm:shrink-0"
      >
        <ChevronRightIcon className="size-5" aria-hidden="true" />
      </Button>
    </nav>
  );
}
