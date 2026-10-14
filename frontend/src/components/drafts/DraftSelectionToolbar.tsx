import { DraftCheckbox } from './DraftCheckbox';

type DraftSelectionToolbarProps = {
  selectedCount: number;
  isAllSelected: boolean;
  readyCount: number;
  onToggleAll: () => void;
};

export function DraftSelectionToolbar({
  selectedCount,
  isAllSelected,
  readyCount,
  onToggleAll,
}: DraftSelectionToolbarProps) {
  return (
    <div className="flex min-h-16 items-center gap-5 rounded-2xl border border-line/60 bg-surface/90 px-4 py-3 md:min-h-18 md:px-5">
      <DraftCheckbox
        id="select-all-drafts"
        checked={isAllSelected ? true : selectedCount > 0 ? 'indeterminate' : false}
        onCheckedChange={onToggleAll}
        aria-label="Select all ready drafts"
        disabled={!readyCount}
      />
      <label htmlFor="select-all-drafts" className="cursor-pointer text-sm text-ink">
        Select all ready cards
      </label>
    </div>
  );
}
