import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useSessionStore } from '@/stores/session';

export function SensesScreen() {
  const senses = useSessionStore((state) => state.senses);
  const term = useSessionStore((state) => state.term);
  const [selectedSenseId, setSelectedSenseId] = useState<string | null>(senses[0]?.id ?? null);

  if (!senses.length) {
    return (
      <section className="space-y-6">
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardDescription>Enter your query on the main page to see results.</CardDescription>
          </CardHeader>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <Card className="bg-white shadow-sm">
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
                  <h3 className="text-lg font-semibold text-slate-900">{sense.translationRU}</h3>
                  {sense.partOfSpeech ? (
                    <Badge variant="secondary" className="text-xs uppercase">
                      {sense.partOfSpeech}
                    </Badge>
                  ) : null}
                  <Badge variant={isSelected ? 'default' : 'secondary'}>
                    {isSelected ? 'Выбрано' : 'Кандидат'}
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
                    <li key={example} className="rounded-md bg-slate-100 p-3 text-slate-900">
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
            <Button disabled className="ml-auto">
              Next...
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
