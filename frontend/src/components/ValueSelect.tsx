import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type ValueSelectProps<T extends string> = {
  values: readonly T[];
  value: T;
  onValueChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
  'aria-label': string;
};

export function ValueSelect<T extends string>({
  values,
  value,
  onValueChange,
  disabled,
  className,
  'aria-label': ariaLabel,
}: ValueSelectProps<T>) {
  return (
    <Select
      value={value}
      onValueChange={(nextValue) => onValueChange(nextValue as T)}
      disabled={disabled}
    >
      <SelectTrigger aria-label={ariaLabel} className={cn('bg-white', className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {values.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
