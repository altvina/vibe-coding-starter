export type WorkspaceAudience = 'client' | 'expert' | 'staff';
export type WorkspaceDisplayMode = 'full' | 'masked' | 'hidden';

export type WorkspaceAudienceOverrides = {
  /** Legacy toggle; retained for backwards compatibility with older local config */
  visible?: boolean;
  /** Legacy alias key; `maskedName` is the canonical replacement */
  alias?: string;
  maskedName?: string;
  showTitle?: boolean;
  showBio?: boolean;
  displayMode?: WorkspaceDisplayMode;
};

export type WorkspaceMemberOverrides = Partial<Record<WorkspaceAudience, WorkspaceAudienceOverrides>>;

export type WorkspaceProjectMemberRoleOverride = {
  engagementRole?: string;
};

export type WorkspaceMemberProfileOverride = {
  displayName?: string;
  title?: string;
  role?: 'client' | 'expert' | 'staff';
  bio?: string;
  archived?: boolean;
  avatarUrl?: string;
  organizationLabel?: string;
};

export type WorkspaceConfigV1 = {
  version: 1;
  workspaces: Record<
    string,
    {
      memberOverrides: Record<string, WorkspaceMemberOverrides>;
      memberProfiles?: Record<string, WorkspaceMemberProfileOverride>;
      settings?: {
        analyticsEnabled?: boolean;
      };
      projectMembershipOverrides?: Record<
        string,
        Record<string, WorkspaceProjectMemberRoleOverride>
      >;
    }
  >;
};

export const WORKSPACE_CONFIG_VERSION = 1 as const;
export const WORKSPACE_CONFIG_STORAGE_KEY = 'altvina.dashboard.workspaceConfig' as const;
export const WORKSPACE_CONFIG_COOKIE_KEY = 'altvina.dashboard.workspaceConfig' as const;

export function defaultWorkspaceConfig(): WorkspaceConfigV1 {
  return { version: WORKSPACE_CONFIG_VERSION, workspaces: {} };
}

export function encodeWorkspaceConfigCookie(value: WorkspaceConfigV1) {
  return encodeURIComponent(JSON.stringify(value));
}

export function decodeWorkspaceConfigCookie(raw: string): WorkspaceConfigV1 | null {
  try {
    const decoded = decodeURIComponent(raw);
    const json = JSON.parse(decoded) as WorkspaceConfigV1;
    if (json?.version !== WORKSPACE_CONFIG_VERSION) return null;
    return json;
  } catch (e) {
    void e;
    return null;
  }
}

export function loadWorkspaceConfigFromLocalStorage(): WorkspaceConfigV1 {
  try {
    const raw = window.localStorage.getItem(WORKSPACE_CONFIG_STORAGE_KEY);
    if (!raw) return defaultWorkspaceConfig();
    const parsed = JSON.parse(raw) as WorkspaceConfigV1;
    if (parsed?.version !== WORKSPACE_CONFIG_VERSION) return defaultWorkspaceConfig();
    return parsed;
  } catch (e) {
    void e;
    return defaultWorkspaceConfig();
  }
}

export function saveWorkspaceConfigToLocalStorage(value: WorkspaceConfigV1) {
  try {
    window.localStorage.setItem(WORKSPACE_CONFIG_STORAGE_KEY, JSON.stringify(value));
  } catch (e) {
    void e;
  }
}

export function setWorkspaceConfigCookie(value: WorkspaceConfigV1) {
  try {
    const cookieValue = encodeWorkspaceConfigCookie(value);
    document.cookie = `${WORKSPACE_CONFIG_COOKIE_KEY}=${cookieValue}; path=/; SameSite=Lax`;
  } catch (e) {
    void e;
  }
}

