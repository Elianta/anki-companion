import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { saveDraftFromSense } from '@/services/draft-storage';
import { useSessionStore } from '@/stores/session';

export function SensesScreen() {
  const navigate = useNavigate({ from: '/senses' });
  const senses = useSessionStore((state) => state.senses);
  const term = useSessionStore((state) => state.term);
  const language = useSessionStore((state) => state.language);
  const [selectedSenseId, setSelectedSenseId] = useState<string | null>(senses[0]?.id ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedSenseId(senses[0]?.id ?? null);
  }, [senses]);

  const selectedSense = useMemo(
    () => senses.find((sense) => sense.id === selectedSenseId),
    [senses, selectedSenseId],
  );

  const handleSaveDraft = async () => {
    if (!selectedSense) {
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await saveDraftFromSense({ sense: selectedSense, term, language });
      await navigate({ to: '/draft' });
    } catch (err) {
      console.warn('Failed to save draft', err);
      setError('Failed to save draft. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <Card className="bg-white">
        {!senses.length ? (
          <>
            <CardHeader>
              <CardTitle>{term ? `No senses found for ${term}` : 'Enter your query'}</CardTitle>
              <CardDescription>
                {term
                  ? 'Try adjusting your query or adding more context.'
                  : 'Go back to the main page and enter a term to see results.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button type="button" variant="outline" onClick={() => navigate({ to: '/' })}>
                Back to search
              </Button>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle>Possible senses for {term}:</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {senses.map((sense) => {
                const isSelected = selectedSenseId === sense.id;
                return (
                  <article
                    key={sense.id}
                    data-selected={isSelected}
                    onClick={() => setSelectedSenseId(sense.id)}
                    className={cn(
                      'cursor-pointer rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300',
                      isSelected && 'border-primary/50 bg-primary/5 shadow-lg shadow-primary/10',
                    )}
                    data-test-id={`sense-${sense.id}`}
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {sense.translationRU}
                      </h3>
                      {sense.partOfSpeech ? (
                        <Badge variant="secondary" className="text-xs lowercase">
                          {sense.partOfSpeech}
                        </Badge>
                      ) : null}
                      <Badge variant={isSelected ? 'default' : 'secondary'}>
                        {isSelected ? 'Selected' : 'Candidate'}
                      </Badge>
                    </div>
                    {sense.notes ? (
                      <p className="mt-3 text-sm text-muted-foreground">{sense.notes}</p>
                    ) : null}
                    {sense.frequencyNotes ? (
                      <p className="mt-3 text-sm text-muted-foreground">{sense.frequencyNotes}</p>
                    ) : null}
                    <ul className="mt-3 space-y-2 text-sm text-slate-700">
                      {sense.examples?.map((example) => (
                        <li
                          key={example}
                          className={cn(
                            'rounded-md p-3 text-slate-900',
                            isSelected ? 'bg-primary/10' : 'bg-slate-100',
                          )}
                        >
                          {example}
                        </li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </CardContent>
            <CardContent className="border-t border-slate-200 pt-6">
              <div className="flex flex-wrap items-center gap-3">
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
                <div className="ml-auto flex flex-wrap gap-2">
                  <Button
                    className="cursor-pointer"
                    type="button"
                    variant="outline"
                    onClick={() => navigate({ to: '/' })}
                  >
                    Back to search
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveDraft}
                    className="cursor-pointer"
                    disabled={isSaving || !selectedSense}
                    data-test-id="save-draft-button"
                  >
                    {isSaving ? 'Saving...' : 'Save to draft'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </section>
  );
}
