import type { DashboardApiResponse } from '@/app/dashboard/dashboard-context';
import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import { Briefcase } from 'lucide-react';
import CustomLink from '@/components/shared/Link';
import type { DashboardModuleDefinition } from '@/app/dashboard/modules/types';

function CrmWidget({ data }: { data: DashboardApiResponse }) {
  return (
    <DashboardCard title="CRM">
      <div className={dashboardTokens.textMuted}>
        <span className="text-sm">Leads, deals, pipelines, and activities. Internal staff only.</span>
      </div>
      <CustomLink
        href="/dashboard/crm"
        className="mt-3 flex items-center gap-2 text-sm font-medium text-primary-600 dark:text-primary-400"
      >
        <Briefcase className="h-4 w-4" />
        Open CRM
      </CustomLink>
    </DashboardCard>
  );
}

export const crmModule: DashboardModuleDefinition = {
  id: 'crm',
  label: 'CRM',
  href: '/dashboard/crm',
  allowedRoles: ['staff_admin', 'super_admin'],
  navOrder: 28,
  widgets: [
    {
      id: 'crm.preview',
      moduleId: 'crm',
      title: 'CRM',
      href: '/dashboard/crm',
      allowedRoles: ['staff_admin', 'super_admin'],
      defaultSize: 'md',
      render: ({ data }) => <CrmWidget data={data} />,
    },
  ],
};
