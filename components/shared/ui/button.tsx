import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-primary-600 text-white shadow-sm hover:bg-primary-500 dark:bg-primary-500 dark:hover:bg-primary-400',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border border-input bg-card text-foreground hover:bg-accent hover:text-accent-foreground',
        outlinePrimary:
          'border border-primary-200 bg-primary-50/60 text-primary-700 hover:bg-primary-100 dark:border-primary-500/40 dark:bg-primary-500/10 dark:text-primary-200 dark:hover:bg-primary-500/20',
        outlineSecondary:
          'border border-secondary-300 bg-secondary-100/70 text-secondary-700 hover:bg-secondary-200/70 dark:border-secondary-500/40 dark:bg-secondary-500/10 dark:text-secondary-200 dark:hover:bg-secondary-500/20',
        primary:
          'bg-primary-600 text-white shadow-sm hover:bg-primary-500 dark:bg-primary-500 dark:hover:bg-primary-400',
        secondary:
          'bg-secondary-500 text-white hover:bg-secondary-400 dark:bg-secondary-500 dark:hover:bg-secondary-400',
        ghost: 'text-slate-600 hover:bg-accent hover:text-accent-foreground dark:text-slate-300',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-lg px-3',
        lg: 'h-11 rounded-xl px-8',
        xl: 'h-12 rounded-xl px-6 text-md sm:px-10',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
