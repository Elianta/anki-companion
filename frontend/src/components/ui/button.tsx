import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { controlSizeVariants, type ControlSizeProps } from './control-size';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap px-4 py-2 text-sm font-medium transition-[color,background-color,border-color,box-shadow] disabled:pointer-events-none disabled:bg-text-muted/70 disabled:text-white disabled:opacity-100 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-highlight/25 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border bg-background shadow-xs hover:text-highlight-hover dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-highlight-hover dark:hover:bg-accent/50',
        link: 'text-highlight underline-offset-4 hover:text-highlight-hover hover:underline',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Button({
  className,
  variant,
  size = 'md',
  smSize,
  mdSize,
  icon = false,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    icon?: boolean;
  } & ControlSizeProps) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      data-size={size}
      className={cn(
        buttonVariants({ variant }),
        controlSizeVariants({ size, smSize, mdSize }),
        size === 'sm' && 'gap-1.5 px-3',
        icon && 'w-(--control-height) p-0',
        className,
      )}
      {...props}
    />
  );
}

export { Button };
