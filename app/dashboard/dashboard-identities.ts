export type DashboardIdentitySeed = {
  id: string;
  name: string;
  email: string;
  initials: string;
};

export const dashboardIdentityStorageKey = 'altvina.dashboard.identity' as const;

export const dashboardIdentitySeeds: DashboardIdentitySeed[] = [
  {
    id: 'u-admin',
    name: 'Avery Admin',
    email: 'avery@altvina.com',
    initials: 'AA',
  },
  {
    id: 'u-internal',
    name: 'Olivia Rodrigo',
    email: 'olivia@altvina.com',
    initials: 'OR',
  },
  {
    id: 'u-contractor',
    name: 'Alex Morgan',
    email: 'expert@altvina.pro',
    initials: 'AM',
  },
  {
    id: 'u-client',
    name: 'Jordan Taylor',
    email: 'owner@acme-logistics.com',
    initials: 'JT',
  },
  {
    id: 'u-viewer',
    name: 'Casey Observer',
    email: 'casey.observer@altvina.com',
    initials: 'CO',
  },
];

export const defaultDashboardIdentityId = dashboardIdentitySeeds[1].id;

export function isDashboardIdentityId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    dashboardIdentitySeeds.some((identity) => identity.id === value)
  );
}

