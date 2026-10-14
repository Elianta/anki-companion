export function SearchStatus({ term }: { term: string }) {
  return (
    <div
      role="status"
      aria-atomic="true"
      className="mx-auto mt-6 flex w-full max-w-[800px] items-center gap-4 md:mt-8"
    >
      <span
        aria-hidden="true"
        className="size-10 shrink-0 animate-spin rounded-full border-[3px] border-highlight/20 border-t-highlight border-l-highlight motion-reduce:animate-none"
      />
      <div className="min-w-0">
        <p className="text-base font-semibold break-words text-ink">Searching for “{term}”…</p>
        <p className="mt-1 text-sm text-text-secondary">This may take a few seconds.</p>
      </div>
    </div>
  );
}
