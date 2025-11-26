import { useCallback, useEffect, useState } from 'react';
import { DownloadIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ExportGroup } from '@/lib/db';
import { fetchDrafts } from '@/services/draft-storage';
import { fetchExportGroups } from '@/services/export-storage';

export function ExportScreen() {
  const [exportGroups, setExportGroups] = useState<ExportGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draftWords, setDraftWords] = useState<Record<number, string>>({});

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [loadedDrafts, groups] = await Promise.all([fetchDrafts(), fetchExportGroups()]);
      const wordMap = loadedDrafts.reduce<Record<number, string>>((acc, draft) => {
        if (draft.id) {
          acc[draft.id] = draft.term;
        }
        return acc;
      }, {});
      setDraftWords(wordMap);
      setExportGroups(groups);
    } catch (err) {
      console.warn('Failed to load export data', err);
      setError('Failed to load export data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDownload = (file: ExportGroup['files'][number]) => {
    const blob = new Blob([file.content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toISOString();
    } catch {
      return timestamp;
    }
  };

  return (
    <section className="space-y-6">
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Export drafts</CardTitle>
          <CardDescription>Download CSV files from previous exports.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && <p className="text-sm text-muted-foreground">Loading exports…</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!isLoading && !exportGroups.length ? (
            <p className="text-sm text-muted-foreground">No exports yet.</p>
          ) : (
            exportGroups.map((group) => (
              <div
                key={group.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-xs"
                data-test-id={`export-group-${group.id}`}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm font-semibold text-slate-900">
                    Exported {formatTimestamp(group.createdAt)}
                  </p>
                  <Badge variant="secondary">Drafts: {group.draftIds.length}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(group.words.length
                    ? group.words
                    : group.draftIds.map((id) => draftWords[id]).filter(Boolean)
                  ).map((word) => (
                    <Badge key={`${group.id}-${word}`} variant="secondary">
                      {word}
                    </Badge>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {group.files.map((file) => (
                    <Button
                      key={`${group.id}-${file.noteType}-${file.fileName}`}
                      type="button"
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => handleDownload(file)}
                      data-test-id={`download-${group.id}-${file.noteType}`}
                    >
                      <DownloadIcon className="h-4 w-4" />
                      {file.noteType} CSV
                    </Button>
                  ))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}
