import { useRef } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { ControlSizeProps } from '@/components/ui/control-size';

type ValueSelectProps<T extends string> = ControlSizeProps & {
  values: readonly T[];
  value: T;
  onValueChange: (value: T) => void;
  disabled?: boolean;
  blurOnPointerSelect?: boolean;
  optionLabels?: Partial<Record<T, string>>;
  showOptionValue?: boolean;
  valueLabel?: string;
  align?: 'start' | 'center' | 'end';
  className?: string;
  'aria-label': string;
};

export function ValueSelect<T extends string>({
  values,
  value,
  onValueChange,
  disabled,
  blurOnPointerSelect = false,
  size = 'md',
  smSize,
  mdSize,
  optionLabels,
  showOptionValue = false,
  valueLabel,
  align = 'center',
  className,
  'aria-label': ariaLabel,
}: ValueSelectProps<T>) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedByPointer = useRef(false);

  return (
    <Select
      value={value}
      onValueChange={(nextValue) => onValueChange(nextValue as T)}
      disabled={disabled}
    >
      <SelectTrigger
        ref={triggerRef}
        aria-label={ariaLabel}
        size={size}
        smSize={smSize}
        mdSize={mdSize}
        className={cn(
          'border-line bg-surface text-ink transition-colors cursor-pointer hover:text-highlight-hover focus-visible:border-highlight focus-visible:ring-highlight/20 data-[state=open]:text-highlight disabled:bg-surface-subtle disabled:text-text-muted disabled:opacity-100',
          className,
        )}
      >
        <SelectValue>{valueLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent
        align={align}
        sideOffset={0}
        viewportClassName="space-y-1 p-2"
        onCloseAutoFocus={(event) => {
          if (blurOnPointerSelect && selectedByPointer.current) {
            event.preventDefault();
            triggerRef.current?.blur();
          }
          selectedByPointer.current = false;
        }}
        className="min-w-60 max-w-[calc(100vw-2rem)] border-line/60 bg-surface text-ink shadow-[0_8px_32px,0_2px_8px] shadow-ink/5"
      >
        {values.map((option) => (
          <SelectItem
            key={option}
            value={option}
            onPointerUp={(event) => {
              if (event.pointerType === 'mouse') selectedByPointer.current = true;
            }}
            onClick={() => {
              selectedByPointer.current = true;
            }}
            className="group min-h-12 cursor-pointer rounded-lg py-3 pr-12 pl-4 text-base font-normal transition-colors hover:bg-surface-subtle focus:bg-surface-subtle data-[state=checked]:bg-highlight-light data-[state=checked]:text-highlight"
          >
            {showOptionValue && <span className="w-10 shrink-0 font-semibold">{option}</span>}
            <span
              className={cn(
                showOptionValue && 'text-text-secondary group-data-[state=checked]:text-highlight',
              )}
            >
              {optionLabels?.[option] ?? option}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
