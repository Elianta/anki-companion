import { BottomActionPanel } from '@/components/BottomActionPanel';
import { Button } from '@/components/ui/button';

type DraftExportPanelProps = {
  selectedCount: number;
  isExporting: boolean;
  onExport: () => Promise<void>;
};

export function DraftExportPanel({ selectedCount, isExporting, onExport }: DraftExportPanelProps) {
  return (
    <BottomActionPanel className="flex items-center justify-between gap-4">
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="text-sm text-text-secondary md:text-base"
      >
        {selectedCount} {selectedCount === 1 ? 'card' : 'cards'} selected
      </p>
      <Button
        type="button"
        size="lg"
        className="px-6"
        onClick={() => void onExport()}
        disabled={isExporting || selectedCount === 0}
        aria-label="Export selected drafts"
      >
        {isExporting ? 'Exporting…' : 'Export selected'}
      </Button>
    </BottomActionPanel>
  );
}
