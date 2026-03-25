'use client';

import { useParams } from 'next/navigation';

import { WorkspaceAdminModulePage } from '@/app/dashboard/modules/workspace-admin/workspace-admin-workspace';

export default function WorkspaceAdminByIdPage() {
  const params = useParams();
  const workspaceId = typeof params.workspaceId === 'string' ? params.workspaceId : '';
  if (!workspaceId) {
    return null;
  }
  return <WorkspaceAdminModulePage workspaceId={workspaceId} />;
}
