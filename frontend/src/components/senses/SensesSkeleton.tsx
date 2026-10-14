export function SensesSkeleton() {
  return (
    <section aria-label="Loading senses" aria-busy="true" className="mt-6 md:mt-8">
      <div aria-hidden="true" className="space-y-4 motion-safe:animate-pulse">
        {[0, 1].map((index) => (
          <SenseCardSkeleton key={index} />
        ))}
      </div>
    </section>
  );
}

function SenseCardSkeleton() {
  return (
    <div className="rounded-xl border border-line/80 bg-surface/90 p-4 shadow-xs sm:p-5">
      <div className="flex items-center gap-3">
        <div className="h-6 w-24 rounded-md bg-line/70" />
        <div className="h-5 w-20 rounded-full bg-line/50" />
        <div className="ml-auto flex shrink-0 items-end gap-1">
          <span className="h-3 w-2.5 rounded-[3px] bg-highlight/20" />
          <span className="h-3.5 w-2.5 rounded-[3px] bg-highlight/20" />
          <span className="h-4 w-2.5 rounded-[3px] bg-highlight/20" />
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-4 w-4/5 rounded-md bg-line/60" />
        <div className="h-4 w-3/5 rounded-md bg-line/60 sm:hidden" />
      </div>
      <div className="mt-3 space-y-2 rounded-lg bg-surface-subtle p-3 sm:mt-4">
        <div className="h-4 w-full rounded-md bg-line/60" />
        <div className="h-4 w-2/3 rounded-md bg-line/60 sm:hidden" />
      </div>
    </div>
  );
}
