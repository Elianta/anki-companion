import type { KeyboardEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { cardSelectionVariants } from '@/components/ui/card-selection';
import type { Sense } from '@/lib/llm';
import { cn } from '@/lib/utils';
import { UsageFrequency } from './UsageFrequency';

type SenseCardProps = {
  sense: Sense;
  selected: boolean;
  onSelect: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
};

export function SenseCard({ sense, selected, onSelect, onKeyDown }: SenseCardProps) {
  return (
    <article
      role="option"
      aria-label={sense.translationRU}
      aria-selected={selected}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      tabIndex={selected ? 0 : -1}
      className={cn(
        'group cursor-pointer rounded-xl border p-4 text-ink transition-[background-color,border-color,box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-highlight focus-visible:ring-offset-2 sm:p-5',
        cardSelectionVariants({ selected }),
        !selected && 'hover:border-highlight/50 hover:bg-surface',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2">
          <h3 className="min-w-0 text-lg font-semibold wrap-break-word">{sense.translationRU}</h3>
          {sense.partOfSpeech && (
            <Badge
              variant="secondary"
              className="max-w-full whitespace-normal border-0 bg-line/50 px-3 text-xs font-medium lowercase"
            >
              {sense.partOfSpeech}
            </Badge>
          )}
        </div>
        <div className="pt-1">
          <UsageFrequency level={sense.usageLevel} />
        </div>
      </div>
      {sense.notes && (
        <p className="mt-2 text-sm wrap-break-word text-text-secondary">{sense.notes}</p>
      )}
      {!sense.usageLevel && sense.frequencyNotes && (
        <p className="mt-2 text-sm text-text-secondary">{sense.frequencyNotes}</p>
      )}
      {!!sense.examples?.length && (
        <ul className="mt-3 space-y-2 text-sm sm:mt-4">
          {sense.examples.map((example, index) => (
            <li
              key={`${index}-${example}`}
              className={cn(
                'rounded-lg p-3 wrap-break-word',
                selected ? 'bg-surface/75' : 'bg-surface-subtle',
              )}
            >
              {example}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
