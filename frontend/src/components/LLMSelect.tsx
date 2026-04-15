import { useCallback, useMemo, useState } from 'react';
import { BotIcon, CheckIcon } from 'lucide-react';
import { useLLMStore, type LLMModel, type LLMProvider } from '@/stores/llm';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type LLMSelectProps = {
  className?: string;
};

type LLMOption = {
  value: string;
  label: string;
  provider: LLMProvider;
  model: LLMModel;
};

const OPTIONS: LLMOption[] = [
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

function useLLMSelectionController() {
  const llmProvider = useLLMStore((state) => state.llmProvider);
  const llmModel = useLLMStore((state) => state.llmModel);
  const setLLMConfig = useLLMStore((state) => state.setLLMConfig);
  const value = `${llmProvider}:${llmModel}`;

  const selectedOption = useMemo(
    () => OPTIONS.find((option) => option.value === value) ?? OPTIONS[0],
    [value],
  );

  const handleChange = useCallback(
    (value: string) => {
      const match = OPTIONS.find((option) => option.value === value);
      if (match) {
        setLLMConfig(match.provider, match.model);
      }
    },
    [setLLMConfig],
  );

  return { value, selectedOption, handleChange };
}

export function LLMSelect({ className = '' }: LLMSelectProps) {
  const { value, handleChange } = useLLMSelectionController();

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <Select value={value} onValueChange={handleChange}>
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

export function LLMSelectDrawerButton({ className = '' }: LLMSelectProps) {
  const [open, setOpen] = useState(false);
  const { value, handleChange } = useLLMSelectionController();

  const handleSelect = (nextValue: string) => {
    handleChange(nextValue);
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn('h-9 gap-2 rounded-full px-3 text-sm font-medium md:hidden', className)}
          aria-label="Select AI model"
          data-test-id="llm-select-mobile-trigger"
        >
          <BotIcon className="h-5 w-5" />
          <span>AI model</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:rounded-t-2xl">
        <div className="flex flex-1 flex-col overflow-hidden">
          <DrawerHeader>
            <DrawerTitle>Choose AI model</DrawerTitle>
          </DrawerHeader>
          <div className="grid gap-2 px-4 pb-6">
            {OPTIONS.map((option) => {
              const isSelected = option.value === value;

              return (
                <DrawerClose asChild key={option.value}>
                  <button
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      'flex items-center justify-between rounded-xl border px-4 py-3 text-left transition',
                      isSelected
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-900',
                    )}
                    aria-pressed={isSelected}
                    data-test-id={`llm-option-${option.value}`}
                  >
                    <span className="text-sm font-medium">{option.label}</span>
                    <CheckIcon
                      className={cn('h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')}
                    />
                  </button>
                </DrawerClose>
              );
            })}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
