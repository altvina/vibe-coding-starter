import { cn } from '@/lib/utils';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';

export function AvatarGroup({
  avatars,
  overflowCount,
}: {
  avatars: Array<{ id: string; initials: string }>;
  overflowCount?: number;
}) {
  return (
    <div className="flex items-center">
      <div className="-space-x-2">
        {avatars.map((a) => (
          <span
            key={a.id}
            className={cn(
              'inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold',
              dashboardTokens.surface,
              dashboardTokens.border,
              dashboardTokens.textMuted,
            )}
          >
            {a.initials}
          </span>
        ))}
        {typeof overflowCount === 'number' && overflowCount > 0 ? (
          <span
            className={cn(
              'inline-flex h-7 w-7 items-center justify-center rounded-full border bg-slate-50 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300',
              dashboardTokens.border,
            )}
          >
            +{overflowCount}
          </span>
        ) : null}
      </div>
    </div>
  );
}

