import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useSessionStore } from '@/stores/session';
import type { LangPair } from '@/lib/llm';

type LanguageSelectProps = {
  disabled?: boolean;
  className?: string;
};

export function LanguageSelect({ disabled, className }: LanguageSelectProps) {
  const language = useSessionStore((state) => state.language);
  const setLanguage = useSessionStore((state) => state.setLanguage);

  const handleChange = (value: string) => {
    setLanguage(value as LangPair);
  };

  return (
    <ToggleGroup
      type="single"
      value={language}
      onValueChange={handleChange}
      disabled={disabled}
      variant="outline"
      size="lg"
      spacing={0}
      className={className}
      data-test-id="language-select"
    >
      <ToggleGroupItem value="EN" disabled={disabled} data-test-id="language-option-EN">
        EN
      </ToggleGroupItem>
      <ToggleGroupItem value="PL" disabled={disabled} data-test-id="language-option-PL">
        PL
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
