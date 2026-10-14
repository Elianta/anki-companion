import { useId, useState } from 'react';
import { ChevronDownIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { ExportGroup } from '@/lib/db';
import { cn } from '@/lib/utils';
import { ExportFileRow } from './ExportFileRow';
import { ExportWords } from './ExportWords';

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

type ExportGroupCardProps = {
  group: ExportGroup;
  words: string[];
};

export function ExportGroupCard({ group, words }: ExportGroupCardProps) {
  const [expanded, setExpanded] = useState(false);
  const wordsId = useId();
  const headingId = useId();
  const date = new Date(group.createdAt);
  const exportDate = Number.isNaN(date.getTime()) ? group.createdAt : dateFormatter.format(date);
  const wordCount = group.draftIds.length;
  const toggleWords = () => setExpanded((value) => !value);

  return (
    <article
      aria-labelledby={headingId}
      className="min-w-0 rounded-2xl border border-line/60 bg-surface/90 p-4 text-ink shadow-xs sm:p-5"
    >
      <header>
        <div className="min-w-0 space-y-1">
          <h2 id={headingId} className="text-sm font-semibold wrap-break-word">
            <time dateTime={group.createdAt}>{exportDate}</time>
          </h2>
        </div>
      </header>

      <Button
        type="button"
        variant="ghost"
        onClick={toggleWords}
        aria-expanded={expanded}
        aria-controls={wordsId}
        className="mt-3 w-full justify-between gap-3 px-0 text-ink hover:bg-transparent"
      >
        <span>Words ({wordCount})</span>
        <ChevronDownIcon className={cn('size-4 text-text-secondary', expanded && 'rotate-180')} />
      </Button>
      <div id={wordsId} hidden={!expanded}>
        {expanded && <ExportWords words={words} />}
      </div>
      <ul aria-label="Export files" className="mt-4 flex flex-wrap gap-2">
        {group.files.map((file) => (
          <ExportFileRow
            key={`${file.noteType}-${file.fileName}`}
            file={file}
            exportDate={exportDate}
          />
        ))}
      </ul>
    </article>
  );
}
