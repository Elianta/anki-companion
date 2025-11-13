import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function DraftScreen() {
  return (
    <section className="space-y-6">
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Черновик карточки</CardTitle>
          <CardDescription>
            Заполните поля перед экспортом. Пока что элементы отключены и показывают целевую
            структуру карточки.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="draft-word">Слово / выражение</Label>
              <Input id="draft-word" placeholder="Например, shard" disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="draft-phonetics">Транскрипция</Label>
              <Input id="draft-phonetics" placeholder="/ʃɑːd/" disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="draft-translation">Перевод</Label>
              <Input id="draft-translation" placeholder="осколок, фрагмент" disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="draft-tags">Теги / колоды</Label>
              <Input id="draft-tags" placeholder="anki::vocab, ru::reading" disabled />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="draft-definition">Определение</Label>
            <Textarea
              id="draft-definition"
              placeholder="Кратко опишите значение, чтобы вспомнить ситуацию."
              rows={3}
              disabled
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="draft-example">Пример / контекст</Label>
            <Textarea
              id="draft-example"
              placeholder="Добавьте пример использования с переводом."
              rows={4}
              disabled
            />
            <p className="text-sm text-muted-foreground">
              В будущем сюда можно будет подтягивать предложенные примеры из LLM и редактировать их.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary" className="uppercase tracking-wide">
              Черновик
            </Badge>
            <p className="text-sm text-muted-foreground">
              Автосохранение появится после подключения local storage / IndexedDB.
            </p>
          </div>
        </CardContent>
        <CardContent className="border-t border-slate-200 pt-6">
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" disabled>
              Очистить
            </Button>
            <Button type="button" disabled>
              Сохранить черновик
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
