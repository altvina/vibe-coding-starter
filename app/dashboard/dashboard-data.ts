export const dashboardUser = {
  name: 'Olivia Rodrigo',
  email: 'olivia@altvina.com',
  initials: 'OR',
};

export const dashboardTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'clients', label: 'Clients' },
  { id: 'projects', label: 'Projects' },
  { id: 'inbox', label: 'Inbox' },
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
    value: 61820000,
    valueFormat: 'currencyIdr',
    subtext: 'This month',
    delta: { direction: 'up', value: 6.0, label: 'vs last month' } satisfies KpiDelta,
  },
  {
    id: 'projectsOngoing',
    label: 'Projects Ongoing',
    value: 12,
    valueFormat: 'number',
    subtext: 'Across all clients',
    delta: { direction: 'up', value: 4.0, label: 'new this week' } satisfies KpiDelta,
  },
  {
    id: 'clients',
    label: 'Number of Clients',
    value: 28,
    valueFormat: 'number',
    subtext: 'Active relationships',
    delta: { direction: 'down', value: 2.0, label: 'since last month' } satisfies KpiDelta,
  },
] as const;

export const revenueAnalytics = {
  title: 'Revenue Analytics',
  points: [
    { id: 'w1', weekLabel: 'Week 1', monthLabel: 'May 2025', value: 32820000 },
    { id: 'w2', weekLabel: 'Week 2', monthLabel: 'May 2025', value: 61820000 },
    { id: 'w3', weekLabel: 'Week 3', monthLabel: 'May 2025', value: 45240000 },
    { id: 'w4', weekLabel: 'Week 4', monthLabel: 'May 2025', value: 50860000 },
    { id: 'w5', weekLabel: 'Week 5', monthLabel: 'May 2025', value: 39520000 },
  ],
  highlightedPointId: 'w2',
} as const;

export type DonutSegment = {
  id: string;
  label: string;
  pct: number;
  color: 'primary' | 'secondary' | 'ink';
};

export const progressDonut = {
  title: 'Progress',
  center: { value: 87, label: 'Project Finished' },
  segments: [
    { id: 'completed', label: 'Completed', pct: 50, color: 'primary' },
    { id: 'active', label: 'Active', pct: 20, color: 'secondary' },
    { id: 'priority', label: 'Priority', pct: 12.5, color: 'ink' },
  ] satisfies DonutSegment[],
} as const;

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
  rows: [
    {
      id: 'proj-01',
      client: { name: 'Acme Logistics', handle: '@acme' },
      task: { title: 'Fractional CFO kickoff', subtitle: 'Budget model + runway' },
      dueOn: 'Feb 27, 2026',
      status: 'onReview',
      priority: true,
    },
    {
      id: 'proj-02',
      client: { name: 'Horizon Health', handle: '@horizon' },
      task: { title: 'Ops automation sprint', subtitle: 'SOPs + Zapier flows' },
      dueOn: 'Mar 02, 2026',
      status: 'onProgress',
      priority: true,
    },
    {
      id: 'proj-03',
      client: { name: 'Nimbus Studio', handle: '@nimbus' },
      task: { title: 'PM playbook rollout', subtitle: 'Templates + rituals' },
      dueOn: 'Mar 05, 2026',
      status: 'onProgress',
      priority: false,
    },
    {
      id: 'proj-04',
      client: { name: 'Vertex Retail', handle: '@vertex' },
      task: { title: 'Growth analytics audit', subtitle: 'Dashboards + KPIs' },
      dueOn: 'Mar 07, 2026',
      status: 'onReview',
      priority: false,
    },
    {
      id: 'proj-05',
      client: { name: 'Evergreen AI', handle: '@evergreen' },
      task: { title: 'Hiring scorecard', subtitle: 'Interview loops' },
      dueOn: 'Mar 10, 2026',
      status: 'onProgress',
      priority: false,
    },
    {
      id: 'proj-06',
      client: { name: 'Silverline Fintech', handle: '@silverline' },
      task: { title: 'Reporting cadence', subtitle: 'Weekly exec updates' },
      dueOn: 'Mar 12, 2026',
      status: 'onReview',
      priority: false,
    },
  ] satisfies ProjectRow[],
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

export const performanceEvaluation = {
  title: 'Performance Evaluation',
  rating: 8.2,
  ratingLabel: 'Average Rating',
  note: 'Highlight improvement areas by expert.',
  distribution: [
    { id: 'excellent', label: 'Excellent', pct: 50, color: 'primary' },
    { id: 'good', label: 'Good', pct: 30, color: 'secondary' },
    { id: 'fair', label: 'Fair', pct: 20, color: 'ink' },
  ],
} as const;

export const promoLearning = {
  headline: 'Get matched with vetted experts in as little as 48 hours.',
  supporting: 'No long contracts • Vetted experts • Measurable outcomes',
  ctaLabel: 'Learn More',
} as const;
