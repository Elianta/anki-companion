import { useCallback, useMemo, useState } from 'react';
import { CheckIcon, ChevronDownIcon } from 'lucide-react';
import { useLLMStore, type LLMModel, type LLMProvider } from '@/stores/llm';
import { Button } from '@/components/ui/button';
import { getProviderIcon } from '@/components/icons/llmProviderMeta';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { ValueSelect } from '@/components/ValueSelect';
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
    value: 'googleai:gemini-3.5-flash-lite',
    label: 'Gemini 3.5 Flash Lite',
    provider: 'googleai',
    model: 'gemini-3.5-flash-lite',
  },
  {
    value: 'googleai:gemini-3.7-flash',
    label: 'Gemini 3.7 Flash',
    provider: 'googleai',
    model: 'gemini-3.7-flash',
  },
  {
    value: 'openai:gpt-5.6-luna',
    label: 'GPT-5.6 Luna',
    provider: 'openai',
    model: 'gpt-5.6-luna',
  },
];

const MODEL_VALUES = OPTIONS.map((option) => option.value);
const MODEL_LABELS = Object.fromEntries(OPTIONS.map((option) => [option.value, option.label]));

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
      <ValueSelect
        values={MODEL_VALUES}
        value={value}
        onValueChange={handleChange}
        optionLabels={MODEL_LABELS}
        size="lg"
        align="end"
        aria-label="Select AI model"
        className="w-full border-line/60 bg-surface px-4 text-base text-ink shadow-[0_2px_8px] shadow-ink/2 hover:border-line focus-visible:border-highlight focus-visible:ring-highlight/20"
      />
    </div>
  );
}

export function LLMSelectDrawerButton({ className = '' }: LLMSelectProps) {
  const [open, setOpen] = useState(false);
  const { value, selectedOption, handleChange } = useLLMSelectionController();

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
          size="lg"
          className={cn(
            'min-w-0 shrink max-w-[min(60vw,240px)] justify-between gap-3 border-line/60 bg-surface px-4 text-sm font-normal text-ink shadow-[0_2px_8px] shadow-ink/2 hover:border-line hover:text-highlight-hover focus-visible:ring-highlight/20 data-[state=open]:text-highlight md:hidden',
            '[&[data-state=open]>svg]:rotate-180',
            className,
          )}
          aria-label="Select AI model"
          data-test-id="llm-select-mobile-trigger"
        >
          <span className="truncate">{selectedOption.label}</span>
          <ChevronDownIcon
            aria-hidden="true"
            className="size-4 shrink-0 origin-center text-current transform-fill transition-transform duration-200 ease-out motion-reduce:transition-none"
          />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="border-line/60 bg-surface pb-[env(safe-area-inset-bottom)] text-ink data-[vaul-drawer-direction=bottom]:rounded-t-3xl">
        <div className="flex flex-1 flex-col overflow-hidden">
          <DrawerHeader>
            <DrawerTitle>Choose AI model</DrawerTitle>
          </DrawerHeader>
          <div className="grid gap-2 px-4 pb-6">
            {OPTIONS.map((option) => {
              const isSelected = option.value === value;
              const OptionIcon = getProviderIcon(option.provider);

              return (
                <DrawerClose asChild key={option.value}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xl"
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      'w-full justify-between px-4 text-left font-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-highlight',
                      isSelected
                        ? 'bg-highlight-light text-highlight'
                        : 'bg-surface text-ink hover:bg-surface-subtle',
                    )}
                    aria-pressed={isSelected}
                    data-test-id={`llm-option-${option.value}`}
                  >
                    <span className="flex items-center gap-3">
                      <OptionIcon className="h-4 w-4 shrink-0" />
                      <span
                        className={cn('text-base', isSelected ? 'font-semibold' : 'font-normal')}
                      >
                        {option.label}
                      </span>
                    </span>
                    <CheckIcon className={cn('size-5', isSelected ? 'opacity-100' : 'opacity-0')} />
                  </Button>
                </DrawerClose>
              );
            })}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
