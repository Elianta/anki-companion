import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useSessionStore } from "@/stores/session"

type LanguageSelectProps = {
  disabled?: boolean
  className?: string
}

export function LanguageSelect({ disabled, className }: LanguageSelectProps) {
  const language = useSessionStore((state) => state.language)
  const setLanguage = useSessionStore((state) => state.setLanguage)

  return (
    <Select value={language} onValueChange={setLanguage} disabled={disabled}>
      <SelectTrigger
        className={cn("min-w-24", className)}
        data-test-id="language-select"
        disabled={disabled}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value="EN">EN</SelectItem>
        <SelectItem value="PL">PL</SelectItem>
      </SelectContent>
    </Select>
  )
}
