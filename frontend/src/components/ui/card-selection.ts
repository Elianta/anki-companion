import { cva } from 'class-variance-authority';

export const cardSelectionVariants = cva('', {
  variants: {
    selected: {
      true: 'border-highlight bg-highlight-light/80 shadow-[0_4px_14px] shadow-highlight/15',
      false: 'border-line/80 bg-surface/90 shadow-xs',
    },
  },
  defaultVariants: { selected: false },
});
