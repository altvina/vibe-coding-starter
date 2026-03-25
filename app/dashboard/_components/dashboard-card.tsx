import { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';

export function DashboardCard({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(dashboardTokens.surface, dashboardTokens.border, dashboardTokens.card, className)}
    >
      {(title || action) && (
        /* Header wraps action below title on narrow containers instead of squeezing */
        <header className="flex flex-wrap items-center justify-between gap-2 p-4 sm:gap-3 sm:p-5">
          {title ? (
            <h2 className={cn('text-sm font-semibold', dashboardTokens.text)}>
              {title}
            </h2>
          ) : (
            <div />
          )}
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      )}

      <div className={cn('p-4 sm:p-5', title || action ? 'pt-0' : undefined)}>
        {children}
      </div>
    </section>
  );
}

