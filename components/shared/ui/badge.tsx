import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring/40 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100 dark:border-primary-500/35 dark:bg-primary-500/15 dark:text-primary-200 dark:hover:bg-primary-500/25',
        secondary:
          'border-secondary-200 bg-secondary-50 text-secondary-700 hover:bg-secondary-100 dark:border-secondary-500/35 dark:bg-secondary-500/15 dark:text-secondary-200 dark:hover:bg-secondary-500/25',
        destructive:
          'border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-400/35 dark:bg-red-400/15 dark:text-red-200 dark:hover:bg-red-400/25',
        outline: 'border-border text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
