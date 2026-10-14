import { Badge } from '@/components/ui/badge';

export function ExportWords({ words }: { words: string[] }) {
  return (
    <ul aria-label="Exported words" className="flex flex-wrap gap-2 pt-2">
      {words.map((word, index) => (
        <li key={`${index}-${word}`} className="max-w-full">
          <Badge
            variant="secondary"
            className="max-w-full whitespace-normal border-0 bg-line/40 px-4 py-2 text-xs font-normal wrap-anywhere text-ink"
          >
            {word}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
