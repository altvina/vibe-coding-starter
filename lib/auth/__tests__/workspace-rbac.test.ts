import { describe, expect, it } from 'vitest';

import {
  getActiveWorkspaceMembership,
  hasWorkspacePermission,
  hasWorkspaceRole,
  permissionsForMembership,
  requireWorkspaceAccess,
} from '../workspace-rbac';
import type { WorkspaceMembership } from '../workspace-types';

const baseMemberships: WorkspaceMembership[] = [
  {
    id: 'm-1',
    userId: 'u-test',
    workspaceId: 'ws-acme',
    role: 'contractor',
    status: 'active',
    toolAccess: {
      canAccessDash: true,
      canAccessPlane: true,
      canAccessMattermost: true,
      canPostUpdates: true,
      canCreateTasks: true,
      canManageWorkspaceUsers: false,
    },
    joinedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'm-2',
    userId: 'u-test',
    workspaceId: 'ws-horizon',
    role: 'client',
    status: 'active',
    toolAccess: {
      canAccessDash: true,
      canAccessPlane: false,
      canAccessMattermost: false,
      canPostUpdates: true,
      canCreateTasks: false,
      canManageWorkspaceUsers: false,
    },
    joinedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'm-3',
    userId: 'u-test',
    workspaceId: 'ws-vertex',
    role: 'contractor',
    status: 'removed',
    toolAccess: {
      canAccessDash: true,
      canAccessPlane: true,
      canAccessMattermost: true,
      canPostUpdates: true,
      canCreateTasks: true,
      canManageWorkspaceUsers: false,
    },
    joinedAt: '2026-01-01T00:00:00.000Z',
  },
];

describe('workspace-scoped RBAC', () => {
  it('supports different roles across workspaces for one user', () => {
    const acme = getActiveWorkspaceMembership(baseMemberships, 'ws-acme');
    const horizon = getActiveWorkspaceMembership(baseMemberships, 'ws-horizon');
    expect(acme?.role).toBe('contractor');
    expect(horizon?.role).toBe('client');
  });

  it('enforces contractor exclusion on removed membership', () => {
    const result = requireWorkspaceAccess({
      memberships: baseMemberships,
      workspaceId: 'ws-vertex',
      requireDashTool: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('inactive_membership');
    }
  });

  it('keeps client restricted from projects gateway and task creation', () => {
    expect(
      hasWorkspacePermission(baseMemberships, 'ws-horizon', 'canAccessPlane'),
    ).toBe(false);
    expect(
      hasWorkspacePermission(baseMemberships, 'ws-horizon', 'canCreateTasks'),
    ).toBe(false);
    expect(
      hasWorkspacePermission(baseMemberships, 'ws-horizon', 'canPostUpdates'),
    ).toBe(true);
  });

  it('recalculates permissions when switching workspaces', () => {
    const contractorPerms = permissionsForMembership(baseMemberships[0]);
    const clientPerms = permissionsForMembership(baseMemberships[1]);
    expect(contractorPerms.canEditTasks).toBe(true);
    expect(clientPerms.canEditTasks).toBe(false);
  });

  it('blocks unauthorized deep links when membership does not exist', () => {
    const result = requireWorkspaceAccess({
      memberships: baseMemberships,
      workspaceId: 'ws-missing',
      requireDashTool: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('missing_membership');
    }
  });

  it('supports role-sensitive visibility checks for hidden actions', () => {
    expect(
      hasWorkspaceRole(baseMemberships, 'ws-acme', ['contractor']),
    ).toBe(true);
    expect(
      hasWorkspaceRole(baseMemberships, 'ws-horizon', ['internal']),
    ).toBe(false);
    expect(
      hasWorkspacePermission(
        baseMemberships,
        'ws-horizon',
        'canManageWorkspaceUsers',
      ),
    ).toBe(false);
  });
});

