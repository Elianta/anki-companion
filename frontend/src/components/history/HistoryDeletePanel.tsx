import { BottomActionPanel } from '@/components/BottomActionPanel';
import { Button } from '@/components/ui/button';

type HistoryDeletePanelProps = {
  selectedCount: number;
  isDeleting: boolean;
  disabled: boolean;
  onDelete: () => Promise<void>;
};

export function HistoryDeletePanel({
  selectedCount,
  isDeleting,
  disabled,
  onDelete,
}: HistoryDeletePanelProps) {
  return (
    <BottomActionPanel className="flex items-center justify-between gap-3">
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="text-sm text-text-secondary"
      >
        {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
      </p>
      <Button
        type="button"
        variant="destructive"
        size="lg"
        disabled={disabled || selectedCount === 0}
        onClick={() => void onDelete()}
      >
        {isDeleting ? 'Deleting…' : 'Delete selected'}
      </Button>
    </BottomActionPanel>
  );
}
