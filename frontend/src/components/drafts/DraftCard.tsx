import { RefreshCwIcon, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cardSelectionVariants } from '@/components/ui/card-selection';
import { ValueSelect } from '@/components/ValueSelect';
import type { DraftEntry, DraftNoteType } from '@/lib/db';
import { cn } from '@/lib/utils';
import { getNoteTypesForLanguage } from '@/services/draft-storage';
import type { LLMModel } from '@/stores/llm';
import { CardEditorButton } from './CardEditorButton';
import { DraftCheckbox } from './DraftCheckbox';

export type DraftCardActions = {
  onToggleSelection: (id: number) => void;
  onNoteTypeChange: (id: number, noteType: DraftNoteType) => Promise<void>;
  onGenerate: (id: number) => Promise<void>;
  onRemove: (id: number) => Promise<void>;
  onSave: () => Promise<void>;
};

type DraftCardProps = DraftCardActions & {
  draft: DraftEntry;
  selected: boolean;
  isGenerating: boolean;
  currentModel: LLMModel;
};

const actionClassName =
  'border-line/70 bg-surface text-text-secondary shadow-none hover:border-highlight/40 hover:bg-highlight-light hover:text-highlight-hover focus-visible:ring-highlight/25 disabled:bg-surface-subtle disabled:text-text-muted [&_svg]:size-4';

export function DraftCard({
  draft,
  selected,
  isGenerating,
  currentModel,
  onToggleSelection,
  onNoteTypeChange,
  onGenerate,
  onRemove,
  onSave,
}: DraftCardProps) {
  const { id } = draft;
  const noteTypes = getNoteTypesForLanguage(draft.language);

  return (
    <article
      aria-label={`Draft ${draft.term}`}
      data-test-id={`draft-item-${id}`}
      data-selected={selected}
      className={cn(
        'min-w-0 rounded-2xl border p-4 transition-[background-color,border-color,box-shadow] md:p-5',
        cardSelectionVariants({ selected }),
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <DraftCheckbox
          checked={selected}
          disabled={!draft.card || draft.exported || id === undefined}
          onCheckedChange={() => id !== undefined && onToggleSelection(id)}
          aria-label={`Select draft ${draft.term}`}
        />
        <ValueSelect
          values={noteTypes}
          value={draft.noteType}
          onValueChange={(value) => id !== undefined && void onNoteTypeChange(id, value)}
          disabled={draft.exported || noteTypes.length === 1}
          size="md"
          align="start"
          aria-label={`Note type for ${draft.term}`}
          className="w-fit min-w-0 border-line/70 px-3 text-sm shadow-none **:data-[slot=select-value]:min-w-0"
        />
        {draft.card && (
          <CardEditorButton
            draft={draft}
            onSave={onSave}
            disabled={draft.exported}
            className={actionClassName}
          />
        )}
        {(!draft.card || draft.card.model !== currentModel) && (
          <Button
            type="button"
            variant="outline"
            icon
            className={actionClassName}
            aria-label={draft.card ? 'Regenerate card' : 'Generate card'}
            data-test-id={`card-pending-${id}`}
            onClick={() => id !== undefined && void onGenerate(id)}
            disabled={draft.exported || isGenerating}
          >
            <RefreshCwIcon
              aria-hidden="true"
              className={cn('size-4', isGenerating && 'animate-spin motion-reduce:animate-none')}
            />
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          icon
          className={cn(
            actionClassName,
            'ml-auto hover:border-danger/30 hover:bg-danger/5 hover:text-danger',
          )}
          onClick={() => id !== undefined && void onRemove(id)}
          aria-label={`Delete draft ${draft.term}`}
        >
          <Trash2Icon aria-hidden="true" className="size-4" />
        </Button>
      </div>

      <dl className="mt-4 grid min-w-0 gap-4 pl-14 sm:grid-cols-2">
        <div className="min-w-0 space-y-1">
          <dt className="text-xs uppercase tracking-wide text-text-secondary">Term</dt>
          <dd className="wrap-break-word text-sm font-semibold text-ink">{draft.term}</dd>
        </div>
        <div className="min-w-0 space-y-1">
          <dt className="text-xs uppercase tracking-wide text-text-secondary">Translation</dt>
          <dd className="wrap-break-word text-sm text-ink">{draft.sense.translationRU}</dd>
        </div>
      </dl>
    </article>
  );
}
