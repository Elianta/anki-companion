import { ClipboardListIcon, LoaderCircleIcon } from 'lucide-react';
import { BottomActionPanel } from '@/components/BottomActionPanel';
import { Button } from '@/components/ui/button';
import { ValueSelect } from '@/components/ValueSelect';
import type { DraftNoteType } from '@/lib/db';

type SaveSensePanelProps = {
  noteTypes: DraftNoteType[];
  noteType: DraftNoteType;
  onNoteTypeChange: (noteType: DraftNoteType) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
};

export function SaveSensePanel({
  noteTypes,
  noteType,
  onNoteTypeChange,
  onSave,
  isSaving,
}: SaveSensePanelProps) {
  return (
    <BottomActionPanel className="flex flex-col justify-center">
      <div className="flex min-w-0 items-center gap-1.5 sm:gap-4">
        <div className="hidden shrink-0 items-center gap-1.5 text-text-secondary min-[340px]:flex sm:gap-3">
          <ClipboardListIcon aria-hidden="true" className="size-6" />
          <span className="hidden text-sm whitespace-nowrap min-[375px]:inline">Card type</span>
        </div>
        <ValueSelect
          size="lg"
          smSize="md"
          className="min-w-0 flex-1 sm:w-40 sm:flex-none"
          values={noteTypes}
          value={noteType}
          onValueChange={onNoteTypeChange}
          disabled={isSaving || noteTypes.length === 1}
          aria-label="Note type"
        />
        <Button
          size="lg"
          smSize="md"
          className="ml-auto"
          type="button"
          onClick={() => void onSave()}
          disabled={isSaving}
          data-test-id="save-draft-button"
        >
          {isSaving && (
            <LoaderCircleIcon
              aria-hidden="true"
              className="size-4 animate-spin motion-reduce:animate-none"
            />
          )}
          {isSaving ? 'Saving…' : 'Save to draft'}
        </Button>
      </div>
    </BottomActionPanel>
  );
}
