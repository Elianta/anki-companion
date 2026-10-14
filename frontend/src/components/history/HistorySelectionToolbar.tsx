import { DraftCheckbox } from '@/components/drafts/DraftCheckbox';

type HistorySelectionToolbarProps = {
  count: number;
  selectedCount: number;
  isAllSelected: boolean;
  disabled: boolean;
  onToggleAll: () => void;
};

export function HistorySelectionToolbar({
  count,
  selectedCount,
  isAllSelected,
  disabled,
  onToggleAll,
}: HistorySelectionToolbarProps) {
  return (
    <div className="flex min-h-16 items-center gap-3 rounded-2xl border border-line/60 bg-surface/90 px-4 py-3 md:gap-5 md:px-5">
      <DraftCheckbox
        id="select-all-history"
        checked={isAllSelected ? true : selectedCount > 0 ? 'indeterminate' : false}
        onCheckedChange={onToggleAll}
        disabled={disabled}
        aria-label="Select all exported drafts"
      />
      <label htmlFor="select-all-history" className="cursor-pointer text-sm text-ink">
        Select all ({count} {count === 1 ? 'item' : 'items'})
      </label>
    </div>
  );
}
