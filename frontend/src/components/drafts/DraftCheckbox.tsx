import type { ComponentProps } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export function DraftCheckbox({ className, ...props }: ComponentProps<typeof Checkbox>) {
  return (
    <Checkbox
      className={cn(
        'size-9 rounded-lg border-line bg-surface shadow-none transition-colors hover:border-highlight data-[state=checked]:border-highlight data-[state=checked]:bg-highlight data-[state=indeterminate]:border-highlight data-[state=indeterminate]:bg-highlight data-[state=indeterminate]:text-white focus-visible:ring-highlight/25 disabled:bg-surface-subtle [&_svg]:size-4',
        className,
      )}
      {...props}
    />
  );
}
