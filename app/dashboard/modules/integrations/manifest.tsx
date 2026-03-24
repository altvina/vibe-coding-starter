import type { DashboardApiResponse } from '@/app/dashboard/dashboard-context';
import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import type { DashboardModuleDefinition } from '@/app/dashboard/modules/types';
import { Badge } from '@/components/shared/ui/badge';
import { cn } from '@/lib/utils';
import { integrationToolConfigs } from '@/app/dashboard/modules/integrations/integrations-stub';

function IntegrationsWidget({ data }: { data: DashboardApiResponse }) {
  void data;

  return (
    <DashboardCard title="Launch Hub">
      <div className="space-y-3">
        <p className={cn('text-sm', dashboardTokens.textMuted)}>
          Launch workspace tools from one place.
        </p>
        <div className="space-y-2">
          {Object.values(integrationToolConfigs).map((tool) => (
            <div
              key={tool.id}
              className={cn(
                'flex items-center justify-between gap-2 rounded-lg border px-3 py-2',
                dashboardTokens.border,
                dashboardTokens.surfaceMuted,
              )}
            >
              <span className="text-sm font-medium">{tool.label}</span>
              <Badge variant="secondary">Launch</Badge>
            </div>
          ))}
        </div>
      </div>
    </DashboardCard>
  );
}

export const integrationsModule: DashboardModuleDefinition = {
  id: 'integrations',
  label: 'Launch Hub',
  href: '/dashboard/integrations',
  allowedRoles: ['client', 'expert', 'staff_admin', 'super_admin'],
  navOrder: 15,
  widgets: [
    {
      id: 'integrations.launchpad',
      moduleId: 'integrations',
      title: 'Launch Hub',
      href: '/dashboard/integrations',
      allowedRoles: ['client', 'expert', 'staff_admin', 'super_admin'],
      defaultSize: 'md',
      render: ({ data }) => <IntegrationsWidget data={data} />,
    },
  ],
};
