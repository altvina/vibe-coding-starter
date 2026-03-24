export type IntegrationToolId = 'chat' | 'projects';

export type WorkspaceLaunchMapping = {
  chatTeamSlug: string;
  projectsWorkspaceSlug: string;
  projectsProjectSlug?: string;
};

export type IntegrationToolConfig = {
  id: IntegrationToolId;
  label: string;
  description: string;
  destinationPath: (mapping: WorkspaceLaunchMapping) => string;
};

export type IntegrationLaunchConfig = {
  version: 1;
  baseUrls: Record<IntegrationToolId, string>;
  workspaceMappings: Record<string, WorkspaceLaunchMapping>;
};

const CONFIG_VERSION = 1 as const;
const INTEGRATION_CONFIG_STORAGE_KEY = 'altvina.dashboard.integrationLaunchConfig' as const;

export const integrationToolConfigs: Record<IntegrationToolId, IntegrationToolConfig> = {
  chat: {
    id: 'chat',
    label: 'Mattermost',
    description: 'Team messaging workspace for the active client context.',
    destinationPath: (mapping) => `/channels/${encodeURIComponent(mapping.chatTeamSlug)}`,
  },
  projects: {
    id: 'projects',
    label: 'Plane',
    description: 'Project execution workspace for the active client context.',
    destinationPath: (mapping) => {
      const workspaceSegment = `/workspace/${encodeURIComponent(mapping.projectsWorkspaceSlug)}`;
      if (!mapping.projectsProjectSlug) {
        return workspaceSegment;
      }
      return `${workspaceSegment}/projects/${encodeURIComponent(mapping.projectsProjectSlug)}`;
    },
  },
};

function defaultLaunchConfig(): IntegrationLaunchConfig {
  return {
    version: CONFIG_VERSION,
    baseUrls: {
      chat:
        process.env.NEXT_PUBLIC_CHAT_BASE_URL?.trim() ??
        process.env.NEXT_PUBLIC_TEAM_MESSAGING_BASE_URL?.trim() ??
        'https://mattermost.example.com',
      projects:
        process.env.NEXT_PUBLIC_PROJECTS_BASE_URL?.trim() ??
        process.env.NEXT_PUBLIC_WORK_PLANNING_BASE_URL?.trim() ??
        'https://plane.example.com',
    },
    workspaceMappings: {
      'ws-acme': {
        chatTeamSlug: 'acme-logistics',
        projectsWorkspaceSlug: 'acme-logistics',
        projectsProjectSlug: 'ops-automation-sprint',
      },
      'ws-horizon': {
        chatTeamSlug: 'horizon-health',
        projectsWorkspaceSlug: 'horizon-health',
        projectsProjectSlug: 'growth-analytics-audit',
      },
      'ws-vertex': {
        chatTeamSlug: 'vertex-retail',
        projectsWorkspaceSlug: 'vertex-retail',
        projectsProjectSlug: 'pm-playbook-rollout',
      },
      'ws-superadmin': {
        chatTeamSlug: 'platform-admin',
        projectsWorkspaceSlug: 'platform-admin',
        projectsProjectSlug: 'platform-operations',
      },
    },
  };
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

function coerceConfig(raw: unknown): IntegrationLaunchConfig {
  const fallback = defaultLaunchConfig();
  if (!raw || typeof raw !== 'object') {
    return fallback;
  }

  const parsed = raw as Partial<IntegrationLaunchConfig>;
  if (parsed.version !== CONFIG_VERSION) {
    return fallback;
  }

  return {
    version: CONFIG_VERSION,
    baseUrls: {
      chat: parsed.baseUrls?.chat?.trim() || fallback.baseUrls.chat,
      projects: parsed.baseUrls?.projects?.trim() || fallback.baseUrls.projects,
    },
    workspaceMappings: parsed.workspaceMappings ?? fallback.workspaceMappings,
  };
}

export function loadIntegrationLaunchConfig() {
  if (typeof window === 'undefined') {
    return defaultLaunchConfig();
  }
  try {
    const raw = window.localStorage.getItem(INTEGRATION_CONFIG_STORAGE_KEY);
    if (!raw) {
      return defaultLaunchConfig();
    }
    return coerceConfig(JSON.parse(raw));
  } catch (e) {
    void e;
    return defaultLaunchConfig();
  }
}

export function saveIntegrationLaunchConfig(config: IntegrationLaunchConfig) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(INTEGRATION_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    void e;
  }
}

export function resolveWorkspaceLaunch(
  toolId: IntegrationToolId,
  workspaceId: string,
  config = loadIntegrationLaunchConfig(),
) {
  const mapping = config.workspaceMappings[workspaceId];
  if (!mapping) {
    return null;
  }

  const tool = integrationToolConfigs[toolId];
  const baseUrl = config.baseUrls[toolId] ?? '';
  return {
    tool,
    mapping,
    baseUrl,
    url: `${normalizeBaseUrl(baseUrl)}${tool.destinationPath(mapping)}`,
  };
}
