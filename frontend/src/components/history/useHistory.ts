import { useEffect, useState } from 'react';

import type { DraftEntry } from '@/lib/db';
import { fetchDrafts, removeDraft, returnDraftToQueue } from '@/services/draft-storage';

const PAGE_SIZE = 12;

export function useHistory() {
  const [drafts, setDrafts] = useState<DraftEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [requestedPage, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    async function loadDrafts() {
      try {
        const storedDrafts = await fetchDrafts();
        if (active) setDrafts(storedDrafts.filter((draft) => draft.exported));
      } catch (err) {
        if (!active) return;
        console.warn('Failed to load history', err);
        setError('Failed to load history.');
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void loadDrafts();
    return () => {
      active = false;
    };
  }, []);

  const selectableIds = drafts.flatMap((draft) => (draft.id === undefined ? [] : [draft.id]));
  const selectedCount = selectedIds.size;
  const isAllSelected = selectableIds.length > 0 && selectedCount === selectableIds.length;
  const isBusy = isDeleting || restoringId !== null;
  const pageCount = Math.max(1, Math.ceil(drafts.length / PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  const visibleDrafts = drafts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleDraftSelection = (id: number) => {
    if (isBusy) return;
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (!isBusy) setSelectedIds(isAllSelected ? new Set() : new Set(selectableIds));
  };

  const removeFromList = (ids: Set<number>) => {
    setDrafts((previous) =>
      previous.filter((draft) => draft.id === undefined || !ids.has(draft.id)),
    );
    setSelectedIds((previous) => new Set([...previous].filter((id) => !ids.has(id))));
  };

  const handleDeleteSelected = async () => {
    if (!selectedCount || isBusy) return;
    setIsDeleting(true);
    setError(null);
    try {
      const ids = [...selectedIds];
      const results = await Promise.allSettled(ids.map((id) => removeDraft(id)));
      removeFromList(new Set(ids.filter((_, index) => results[index].status === 'fulfilled')));
      const failures = results.filter((result) => result.status === 'rejected');
      if (failures.length) {
        console.warn('Failed to delete drafts', failures);
        setError('Failed to delete selected drafts.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReturnToDrafts = async (id: number) => {
    if (isBusy) return;
    setRestoringId(id);
    setError(null);
    try {
      await returnDraftToQueue(id);
      removeFromList(new Set([id]));
    } catch (err) {
      console.warn('Failed to restore draft', err);
      setError('Failed to restore draft.');
    } finally {
      setRestoringId(null);
    }
  };

  return {
    drafts,
    visibleDrafts,
    isLoading,
    error,
    selectedIds,
    selectedCount,
    isAllSelected,
    isBusy,
    isDeleting,
    restoringId,
    page,
    pageCount,
    setPage,
    toggleDraftSelection,
    toggleAll,
    handleDeleteSelected,
    handleReturnToDrafts,
  };
}
