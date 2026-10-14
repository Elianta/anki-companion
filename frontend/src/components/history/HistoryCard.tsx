import { RotateCcwIcon } from 'lucide-react';

import { DraftCheckbox } from '@/components/drafts/DraftCheckbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cardSelectionVariants } from '@/components/ui/card-selection';
import type { DraftEntry } from '@/lib/db';
import { cn } from '@/lib/utils';

type HistoryCardProps = {
  draft: DraftEntry;
  selected: boolean;
  disabled: boolean;
  restoring: boolean;
  onToggleSelection: (id: number) => void;
  onRestore: (id: number) => Promise<void>;
};

export function HistoryCard({
  draft,
  selected,
  disabled,
  restoring,
  onToggleSelection,
  onRestore,
}: HistoryCardProps) {
  const { id } = draft;

  return (
    <article
      aria-label={`Exported draft ${draft.term}`}
      className={cn(
        'grid min-w-0 grid-cols-[2.25rem_minmax(0,1fr)_2.25rem] items-center gap-x-3 gap-y-2 rounded-2xl border p-4 transition-[background-color,border-color,box-shadow] md:gap-x-5 md:p-5',
        cardSelectionVariants({ selected }),
      )}
    >
      <DraftCheckbox
        checked={selected}
        onCheckedChange={() => id !== undefined && onToggleSelection(id)}
        disabled={disabled || id === undefined}
        aria-label={`Select exported draft ${draft.term}`}
      />
      <Badge
        variant="secondary"
        aria-label={`Note type for ${draft.term}`}
        className="min-w-0 max-w-full whitespace-normal border-0 bg-line/50 px-3 py-1 text-sm font-normal text-text-secondary"
      >
        {draft.noteType.replace(': ', ' · ')}
      </Badge>
      <Button
        type="button"
        variant="outline"
        icon
        className="border-line/70 bg-surface text-ink shadow-xs hover:border-highlight/40 hover:bg-highlight-light disabled:bg-surface-subtle disabled:text-text-muted"
        aria-label={`Restore draft ${draft.term}`}
        aria-busy={restoring}
        onClick={() => id !== undefined && void onRestore(id)}
        disabled={disabled || id === undefined}
      >
        <RotateCcwIcon className="size-4" aria-hidden="true" />
      </Button>

      <dl className="col-start-2 col-end-4 grid min-w-0 grid-cols-2 gap-3">
        <div className="min-w-0 space-y-1">
          <dt className="text-xs uppercase tracking-wide text-text-secondary">Term</dt>
          <dd className="text-sm font-semibold wrap-anywhere text-ink">{draft.term}</dd>
        </div>
        <div className="min-w-0 space-y-1">
          <dt className="text-xs uppercase tracking-wide text-text-secondary">Translation</dt>
          <dd className="text-sm wrap-anywhere text-ink">{draft.sense.translationRU}</dd>
        </div>
      </dl>
    </article>
  );
}
