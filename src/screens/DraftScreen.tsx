import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCwIcon } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DraftEntry, DraftNoteType } from '@/lib/db';
import {
  fetchDrafts,
  generateCardForDraft,
  getNoteTypesForLanguage,
  removeDraft,
  updateDraftNoteType,
} from '@/services/draft-storage';
import { createExportGroupFromDrafts } from '@/services/export-storage';

export function DraftScreen() {
  const navigate = useNavigate({ from: '/draft' });
  const [drafts, setDrafts] = useState<DraftEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingIds, setGeneratingIds] = useState<Set<number>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  const loadDrafts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const storedDrafts = await fetchDrafts();
      setDrafts(storedDrafts);
      setSelectedIds((prev) => {
        const allowed = new Set(
          storedDrafts
            .filter((draft) => draft.card && !draft.exported)
            .map((draft) => draft.id!) as number[],
        );
        const next = new Set<number>();
        prev.forEach((id) => {
          if (allowed.has(id)) {
            next.add(id);
          }
        });
        return next;
      });
    } catch (err) {
      console.warn('Failed to load drafts', err);
      setError('Failed to load drafts. Refresh the page.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  const refreshDraft = async () => {
    const storedDrafts = await fetchDrafts();
    setDrafts(storedDrafts);
  };

  const setGenerating = (draftId: number, active: boolean) => {
    setGeneratingIds((prev) => {
      const next = new Set(prev);
      if (active) {
        next.add(draftId);
      } else {
        next.delete(draftId);
      }
      return next;
    });
  };

  const triggerCardGeneration = async (draftId: number) => {
    setGenerating(draftId, true);
    try {
      await generateCardForDraft(draftId);
      await refreshDraft();
    } catch (err) {
      console.warn('Failed to generate card', err);
      setError('Failed to generate card.');
    } finally {
      setGenerating(draftId, false);
    }
  };

  const handleNoteTypeChange = async (draftId: number, noteType: DraftNoteType) => {
    setDrafts((prev) =>
      prev.map((draft) => (draft.id === draftId ? { ...draft, noteType, card: null } : draft)),
    );
    try {
      await updateDraftNoteType(draftId, noteType);
      await triggerCardGeneration(draftId);
    } catch (err) {
      console.warn('Failed to update note type', err);
      setError('Failed to update note type.');
    }
  };

  const handleRemove = async (draftId: number) => {
    const previous = drafts;
    setDrafts((prev) => prev.filter((draft) => draft.id !== draftId));
    try {
      await removeDraft(draftId);
    } catch (err) {
      console.warn('Failed to remove draft', err);
      setError('Failed to delete draft.');
      setDrafts(previous);
    }
  };

  const hasDrafts = drafts.length > 0;
  const readyDrafts = useMemo(
    () => drafts.filter((draft) => draft.card && !draft.exported),
    [drafts],
  );
  const selectedCount = readyDrafts.filter((draft) => draft.id && selectedIds.has(draft.id)).length;
  const isAllSelected = readyDrafts.length > 0 && selectedCount === readyDrafts.length;

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
    const all = readyDrafts.map((draft) => draft.id!) as number[];
    setSelectedIds(new Set(all));
  };

  const handleExport = async () => {
    const exportIds = readyDrafts
      .filter((draft) => draft.id && selectedIds.has(draft.id))
      .map((draft) => draft.id!) as number[];

    if (!exportIds.length) {
      setError('Select at least one ready card to export.');
      return;
    }

    setIsExporting(true);
    setError(null);
    try {
      await createExportGroupFromDrafts(exportIds);
      setSelectedIds(new Set());
      await loadDrafts();
      await navigate({ to: '/export' });
    } catch (err) {
      console.warn('Failed to export drafts', err);
      const message =
        err instanceof Error ? err.message : 'Failed to export selected drafts. Try again.';
      setError(message);
      toast.error(message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <section className="space-y-6">
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Draft cards</CardTitle>
          <CardDescription>Manage saved senses before exporting.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading && <p className="text-sm text-muted-foreground">Loading drafts…</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!isLoading && !hasDrafts && (
            <p className="text-sm text-muted-foreground">
              No drafts yet. Open the "Senses" tab, pick a sense, and save it.
            </p>
          )}

          {hasDrafts ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 accent-primary"
                  data-test-id="select-all-drafts"
                  disabled={!readyDrafts.length}
                />
                <p className="text-sm text-slate-800">
                  Select all ready cards ({readyDrafts.length} available)
                </p>
                <Badge variant="outline">Selected: {selectedCount}</Badge>
              </div>

              <div className="grid gap-4">
                {drafts.map((draft) => {
                  const noteTypes = getNoteTypesForLanguage(draft.language);
                  const isExported = !!draft.exported;
                  const isReady = !!draft.card;
                  const isSelected = !!draft.id && selectedIds.has(draft.id);
                  return (
                    <div
                      key={draft.id}
                      data-test-id={`draft-item-${draft.id}`}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-xs"
                    >
                      <div className="flex flex-wrap items-start gap-3">
                        <div className="mt-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={!isReady || isExported}
                            onChange={() => draft.id && toggleDraftSelection(draft.id)}
                            className="h-4 w-4 accent-primary"
                            data-test-id={`select-draft-${draft.id}`}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="uppercase">
                              {draft.language}
                            </Badge>
                            {draft.sense.partOfSpeech ? (
                              <Badge variant="outline" className="uppercase">
                                {draft.sense.partOfSpeech}
                              </Badge>
                            ) : null}
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                              Term
                            </p>
                            <p className="text-lg font-semibold text-slate-900">{draft.term}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {draft.card ? (
                            <Badge variant="default">Card ready</Badge>
                          ) : generatingIds.has(draft.id ?? -1) ? (
                            <Badge variant="outline">Generating…</Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="flex items-center gap-2 pr-1"
                              data-test-id={`card-pending-${draft.id}`}
                            >
                              Card pending
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-4 w-4 text-slate-700"
                                aria-label="Regenerate card"
                                onClick={() => draft.id && triggerCardGeneration(draft.id)}
                              >
                                <RefreshCwIcon className="h-4 w-4" />
                              </Button>
                            </Badge>
                          )}
                          {isExported ? (
                            <Badge variant="outline" data-test-id={`exported-badge-${draft.id}`}>
                              Exported
                            </Badge>
                          ) : null}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-auto"
                          onClick={() => draft.id && handleRemove(draft.id)}
                          data-test-id={`remove-draft-${draft.id}`}
                        >
                          Delete
                        </Button>
                      </div>

                      <div className="mt-3 grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Translation
                          </p>
                          <p className="text-sm text-slate-900">{draft.sense.translationRU}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Sense note
                          </p>
                          <p className="text-sm text-slate-900">{draft.sense.notes ?? '—'}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <Label className="text-sm text-slate-700">Note Type</Label>
                        {noteTypes.length > 1 ? (
                          <Select
                            value={draft.noteType}
                            onValueChange={(value) =>
                              draft.id && handleNoteTypeChange(draft.id, value as DraftNoteType)
                            }
                            disabled={isExported}
                          >
                            <SelectTrigger data-test-id={`note-type-${draft.id}`} size="sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {noteTypes.map((noteType) => (
                                <SelectItem key={noteType} value={noteType}>
                                  {noteType}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="secondary">{draft.noteType}</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </CardContent>
        <CardContent className="border-t border-slate-200 pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={handleExport}
              disabled={isExporting || selectedCount === 0}
              data-test-id="export-button"
            >
              {isExporting ? 'Exporting…' : 'Export selected'}
            </Button>
            <p className="text-sm text-muted-foreground">
              Exported cards appear on the Export page with CSV download links.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
