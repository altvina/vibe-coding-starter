'use client';

import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/shared/ui/button';
import { cn } from '@/lib/utils';

import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';

export function PromoLearningCard({
  promoLearning,
}: {
  promoLearning: { headline: string; supporting: string; ctaLabel: string };
}) {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-2xl p-5 text-white shadow-md',
        'bg-gradient-to-b from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800',
      )}
    >
      <div className="relative z-10 space-y-4">
        <div className="space-y-2">
          <h2 className="text-lg font-extrabold leading-snug">
            {promoLearning.headline}
          </h2>
          <p className="text-sm text-white/80">{promoLearning.supporting}</p>
        </div>

        <Button
          type="button"
          className={cn(
            'h-10 rounded-full bg-secondary-400 px-4 text-sm font-semibold text-slate-950 hover:bg-secondary-300',
            dashboardTokens.focusRing,
          )}
        >
          {promoLearning.ctaLabel}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-5 top-5 grid grid-cols-2 gap-2 opacity-80">
          <span className="h-3 w-3 rounded bg-white/20" />
          <span className="h-3 w-3 rounded bg-white/15" />
          <span className="h-3 w-3 rounded bg-white/10" />
          <span className="h-3 w-3 rounded bg-secondary-400/50" />
        </div>

        <div className="absolute bottom-0 right-0 h-40 w-40 translate-x-6 translate-y-6 rounded-full bg-white/10" />
        <div className="absolute bottom-6 right-10 h-20 w-20 rounded-2xl bg-secondary-400/30" />
        <div className="absolute bottom-10 right-24 h-16 w-12 rounded-2xl bg-white/10" />
      </div>
    </section>
  );
}

