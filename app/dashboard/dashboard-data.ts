export const dashboardUser = {
  name: 'Jay Newcombe',
  email: 'jay@altvina.com',
  initials: 'JN',
};

export const dashboardTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'clients', label: 'Clients' },
  { id: 'projects', label: 'Projects' },
  { id: 'analytics', label: 'Analytics' },
] as const;

export type DashboardTabId = (typeof dashboardTabs)[number]['id'];

export type KpiDelta = {
  direction: 'up' | 'down';
  value: number;
  label: string;
};

export const dashboardKpis = [
  {
    id: 'revenue',
    label: 'Revenue',
    value: 0,
    valueFormat: 'currencyIdr',
    subtext: 'Awaiting live data',
    delta: { direction: 'up', value: 0, label: 'vs last month' } satisfies KpiDelta,
  },
  {
    id: 'projectsOngoing',
    label: 'Projects Ongoing',
    value: 0,
    valueFormat: 'number',
    subtext: 'Awaiting live data',
    delta: { direction: 'up', value: 0, label: 'new this week' } satisfies KpiDelta,
  },
  {
    id: 'clients',
    label: 'Number of Clients',
    value: 1,
    valueFormat: 'number',
    subtext: 'Altvina workspace',
    delta: { direction: 'up', value: 0, label: 'since last month' } satisfies KpiDelta,
  },
] as const;

export type ProjectStatus = 'onReview' | 'onProgress';

export type ProjectRow = {
  id: string;
  client: { name: string; handle: string };
  task: { title: string; subtitle: string };
  dueOn: string;
  status: ProjectStatus;
  priority: boolean;
};

export const manageProjects = {
  title: 'Manage Projects',
  filters: [
    { id: 'priority', label: 'Priority' },
    { id: 'active', label: 'Active' },
    { id: 'draft', label: 'Draft' },
    { id: 'completed', label: 'Completed' },
  ] as const,
  defaultFilterId: 'priority',
  rows: [] satisfies ProjectRow[],
} as const;

export const sidebarAssistant = {
  greeting: `Hi, ${dashboardUser.name.split(' ')[0]}`,
  headline: 'How can I help you?',
  placeholder: 'Ask something…',
  quickActions: [
    { id: 'text', label: 'Text Assistance' },
    { id: 'automation', label: 'Process Automation' },
    { id: 'schedule', label: 'Schedule Optimization' },
    { id: 'responses', label: 'Smart Responses' },
  ],
} as const;

export const promoLearning = {
  headline: 'Get matched with vetted experts in as little as 48 hours.',
  supporting: 'No long contracts • Vetted experts • Measurable outcomes',
  ctaLabel: 'Learn More',
} as const;
