import { ExportGroupCard } from '@/components/exports/ExportGroupCard';
import { useExports } from '@/components/exports/useExports';

export function ExportScreen() {
  const { exportGroups, draftWords, isLoading, error } = useExports();

  return (
    <section aria-labelledby="exports-heading" className="min-w-0 space-y-6">
      <header className="space-y-2">
        <h1
          id="exports-heading"
          className="text-[30px] leading-tight font-bold tracking-tight text-ink md:text-[34px]"
        >
          Export drafts
        </h1>
        <p className="text-sm text-text-secondary">Download CSV files from previous exports.</p>
      </header>

      {isLoading && (
        <p role="status" className="text-sm text-text-secondary">
          Loading exports…
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
      {!isLoading && !error && !exportGroups.length && (
        <p className="rounded-2xl border border-line/60 bg-surface/90 p-6 text-sm text-text-secondary">
          No exports yet.
        </p>
      )}
      <div className="space-y-3">
        {exportGroups.map((group) => (
          <ExportGroupCard
            key={group.id}
            group={group}
            words={
              group.words.length
                ? group.words
                : group.draftIds.map((id) => draftWords[id]).filter(Boolean)
            }
          />
        ))}
      </div>
    </section>
  );
}
