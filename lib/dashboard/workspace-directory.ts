export const WORKSPACE_DIRECTORY_VERSION = 2 as const;
export const WORKSPACE_DIRECTORY_COOKIE_KEY = 'altvina.dashboard.workspaceDirectory' as const;
export const WORKSPACE_DIRECTORY_STORAGE_KEY = 'altvina.dashboard.workspaceDirectory' as const;

export type WorkspaceLifecycleStatus = 'active' | 'archived';

export type WorkspaceDirectoryCustomEntry = {
  id: string;
  name: string;
  clientLabel: string;
  ownerIdentityId: string;
  description?: string;
  status: WorkspaceLifecycleStatus;
  createdAt: string;
  analyticsEnabled?: boolean;
};

export type WorkspaceDirectorySeedOverride = {
  name?: string;
  clientLabel?: string;
  ownerIdentityId?: string;
  status?: WorkspaceLifecycleStatus;
  description?: string;
};

export type WorkspaceOwnerProfile = {
  name: string;
  email?: string;
  initials?: string;
};

export type WorkspaceDirectoryV1 = {
  version: typeof WORKSPACE_DIRECTORY_VERSION;
  customWorkspaces: WorkspaceDirectoryCustomEntry[];
  seedOverrides: Record<string, WorkspaceDirectorySeedOverride>;
  ownerProfiles: Record<string, WorkspaceOwnerProfile>;
};

export function defaultWorkspaceDirectory(): WorkspaceDirectoryV1 {
  return {
    version: WORKSPACE_DIRECTORY_VERSION,
    customWorkspaces: [],
    seedOverrides: {},
    ownerProfiles: {},
  };
}

export function encodeWorkspaceDirectoryCookie(value: WorkspaceDirectoryV1) {
  return encodeURIComponent(JSON.stringify(value));
}

export function decodeWorkspaceDirectoryCookie(raw: string): WorkspaceDirectoryV1 | null {
  try {
    const decoded = decodeURIComponent(raw);
    const json = JSON.parse(decoded) as Partial<WorkspaceDirectoryV1> | null;
    if (json?.version !== WORKSPACE_DIRECTORY_VERSION) {
      return null;
    }
    if (!Array.isArray(json.customWorkspaces)) {
      return null;
    }
    if (!json.seedOverrides || typeof json.seedOverrides !== 'object') {
      return null;
    }
    const ownerProfilesRaw = json.ownerProfiles;
    const ownerProfiles =
      ownerProfilesRaw && typeof ownerProfilesRaw === 'object'
        ? Object.fromEntries(
            Object.entries(ownerProfilesRaw).flatMap(([id, profile]) => {
              if (!id || !profile || typeof profile !== 'object') {
                return [];
              }
              const maybeName = (profile as WorkspaceOwnerProfile).name?.trim();
              if (!maybeName) {
                return [];
              }
              return [
                [
                  id,
                  {
                    name: maybeName,
                    email: (profile as WorkspaceOwnerProfile).email?.trim() || undefined,
                    initials:
                      (profile as WorkspaceOwnerProfile).initials?.trim() || undefined,
                  },
                ],
              ];
            }),
          )
        : {};
    return {
      version: WORKSPACE_DIRECTORY_VERSION,
      customWorkspaces: json.customWorkspaces,
      seedOverrides: json.seedOverrides,
      ownerProfiles,
    };
  } catch {
    return null;
  }
}

export function readWorkspaceDirectoryFromCookieValue(
  raw: string | undefined,
): WorkspaceDirectoryV1 | null {
  if (!raw) return null;
  return decodeWorkspaceDirectoryCookie(raw);
}
