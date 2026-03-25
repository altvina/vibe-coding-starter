import * as React from 'react';

import { cn } from '@/lib/utils';

// Replace the empty interface with a type alias
export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-xl border border-input bg-card px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:shadow-[0_1px_1px_rgba(2,6,23,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      >
        {props.children}
      </textarea>
    );
  },
);
Textarea.displayName = 'Textarea';

export { Textarea };
