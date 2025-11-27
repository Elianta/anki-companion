import { useCallback, useEffect, useMemo, useState } from 'react';
import { RotateCcwIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import type { DraftEntry } from '@/lib/db';
import { fetchDrafts, removeDraft, returnDraftToQueue } from '@/services/draft-storage';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function HistoryScreen() {
  const [drafts, setDrafts] = useState<DraftEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const loadDrafts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const storedDrafts = await fetchDrafts();
      setDrafts(storedDrafts.filter((draft) => draft.exported));
      setSelectedIds(new Set());
    } catch (err) {
      console.warn('Failed to load history', err);
      setError('Failed to load history.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  const hasDrafts = drafts.length > 0;
  const isAllSelected = useMemo(
    () => drafts.length > 0 && selectedIds.size === drafts.length,
    [drafts.length, selectedIds.size],
  );

  const toggleDraftSelection = (draftId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(draftId)) {
        next.delete(draftId);
      } else {
        next.add(draftId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
      return;
    }
    const all = drafts.map((draft) => draft.id!) as number[];
    setSelectedIds(new Set(all));
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.size) return;
    setIsDeleting(true);
    const ids = Array.from(selectedIds);
    try {
      await Promise.all(ids.map((id) => removeDraft(id)));
      await loadDrafts();
    } catch (err) {
      console.warn('Failed to delete drafts', err);
      setError('Failed to delete selected drafts.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReturnToDrafts = async (id: number) => {
    try {
      await returnDraftToQueue(id);
      await loadDrafts();
    } catch (err) {
      console.warn('Failed to restore draft', err);
      setError('Failed to restore draft.');
    }
  };

  return (
    <section className="space-y-6">
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>History</CardTitle>
          <CardDescription>Previously exported drafts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading && <p className="text-sm text-muted-foreground">Loading history…</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!isLoading && !hasDrafts && (
            <p className="text-sm text-muted-foreground">No exported drafts yet.</p>
          )}

          {hasDrafts ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={toggleAll}
                  className="h-9 w-9"
                  data-test-id="select-all-history"
                  disabled={!drafts.length}
                />
                <p className="text-sm text-slate-800">Select all ({drafts.length} items)</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteSelected}
                  disabled={!selectedIds.size || isDeleting}
                  className="ml-auto"
                  data-test-id="delete-selected-history"
                >
                  {isDeleting ? 'Deleting…' : 'Delete selected'}
                </Button>
              </div>

              <div className="grid gap-4">
                {drafts.map((draft) => {
                  console.log(draft);
                  const isSelected = !!draft.id && selectedIds.has(draft.id);
                  return (
                    <div
                      key={draft.id}
                      data-test-id={`history-item-${draft.id}`}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-xs"
                    >
                      <div className="flex flex-wrap items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => draft.id && toggleDraftSelection(draft.id)}
                          className="h-9 w-9"
                          data-test-id={`select-history-${draft.id}`}
                        />
                        <div className="flex items-center gap-2">
                          <Select value={draft.noteType} disabled>
                            <SelectTrigger data-test-id={`note-type-${draft.id}`} size="default">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={draft.noteType}>{draft.noteType}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="ml-auto text-slate-700"
                          aria-label="Restore draft"
                          onClick={() => draft.id && handleReturnToDrafts(draft.id)}
                          data-test-id={`restore-draft-${draft.id}`}
                        >
                          <RotateCcwIcon className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="mt-4 pl-14 grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Term
                          </p>
                          <p className="text-sm font-semibold text-slate-900">{draft.term}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Translation
                          </p>
                          <p className="text-sm text-slate-900">{draft.sense.translationRU}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
