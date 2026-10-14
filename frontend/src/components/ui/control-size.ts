import { cva, type VariantProps } from 'class-variance-authority';

// Shared heights for buttons and select triggers. Font sizes are independent.
export const controlSizeVariants = cva('h-(--control-height) rounded-control', {
  variants: {
    size: {
      sm: '[--control-height:2rem]',
      md: '[--control-height:2.25rem]',
      lg: '[--control-height:2.75rem]',
      xl: '[--control-height:3rem]',
      '2xl': '[--control-height:3.75rem]',
      '3xl': '[--control-height:4rem]',
      '4xl': '[--control-height:5rem]',
    },
    smSize: {
      sm: 'sm:[--control-height:2rem]',
      md: 'sm:[--control-height:2.25rem]',
      lg: 'sm:[--control-height:2.75rem]',
      xl: 'sm:[--control-height:3rem]',
      '2xl': 'sm:[--control-height:3.75rem]',
      '3xl': 'sm:[--control-height:4rem]',
      '4xl': 'sm:[--control-height:5rem]',
    },
    mdSize: {
      sm: 'md:[--control-height:2rem]',
      md: 'md:[--control-height:2.25rem]',
      lg: 'md:[--control-height:2.75rem]',
      xl: 'md:[--control-height:3rem]',
      '2xl': 'md:[--control-height:3.75rem]',
      '3xl': 'md:[--control-height:4rem]',
      '4xl': 'md:[--control-height:5rem]',
    },
  },
  defaultVariants: { size: 'md' },
});

export type ControlSizeProps = VariantProps<typeof controlSizeVariants>;
