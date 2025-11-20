import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DraftEntry, DraftNoteType } from '@/lib/db';
import {
  fetchDrafts,
  getNoteTypesForLanguage,
  removeDraft,
  updateDraftNoteType,
} from '@/services/draft-storage';

export function DraftScreen() {
  const [drafts, setDrafts] = useState<DraftEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadDrafts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const storedDrafts = await fetchDrafts();
        if (isMounted) {
          setDrafts(storedDrafts);
        }
      } catch (err) {
        console.warn('Failed to load drafts', err);
        if (isMounted) {
          setError('Failed to load drafts. Refresh the page.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadDrafts();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleNoteTypeChange = async (draftId: number, noteType: DraftNoteType) => {
    setDrafts((prev) =>
      prev.map((draft) => (draft.id === draftId ? { ...draft, noteType } : draft)),
    );
    try {
      await updateDraftNoteType(draftId, noteType);
    } catch (err) {
      console.warn('Failed to update note type', err);
      setError('Failed to update note type.');
    }
  };

  const handleRemove = async (draftId: number) => {
    const previous = drafts;
    setDrafts((prev) => prev.filter((draft) => draft.id !== draftId));
    try {
      await removeDraft(draftId);
    } catch (err) {
      console.warn('Failed to remove draft', err);
      setError('Failed to delete draft.');
      setDrafts(previous);
    }
  };

  const hasDrafts = drafts.length > 0;

  return (
    <section className="space-y-6">
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Draft cards</CardTitle>
          <CardDescription>Manage saved senses before exporting.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? <p className="text-sm text-muted-foreground">Loading drafts…</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {!isLoading && !hasDrafts ? (
            <p className="text-sm text-muted-foreground">
              No drafts yet. Open the “Senses” tab, pick a sense, and save it.
            </p>
          ) : null}

          <div className="grid gap-4">
            {drafts.map((draft) => {
              const noteTypes = getNoteTypesForLanguage(draft.language);
              return (
                <div
                  key={draft.id}
                  data-test-id={`draft-item-${draft.id}`}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-xs"
                >
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="uppercase">
                          {draft.language}
                        </Badge>
                        {draft.partOfSpeech ? (
                          <Badge variant="outline" className="uppercase">
                            {draft.partOfSpeech}
                          </Badge>
                        ) : null}
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Term
                        </p>
                        <p className="text-lg font-semibold text-slate-900">{draft.term}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-auto"
                      onClick={() => draft.id && handleRemove(draft.id)}
                      data-test-id={`remove-draft-${draft.id}`}
                    >
                      Delete
                    </Button>
                  </div>

                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Translation
                      </p>
                      <p className="text-sm text-slate-900">{draft.translation}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Sense note
                      </p>
                      <p className="text-sm text-slate-900">
                        {draft.senseNote ? draft.senseNote : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Label className="text-sm text-slate-700">Note Type</Label>
                    {noteTypes.length > 1 ? (
                      <Select
                        value={draft.noteType}
                        onValueChange={(value) =>
                          draft.id && handleNoteTypeChange(draft.id, value as DraftNoteType)
                        }
                      >
                        <SelectTrigger data-test-id={`note-type-${draft.id}`} size="sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {noteTypes.map((noteType) => (
                            <SelectItem key={noteType} value={noteType}>
                              {noteType}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="secondary">{draft.noteType}</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
