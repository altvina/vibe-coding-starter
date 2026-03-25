import type { DashboardIdentitySeed } from '@/app/dashboard/dashboard-identities';
import {
  mergeDirectoryCustomWorkspaceSeeds,
  resolveWorkspaceSeedById,
  workspaceSeeds,
  type WorkspaceSeedMember,
} from '@/lib/dashboard/workspace-seeds';
import type { WorkspaceDirectoryV1 } from '@/lib/dashboard/workspace-directory';
import { buildWorkspaceSeedWithViewer } from '@/lib/dashboard/build-workspace-seed-with-viewer';
import { getMembershipSeedsForIdentity } from '@/lib/auth/mock-memberships';
import { applyMemberAliasesToWorkspaceSeed } from '@/lib/member-duplicates/apply-aliases';
import { getAppliedAliasesForWorkspace } from '@/lib/server/member-merge-proposals-store';
import type { WorkspaceRole } from '@/lib/auth/workspace-types';

/**
 * Roster rows an admin viewer would see (custom-workspace injection + approved merge aliases).
 */
export async function getAdminWorkspaceRosterForScan(args: {
  workspaceId: string;
  directory: WorkspaceDirectoryV1 | null;
  identity: DashboardIdentitySeed;
  identityId: string;
  activeRole: WorkspaceRole;
}): Promise<WorkspaceSeedMember[]> {
  const merged = mergeDirectoryCustomWorkspaceSeeds(workspaceSeeds, args.directory);
  const baseSeed = resolveWorkspaceSeedById(args.workspaceId, args.directory, merged);
  if (!baseSeed) {
    return [];
  }

  const customWorkspaceEntry = Boolean(
    args.directory?.customWorkspaces?.some((entry) => entry.id === args.workspaceId),
  );

  const staffOverride = getMembershipSeedsForIdentity(args.identityId, args.directory).find(
    (seed) => seed.workspaceId === args.workspaceId,
  )?.memberIdByAudience?.staff;

  const withViewer = buildWorkspaceSeedWithViewer({
    workspaceSeed: baseSeed,
    identity: args.identity,
    identityId: args.identityId,
    activeWorkspaceId: args.workspaceId,
    activeRole: args.activeRole,
    hasCustomWorkspaceEntry: customWorkspaceEntry,
    staffMemberIdOverride: staffOverride,
  });

  const aliases = await getAppliedAliasesForWorkspace(args.workspaceId);
  return applyMemberAliasesToWorkspaceSeed(withViewer, aliases).members;
}
