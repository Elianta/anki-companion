import { useRef, useState, type KeyboardEvent } from 'react';
import { toast } from 'sonner';
import type { DraftNoteType } from '@/lib/db';
import type { LangPair, Sense } from '@/lib/llm';
import { showRequestError } from '@/services/notifications';
import {
  getDefaultNoteType,
  getNoteTypesForLanguage,
  saveDraftFromSense,
} from '@/services/draft-storage';
import { SaveSensePanel } from './SaveSensePanel';
import { SenseCard } from './SenseCard';

export function SensesResults({
  senses,
  term,
  language,
  onSaved,
}: {
  senses: Sense[];
  term: string;
  language: LangPair;
  onSaved: () => void;
}) {
  const [selectedSenseId, setSelectedSenseId] = useState(senses[0]?.id);
  const [noteType, setNoteType] = useState<DraftNoteType>(getDefaultNoteType(language));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savingRef = useRef(false);
  const selectedSense = senses.find((sense) => sense.id === selectedSenseId);

  const save = async () => {
    if (!selectedSense || savingRef.current) return;
    savingRef.current = true;
    setIsSaving(true);
    setError(null);
    try {
      await saveDraftFromSense(
        { sense: selectedSense, term, language, noteType },
        { backgroundGenerate: true },
      );
      toast.success('Draft saved. Generating card in the background.');
      onSaved();
    } catch (error) {
      console.warn('Failed to save draft', error);
      setError(showRequestError(error, 'Failed to save draft. Please try again.'));
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>, index: number) => {
    let nextIndex = index;
    switch (event.key) {
      case 'ArrowDown':
        nextIndex = (index + 1) % senses.length;
        break;
      case 'ArrowUp':
        nextIndex = (index - 1 + senses.length) % senses.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = senses.length - 1;
        break;
      case 'Enter':
      case ' ':
        break;
      default:
        return;
    }
    event.preventDefault();
    setSelectedSenseId(senses[nextIndex].id);
    const options =
      event.currentTarget.parentElement?.querySelectorAll<HTMLElement>('[role="option"]');
    options?.[nextIndex]?.focus();
  };

  if (!senses.length) {
    return (
      <div role="status" className="mt-6 rounded-xl border border-line/80 bg-surface/90 p-4">
        <h2 className="text-base leading-none font-semibold text-ink">
          No senses found for {term}
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          Try adjusting your query or adding more context.
        </p>
      </div>
    );
  }

  return (
    <section aria-label="Search results" className="mt-6 flex flex-1 flex-col gap-6 md:mt-8">
      <div>
        <h2 className="mb-3 text-base leading-none font-semibold text-ink">
          Possible senses for {term}:
        </h2>
        <div role="listbox" aria-label="Senses list" className="space-y-4">
          {senses.map((sense, index) => (
            <SenseCard
              key={sense.id}
              sense={sense}
              selected={selectedSenseId === sense.id}
              onSelect={() => setSelectedSenseId(sense.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            />
          ))}
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <SaveSensePanel
        noteTypes={getNoteTypesForLanguage(language)}
        noteType={noteType}
        onNoteTypeChange={setNoteType}
        onSave={save}
        isSaving={isSaving}
      />
    </section>
  );
}
