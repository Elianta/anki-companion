import type { Sense } from '@/lib/llm';
import { cn } from '@/lib/utils';

const FILLED_BARS = { low: 1, medium: 2, high: 3 };
const BAR_COLORS = ['bg-highlight/45', 'bg-highlight/70', 'bg-highlight'] as const;

export function UsageFrequency({ level }: { level: Sense['usageLevel'] }) {
  if (!level) return null;

  return (
    <span
      role="img"
      aria-label={`Usage frequency: ${level}`}
      title={`Usage frequency: ${level}`}
      className="inline-flex shrink-0 items-end gap-1"
    >
      {BAR_COLORS.map((color, index) => (
        <span
          key={index}
          aria-hidden="true"
          style={{ height: `${12 + index * 2}px` }}
          className={cn(
            'w-2.5 rounded-[3px]',
            index < FILLED_BARS[level] ? color : 'bg-line group-aria-selected:bg-highlight/25',
          )}
        />
      ))}
    </span>
  );
}
