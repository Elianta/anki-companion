import { DraftExportPanel } from '@/components/drafts/DraftExportPanel';
import { DraftList } from '@/components/drafts/DraftList';
import { DraftSelectionToolbar } from '@/components/drafts/DraftSelectionToolbar';
import { useDrafts } from '@/components/drafts/useDrafts';

export function DraftScreen() {
  const {
    drafts,
    currentModel,
    isLoading,
    error,
    selectedIds,
    generatingIds,
    isExporting,
    selectedCount,
    isAllSelected,
    readyCount,
    toggleAll,
    toggleDraftSelection,
    handleNoteTypeChange,
    triggerCardGeneration,
    handleRemove,
    refreshDraft,
    handleExport,
  } = useDrafts();

  return (
    <section aria-labelledby="drafts-heading" className="flex min-w-0 flex-col gap-6">
      <header className="space-y-2">
        <h1
          id="drafts-heading"
          className="text-[30px] leading-tight font-bold tracking-tight text-ink md:text-[34px]"
        >
          Draft cards
        </h1>
        <p className="text-lg leading-relaxed text-text-secondary">
          Manage saved senses before exporting.
        </p>
      </header>

      {isLoading && (
        <p role="status" className="text-sm text-text-secondary">
          Loading drafts…
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
          No drafts yet.
        </p>
      )}
      {!!drafts.length && (
        <div className="space-y-3">
          <DraftSelectionToolbar
            selectedCount={selectedCount}
            isAllSelected={isAllSelected}
            readyCount={readyCount}
            onToggleAll={toggleAll}
          />
          <DraftList
            drafts={drafts}
            selectedIds={selectedIds}
            generatingIds={generatingIds}
            currentModel={currentModel}
            onToggleSelection={toggleDraftSelection}
            onNoteTypeChange={handleNoteTypeChange}
            onGenerate={triggerCardGeneration}
            onRemove={handleRemove}
            onSave={refreshDraft}
          />
        </div>
      )}
      <DraftExportPanel
        selectedCount={selectedCount}
        isExporting={isExporting}
        onExport={handleExport}
      />
    </section>
  );
}
