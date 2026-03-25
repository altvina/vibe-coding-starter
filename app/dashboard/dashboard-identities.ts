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
    name: 'Jay Newcombe',
    email: 'jay@altvina.com',
    initials: 'JN',
  },
];

export const defaultDashboardIdentityId = dashboardIdentitySeeds[0]?.id ?? 'u-admin';

export function isDashboardIdentityId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    dashboardIdentitySeeds.some((identity) => identity.id === value)
  );
}

