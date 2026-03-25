import { NextResponse } from 'next/server';

import {
  requireWorkspaceAccess,
  type AccessFailureReason,
} from '@/lib/auth/workspace-rbac';
import type {
  WorkspaceMembership,
  WorkspacePermissionKey,
  WorkspaceRole,
} from '@/lib/auth/workspace-types';

const messages: Record<AccessFailureReason, { status: number; error: string }> = {
  missing_membership: {
    status: 403,
    error: 'Workspace access denied for this user.',
  },
  inactive_membership: {
    status: 403,
    error: 'Workspace membership is inactive.',
  },
  tool_denied: {
    status: 403,
    error: 'Tool access denied for this workspace.',
  },
  permission_denied: {
    status: 403,
    error: 'Missing required workspace permission.',
  },
  role_denied: {
    status: 403,
    error: 'Missing required workspace role.',
  },
};

export function guardWorkspaceAccess(args: {
  memberships: WorkspaceMembership[];
  workspaceId: string;
  requiredRoles?: WorkspaceRole[];
  requiredPermissions?: WorkspacePermissionKey[];
  requireDashTool?: boolean;
}) {
  const result = requireWorkspaceAccess(args);
  if (result.ok) {
    return { result, response: null } as const;
  }

  const mapped = messages[result.reason];
  return {
    result,
    response: NextResponse.json({ error: mapped.error }, { status: mapped.status }),
  } as const;
}

