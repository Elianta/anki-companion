import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import type { DraftEntry, DraftNoteType } from '@/lib/db';
import {
  fetchDrafts,
  generateCardForDraft,
  removeDraft,
  updateDraftNoteType,
} from '@/services/draft-storage';
import { showRequestError } from '@/services/notifications';
import { createExportGroupFromDrafts } from '@/services/export-storage';
import { useDraftCountStore } from '@/stores/drafts';
import { useLLMStore } from '@/stores/llm';

export function useDrafts() {
  const navigate = useNavigate({ from: '/draft' });
  const currentModel = useLLMStore((state) => state.llmModel);
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
      useDraftCountStore
        .getState()
        .setCount(storedDrafts.filter((draft) => !draft.exported).length);
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
      showRequestError(err, 'Failed to generate card.');
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
      showRequestError(err, 'Failed to update note type.');
    }
  };

  const handleRemove = async (draftId: number) => {
    const previous = drafts;
    setDrafts((prev) => prev.filter((draft) => draft.id !== draftId));
    try {
      await removeDraft(draftId);
    } catch (err) {
      console.warn('Failed to remove draft', err);
      setDrafts(previous);
    }
  };

  const displayedDrafts = drafts.filter((draft) => !draft.exported);
  const readyDrafts = displayedDrafts.filter((draft) => draft.card);
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

    setIsExporting(true);
    try {
      await createExportGroupFromDrafts(exportIds);
      setSelectedIds(new Set());
      await loadDrafts();
      await navigate({ to: '/export' });
    } catch (err) {
      console.warn('Failed to export drafts', err);
      const message =
        err instanceof Error ? err.message : 'Failed to export selected drafts. Try again.';
      toast.error(message);
    } finally {
      setIsExporting(false);
    }
  };

  return {
    drafts: displayedDrafts,
    currentModel,
    isLoading,
    error,
    selectedIds,
    generatingIds,
    isExporting,
    selectedCount,
    isAllSelected,
    readyCount: readyDrafts.length,
    toggleAll,
    toggleDraftSelection,
    handleNoteTypeChange,
    triggerCardGeneration,
    handleRemove,
    refreshDraft,
    handleExport,
  };
}
