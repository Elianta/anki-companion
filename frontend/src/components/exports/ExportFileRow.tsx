import { Button } from '@/components/ui/button';
import type { ExportedFile } from '@/lib/db';

type ExportFileRowProps = {
  file: ExportedFile;
  exportDate: string;
};

function downloadCsv(file: ExportedFile) {
  const blob = new Blob([file.content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = file.fileName;
    link.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function ExportFileRow({ file, exportDate }: ExportFileRowProps) {
  return (
    <li>
      <Button
        type="button"
        variant="outline"
        className="border-line bg-surface text-ink hover:bg-highlight-light/60"
        onClick={() => downloadCsv(file)}
        aria-label={`Download ${file.noteType} CSV for export ${exportDate}`}
      >
        <DownloadIcon className="size-4" aria-hidden="true" />
        {file.noteType} CSV
      </Button>
    </li>
  );
}
import { DownloadIcon } from 'lucide-react';
