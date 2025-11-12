import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

const MOCK_SENSES = [
  {
    id: "sense-1",
    title: "to double down · усиливать усилия",
    definition:
      "Удвоить усилия или продолжить стратегию с ещё большей решимостью, даже если есть сомнения.",
    confidence: 0.78,
    examples: [
      "After the first failed attempt they doubled down on studying collocations.",
    ],
    tags: ["idiom", "strategy", "commitment"],
  },
  {
    id: "sense-2",
    title: "to double down · сделать ставку снова",
    definition:
      "В азартных играх — удвоить ставку после получения благоприятной карты.",
    confidence: 0.59,
    examples: ["He doubled down when he saw the dealer’s weak card."],
    tags: ["gambling", "literal"],
  },
  {
    id: "sense-3",
    title: "to double down · держаться прежней точки зрения",
    definition:
      "Защитить уже высказанную позицию, несмотря на полученную обратную связь.",
    confidence: 0.44,
    examples: [
      "The speaker doubled down on their thesis even after the Q&A.",
      "Команда всё равно решила double down on mnemonics.",
    ],
    tags: ["communication"],
  },
]

export function SensesScreen() {
  return (
    <section className="space-y-6">
      <Card className="bg-slate-900/30">
        <CardHeader>
          <CardTitle>Дизамбигуация значений</CardTitle>
          <CardDescription>
            Здесь появятся результаты от LLM. Выберите один sense, затем утвердите
            его для карточки.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {MOCK_SENSES.map((sense, index) => {
            const isSelected = index === 0
            return (
              <article
                key={sense.id}
                data-selected={isSelected}
                className={cn(
                  "rounded-xl border border-white/5 bg-slate-900/50 p-4 transition hover:border-white/20",
                  isSelected && "border-primary/70 shadow-lg shadow-primary/10"
                )}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-semibold text-white">{sense.title}</h3>
                  <Badge variant={isSelected ? "default" : "secondary"}>
                    {isSelected ? "Выбрано" : "Кандидат"}
                  </Badge>
                  <Badge variant="outline" className="border-dashed text-xs">
                    {(sense.confidence * 100).toFixed(0)}% confidence
                  </Badge>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{sense.definition}</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-200">
                  {sense.examples.map((example) => (
                    <li key={example} className="rounded-md bg-black/20 p-3">
                      {example}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap gap-2">
                  {sense.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="border-white/10 bg-white/5 text-xs uppercase tracking-wide text-slate-200"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </article>
            )
          })}
        </CardContent>
        <CardContent className="border-t border-white/5 pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Алгоритм сейчас работает в демонстрационном режиме.
            </p>
            <Button disabled className="ml-auto">
              Анализируется…
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
