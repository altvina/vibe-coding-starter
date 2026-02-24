'use client';

import { useDashboardData } from '@/app/dashboard/dashboard-context';
import { ManageProjectsCard } from '@/app/dashboard/_components/manage-projects-card';

export function ProjectsContent() {
  const { data } = useDashboardData();

  if (!data) {
    return null;
  }

  return <ManageProjectsCard manageProjects={data.manageProjects} />;
}

