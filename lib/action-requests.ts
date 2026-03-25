export const actionRequestStatuses = [
  'active',
  'in_progress',
  'waiting',
  'resolved',
  'archived',
] as const;
export type ActionRequestStatus = (typeof actionRequestStatuses)[number];

export const actionRequestPriorities = ['low', 'medium', 'high'] as const;
export type ActionRequestPriority = (typeof actionRequestPriorities)[number];

export const actionRequestTaskForTypes = [
  'person',
  'organization',
  'group',
  'projectTeam',
] as const;
export type ActionRequestTaskForType = (typeof actionRequestTaskForTypes)[number];

export const actionRequestGroupTypes = ['clients', 'experts', 'staff'] as const;
export type ActionRequestGroupType = (typeof actionRequestGroupTypes)[number];

export const actionRequestLinkTypes = [
  'project',
  'client',
  'inbox',
  'update',
  'admin',
  'custom',
] as const;
export type ActionRequestLinkType = (typeof actionRequestLinkTypes)[number];

export type ActionRequestRecord = {
  id: string;
  workspaceId: string;
  title: string;
  description?: string | null;
  taskForType: ActionRequestTaskForType;
  targetId?: string | null;
  targetLabel?: string | null;
  requesterId: string;
  requesterName?: string | null;
  contextLabel?: string | null;
  priority: ActionRequestPriority;
  dueDate?: string | null;
  status: ActionRequestStatus;
  linkType: ActionRequestLinkType;
  linkTarget: string;
  sortOrder?: number | null;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
};

export type DashboardActionRequest = ActionRequestRecord & {
  targetName?: string | null;
};

const priorityRank: Record<ActionRequestPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

function parseDateOrInfinity(value?: string | null) {
  if (!value) return Number.POSITIVE_INFINITY;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : Number.POSITIVE_INFINITY;
}

function parseDateOrZero(value?: string | null) {
  if (!value) return 0;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : 0;
}

export function sortActionRequests<T extends Pick<
  ActionRequestRecord,
  'sortOrder' | 'priority' | 'dueDate' | 'createdAt'
>>(rows: T[]) {
  return [...rows].sort((a, b) => {
    const aHasSortOrder = typeof a.sortOrder === 'number';
    const bHasSortOrder = typeof b.sortOrder === 'number';

    if (aHasSortOrder && bHasSortOrder) {
      if ((a.sortOrder as number) !== (b.sortOrder as number)) {
        return (a.sortOrder as number) - (b.sortOrder as number);
      }
    } else if (aHasSortOrder !== bHasSortOrder) {
      return aHasSortOrder ? -1 : 1;
    }

    if (priorityRank[a.priority] !== priorityRank[b.priority]) {
      return priorityRank[b.priority] - priorityRank[a.priority];
    }

    const dueDelta = parseDateOrInfinity(a.dueDate) - parseDateOrInfinity(b.dueDate);
    if (dueDelta !== 0) {
      return dueDelta;
    }

    return parseDateOrZero(b.createdAt) - parseDateOrZero(a.createdAt);
  });
}

export const actionRequestPriorityLabel: Record<ActionRequestPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const actionRequestTaskForLabel: Record<ActionRequestTaskForType, string> = {
  person: 'Specific person',
  organization: 'Entire organization',
  group: 'Role / group',
  projectTeam: 'Project team',
};

export const actionRequestOpenStatuses: ActionRequestStatus[] = [
  'active',
  'in_progress',
  'waiting',
];

export const actionRequestPipelineColumnOrder: ActionRequestStatus[] = [
  'active',
  'in_progress',
  'waiting',
  'resolved',
  'archived',
];

export const actionRequestStatusLabel: Record<ActionRequestStatus, string> = {
  active: 'Active',
  in_progress: 'In progress',
  waiting: 'Waiting',
  resolved: 'Resolved',
  archived: 'Archived',
};

export const actionRequestLinkCtaLabel: Record<ActionRequestLinkType, string> = {
  project: 'Open Project',
  client: 'Open Client',
  inbox: 'Open Inbox',
  update: 'Open Update',
  admin: 'Open Admin Item',
  custom: 'Open Link',
};
