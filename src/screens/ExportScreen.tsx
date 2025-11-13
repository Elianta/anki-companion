import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const EXPORT_PIPELINE = [
  {
    id: 'collect',
    title: 'Собрать карточки',
    description: 'Выберите подтверждённые senses и финальные переводы.',
    status: 'Ожидает проверки',
  },
  {
    id: 'preview',
    title: 'Предпросмотр',
    description: 'Сформируйте таблицу, чтобы быстро глазами проверить поля.',
    status: 'Черновик',
  },
  {
    id: 'package',
    title: 'Экспорт .apkg',
    description: 'anki-apkg-export подготовит пакет для Anki Desktop / AnkiWeb.',
    status: 'Недоступно',
  },
];

export function ExportScreen() {
  return (
    <section className="space-y-6">
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Экспорт в Anki</CardTitle>
          <CardDescription>
            Финальная точка пайплайна. Здесь соберём карточки и упакуем их в Anki deck.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {EXPORT_PIPELINE.map((step) => (
            <div key={step.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-lg font-semibold text-slate-900">{step.title}</p>
                <Badge variant="outline" className="border-dashed text-xs uppercase tracking-wide">
                  {step.status}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </CardContent>
        <CardContent className="border-t border-slate-200 pt-6">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" disabled>
              Предпросмотр CSV
            </Button>
            <Button disabled>Экспорт недоступен</Button>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Как только появится API для anki-apkg-export, кнопки включатся и загрузка начнёт
            формировать архив автоматически.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
