import { useCallback } from 'react';
import { useLLMStore, type LLMModel, type LLMProvider } from '@/stores/llm';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type LLMSelectProps = {
  className?: string;
};

const OPTIONS: Array<{ value: string; label: string; provider: LLMProvider; model: LLMModel }> = [
  {
    value: 'googleai:gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    provider: 'googleai',
    model: 'gemini-2.5-flash',
  },
  {
    value: 'openai:gpt-4.1-mini',
    label: 'GPT-4.1 Mini',
    provider: 'openai',
    model: 'gpt-4.1-mini',
  },
];

export function LLMSelect({ className = '' }: LLMSelectProps) {
  const llmProvider = useLLMStore((state) => state.llmProvider);
  const llmModel = useLLMStore((state) => state.llmModel);
  const setLLMConfig = useLLMStore((state) => state.setLLMConfig);

  const handleChange = useCallback(
    (value: string) => {
      const match = OPTIONS.find((option) => option.value === value);
      if (match) {
        setLLMConfig(match.provider, match.model);
      }
    },
    [setLLMConfig],
  );

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <Select value={`${llmProvider}:${llmModel}`} onValueChange={handleChange}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
