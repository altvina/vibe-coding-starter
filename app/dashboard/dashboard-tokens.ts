export const dashboardTokens = {
  appBg: 'bg-background',
  surface: 'bg-card',
  surfaceMuted: 'bg-muted/50',
  border: 'border-border',
  borderStrong: 'border-border/90',
  text: 'text-foreground',
  textMuted: 'text-muted-foreground',
  textSubtle: 'text-foreground/65',
  chartInk: 'bg-slate-700 dark:bg-slate-200',
  chartInkText: 'text-slate-700 dark:text-slate-200',
  focusRing:
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  card:
    'rounded-[14px] border shadow-[var(--elevation-soft)] transition-colors hover:border-primary-200/80 hover:shadow-[var(--elevation-strong)] dark:hover:border-primary-500/35',
} as const;
