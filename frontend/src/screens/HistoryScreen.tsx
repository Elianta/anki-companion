import { HistoryCard } from '@/components/history/HistoryCard';
import { HistoryDeletePanel } from '@/components/history/HistoryDeletePanel';
import { HistoryPagination } from '@/components/history/HistoryPagination';
import { HistorySelectionToolbar } from '@/components/history/HistorySelectionToolbar';
import { useHistory } from '@/components/history/useHistory';

export function HistoryScreen() {
  const {
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
  } = useHistory();

  return (
    <section aria-labelledby="history-heading" className="flex min-w-0 flex-col gap-6">
      <header className="space-y-2">
        <h1
          id="history-heading"
          className="text-[30px] leading-tight font-bold tracking-tight text-ink md:text-[34px]"
        >
          History
        </h1>
        <p className="text-sm text-text-secondary">Previously exported drafts.</p>
      </header>
      {isLoading && (
        <p role="status" className="text-sm text-text-secondary">
          Loading history…
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-2xl border border-danger/20 bg-surface/90 p-6 text-sm text-danger"
        >
          {error}
        </p>
      )}
      {!isLoading && !error && !drafts.length && (
        <p className="rounded-2xl border border-line/60 bg-surface/90 p-6 text-sm text-text-secondary">
          No exported drafts yet.
        </p>
      )}
      {!!drafts.length && (
        <div className="space-y-3">
          <HistorySelectionToolbar
            count={drafts.length}
            selectedCount={selectedCount}
            isAllSelected={isAllSelected}
            disabled={isBusy}
            onToggleAll={toggleAll}
          />
          <div className="grid min-w-0 gap-3 md:grid-cols-2">
            {visibleDrafts.map((draft) => (
              <HistoryCard
                key={draft.id}
                draft={draft}
                selected={draft.id !== undefined && selectedIds.has(draft.id)}
                disabled={isBusy}
                restoring={draft.id === restoringId}
                onToggleSelection={toggleDraftSelection}
                onRestore={handleReturnToDrafts}
              />
            ))}
          </div>
          <HistoryPagination
            page={page}
            pageCount={pageCount}
            disabled={isBusy}
            onPageChange={setPage}
          />
        </div>
      )}
      <HistoryDeletePanel
        selectedCount={selectedCount}
        isDeleting={isDeleting}
        disabled={isBusy || isLoading}
        onDelete={handleDeleteSelected}
      />
    </section>
  );
}
