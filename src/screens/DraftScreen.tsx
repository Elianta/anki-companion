import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCwIcon, Trash2Icon } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { DraftEntry, DraftNoteType } from '@/lib/db';
import {
  fetchDrafts,
  generateCardForDraft,
  getNoteTypesForLanguage,
  removeDraft,
  updateDraftNoteType,
} from '@/services/draft-storage';
import { createExportGroupFromDrafts } from '@/services/export-storage';
import { CardEditorButton } from '@/components/drafts/CardEditorButton';

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

          {hasDrafts && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={toggleAll}
                  className="h-9 w-9"
                  data-test-id="select-all-drafts"
                  disabled={!readyDrafts.length}
                />
                <p className="text-sm text-slate-800">Select all ready cards</p>
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
                      <div className="flex flex-wrap items-start gap-2">
                        <Checkbox
                          checked={isSelected}
                          disabled={!isReady || isExported}
                          onCheckedChange={() => draft.id && toggleDraftSelection(draft.id)}
                          className="h-9 w-9"
                          data-test-id={`select-draft-${draft.id}`}
                        />
                        <div className="flex items-center gap-2">
                          <Select
                            value={draft.noteType}
                            onValueChange={(value) =>
                              draft.id && handleNoteTypeChange(draft.id, value as DraftNoteType)
                            }
                            disabled={isExported || noteTypes.length === 1}
                          >
                            <SelectTrigger data-test-id={`note-type-${draft.id}`} size="default">
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
                          {draft.card ? (
                            <CardEditorButton
                              draft={draft}
                              onSave={refreshDraft}
                              disabled={isExported}
                            />
                          ) : (
                            <div className="relative">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="text-slate-700"
                                aria-label="Generate card"
                                data-test-id={`card-pending-${draft.id}`}
                                onClick={() => draft.id && triggerCardGeneration(draft.id)}
                                disabled={generatingIds.has(draft.id ?? -1)}
                              >
                                <RefreshCwIcon
                                  className={cn(
                                    'h-4 w-4',
                                    generatingIds.has(draft.id ?? -1) && 'animate-spin',
                                  )}
                                />
                              </Button>
                              <span className="pointer-events-none absolute inset-0 rounded-md bg-slate-200/70 animate-pulse" />
                            </div>
                          )}
                        </div>
                        {/* {isExported ? (
                          <Badge variant="outline" data-test-id={`exported-badge-${draft.id}`}>
                            Exported
                          </Badge>
                        ) : null} */}
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="ml-auto text-slate-600"
                          onClick={() => draft.id && handleRemove(draft.id)}
                          data-test-id={`remove-draft-${draft.id}`}
                          aria-label="Delete draft"
                        >
                          <Trash2Icon className="h-4 w-4" />
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
          )}
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
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
