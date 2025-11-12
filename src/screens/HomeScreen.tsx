import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const RECENT_REQUESTS = [
  {
    word: "intertwined",
    context: "The intertwined histories of the two regions are fascinating.",
    status: "Анализ",
  },
  {
    word: "shard",
    context: "I kept a shard of the glass bottle as a reminder.",
    status: "Нужен перевод",
  },
  {
    word: "to double down",
    context: "We might have to double down on our memorization routine.",
    status: "В очереди",
  },
]

export function HomeScreen() {
  return (
    <section className="space-y-6">
      <Card className="bg-slate-900/30">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Ввод слова или чанка</CardTitle>
              <CardDescription>
                Форма для запроса кандидатов значений через LLM.
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-dashed">
              LLM offline
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="chunk-word">Слово / выражение</Label>
            <Input
              id="chunk-word"
              placeholder="Например: to keep tabs on"
              disabled
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="chunk-context">Контекст из текста</Label>
            <Textarea
              id="chunk-context"
              placeholder="Вставьте предложение или небольшой фрагмент…"
              rows={4}
              disabled
            />
            <p className="text-sm text-muted-foreground">
              Подключение к модели ещё не настроено. Когда оно появится, сюда
              можно будет отправлять запросы и получать варианты senses.
            </p>
          </div>
          <Button type="button" className="w-full" disabled>
            Ожидает реализации
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/20">
        <CardHeader>
          <CardTitle>Недавние запросы</CardTitle>
          <CardDescription>
            Для наглядности показаны фиктивные элементы — можно использовать как
            план будущего интерфейса.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {RECENT_REQUESTS.map((request) => (
            <div
              key={request.word}
              className="rounded-lg border border-white/5 bg-slate-900/60 p-4 shadow-inner"
            >
              <div className="flex items-center justify-between gap-4">
                <p className="text-lg font-semibold text-white">{request.word}</p>
                <Badge variant="secondary" className="text-xs uppercase tracking-wide">
                  {request.status}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{request.context}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  )
}
