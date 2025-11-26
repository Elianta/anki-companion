import { useEffect, useState } from 'react';
import { FilePenLineIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { DraftEntry } from '@/lib/db';
import { updateDraftCardFields } from '@/services/draft-storage';

type CardEditorButtonProps = {
  draft: DraftEntry;
  onSave: () => Promise<void> | void;
  disabled?: boolean;
};

const normalizeFields = (fields: Record<string, unknown> | undefined | null) =>
  Object.entries(fields ?? {}).reduce<Record<string, string>>((acc, [key, value]) => {
    acc[key] = value === undefined || value === null ? '' : String(value);
    return acc;
  }, {});

export function CardEditorButton({ draft, onSave, disabled = false }: CardEditorButtonProps) {
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>(
    normalizeFields(draft.card?.fields ?? {}),
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFields(normalizeFields(draft.card?.fields ?? {}));
  }, [draft.card, draft.id]);

  const handleSave = async () => {
    if (!draft.id || !draft.card) return;
    setIsSaving(true);
    try {
      await updateDraftCardFields(draft.id, fields);
      await onSave();
      setOpen(false);
    } catch (error) {
      console.warn('Failed to save card fields', error);
      toast.error('Failed to save card changes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          size="icon"
          data-test-id={`card-ready-${draft.id}`}
          aria-label="View card"
        >
          <FilePenLineIcon className="h-4 w-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:rounded-t-2xl">
        <div className="flex flex-1 flex-col overflow-hidden">
          <DrawerHeader>
            <DrawerTitle>Card fields</DrawerTitle>
            <p className="text-sm text-muted-foreground">
              {draft.term} • {draft.noteType}
            </p>
          </DrawerHeader>
          <div className="grid flex-1 gap-3 overflow-y-auto px-4 pb-4">
            {Object.entries(fields).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  {key}
                </Label>
                <Input
                  value={value}
                  onChange={(event) =>
                    setFields((prev) => ({
                      ...prev,
                      [key]: event.target.value,
                    }))
                  }
                />
              </div>
            ))}
          </div>
        </div>
        <DrawerFooter className="flex-row justify-end gap-2">
          <DrawerClose asChild>
            <Button variant="ghost" type="button">
              Cancel
            </Button>
          </DrawerClose>
          <Button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
