import { NextResponse, type NextRequest } from 'next/server';

import { dashboardIdentitySeeds, isDashboardIdentityId } from '@/app/dashboard/dashboard-identities';
import {
  actionRequestLinkTypes,
  actionRequestPriorities,
  actionRequestTaskForTypes,
  actionRequestStatuses,
  type ActionRequestLinkType,
  type ActionRequestPriority,
  type ActionRequestTaskForType,
  type ActionRequestStatus,
} from '@/lib/action-requests';
import { getMembershipsForIdentity } from '@/lib/auth/mock-memberships';
import {
  readWorkspaceDirectoryFromCookieValue,
  WORKSPACE_DIRECTORY_COOKIE_KEY,
} from '@/lib/dashboard/workspace-directory';
import { guardWorkspaceAccess } from '@/lib/auth/require-workspace-access';
import {
  createActionRequest,
  listWorkspaceActionRequests,
  updateActionRequest,
} from '@/lib/server/action-requests-store';

function invalid(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function readWorkspaceDirectory(req: NextRequest) {
  return readWorkspaceDirectoryFromCookieValue(
    req.cookies.get(WORKSPACE_DIRECTORY_COOKIE_KEY)?.value,
  );
}

function parseIdentityAndWorkspace(req: NextRequest) {
  const identityId = req.nextUrl.searchParams.get('identityId');
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!isDashboardIdentityId(identityId)) {
    return { error: invalid('Invalid identityId.') } as const;
  }
  if (!workspaceId) {
    return { error: invalid('workspaceId is required.') } as const;
  }
  return { identityId, workspaceId } as const;
}

function parseOptionalEnum<T extends readonly string[]>(
  value: unknown,
  options: T,
): T[number] | undefined {
  if (value == null) return undefined;
  if (typeof value !== 'string') return undefined;
  return options.includes(value) ? (value as T[number]) : undefined;
}

function parseNullableString(value: unknown) {
  if (value == null) return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function parseSortOrder(value: unknown) {
  if (value == null || value === '') return null;
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.round(value);
}

function parseDueDate(value: unknown) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

export async function GET(req: NextRequest) {
  const params = parseIdentityAndWorkspace(req);
  if ('error' in params) return params.error;

  const memberships = getMembershipsForIdentity(params.identityId, readWorkspaceDirectory(req));
  const guard = guardWorkspaceAccess({
    memberships,
    workspaceId: params.workspaceId,
    requireDashTool: true,
  });
  if (guard.response) return guard.response;

  const status = parseOptionalEnum(req.nextUrl.searchParams.get('status'), actionRequestStatuses);
  const limitRaw = Number(req.nextUrl.searchParams.get('limit') ?? '');
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 100) : undefined;

  try {
    const rows = await listWorkspaceActionRequests({
      workspaceId: params.workspaceId,
      status,
      limit,
    });
    return NextResponse.json({ items: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load action requests.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const params = parseIdentityAndWorkspace(req);
  if ('error' in params) return params.error;

  const memberships = getMembershipsForIdentity(params.identityId, readWorkspaceDirectory(req));
  const guard = guardWorkspaceAccess({
    memberships,
    workspaceId: params.workspaceId,
    requiredRoles: ['internal'],
    requireDashTool: true,
  });
  if (guard.response) return guard.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch (error) {
    void error;
    return invalid('Invalid JSON body.');
  }

  const title = parseNullableString((body as { title?: unknown }).title);
  const linkTarget = parseNullableString((body as { linkTarget?: unknown }).linkTarget);
  const taskForType = parseOptionalEnum(
    (body as { taskForType?: unknown }).taskForType,
    actionRequestTaskForTypes,
  );
  const priority = parseOptionalEnum(
    (body as { priority?: unknown }).priority,
    actionRequestPriorities,
  );
  const status = parseOptionalEnum(
    (body as { status?: unknown }).status,
    actionRequestStatuses,
  );
  const linkType = parseOptionalEnum(
    (body as { linkType?: unknown }).linkType,
    actionRequestLinkTypes,
  );

  if (!title) return invalid('title is required.');
  if (!linkTarget) return invalid('linkTarget is required.');
  if (!taskForType) return invalid('taskForType is invalid.');
  if (!priority) return invalid('priority is invalid.');
  if (!status) return invalid('status is invalid.');
  if (!linkType) return invalid('linkType is invalid.');

  const identity = dashboardIdentitySeeds.find((seed) => seed.id === params.identityId);
  const actor = identity?.email ?? params.identityId;
  const now = new Date().toISOString();

  try {
    const created = await createActionRequest({
      id: `ar-${crypto.randomUUID()}`,
      workspaceId: params.workspaceId,
      title,
      description: parseNullableString((body as { description?: unknown }).description),
      taskForType: taskForType as ActionRequestTaskForType,
      targetId: parseNullableString((body as { targetId?: unknown }).targetId),
      targetLabel: parseNullableString((body as { targetLabel?: unknown }).targetLabel),
      requesterId: params.identityId,
      requesterName: identity?.name ?? null,
      contextLabel: parseNullableString((body as { contextLabel?: unknown }).contextLabel),
      priority: priority as ActionRequestPriority,
      dueDate: parseDueDate((body as { dueDate?: unknown }).dueDate),
      status: status as ActionRequestStatus,
      linkType: linkType as ActionRequestLinkType,
      linkTarget,
      sortOrder: parseSortOrder((body as { sortOrder?: unknown }).sortOrder),
      createdBy: actor,
      updatedBy: actor,
      resolvedAt: status === 'resolved' ? now : null,
    });
    return NextResponse.json({ item: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create action request.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const params = parseIdentityAndWorkspace(req);
  if ('error' in params) return params.error;

  const memberships = getMembershipsForIdentity(params.identityId, readWorkspaceDirectory(req));
  const guard = guardWorkspaceAccess({
    memberships,
    workspaceId: params.workspaceId,
    requiredRoles: ['internal'],
    requireDashTool: true,
  });
  if (guard.response) return guard.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch (error) {
    void error;
    return invalid('Invalid JSON body.');
  }

  const id = parseNullableString((body as { id?: unknown }).id);
  if (!id) return invalid('id is required.');

  const nextStatus = parseOptionalEnum(
    (body as { status?: unknown }).status,
    actionRequestStatuses,
  );
  const nextTaskForType = parseOptionalEnum(
    (body as { taskForType?: unknown }).taskForType,
    actionRequestTaskForTypes,
  );
  const nextPriority = parseOptionalEnum(
    (body as { priority?: unknown }).priority,
    actionRequestPriorities,
  );
  const nextLinkType = parseOptionalEnum(
    (body as { linkType?: unknown }).linkType,
    actionRequestLinkTypes,
  );
  const nextTitleValue = (body as { title?: unknown }).title;
  const nextLinkTargetValue = (body as { linkTarget?: unknown }).linkTarget;

  if (nextTitleValue != null && !parseNullableString(nextTitleValue)) {
    return invalid('title cannot be empty.');
  }
  if (nextLinkTargetValue != null && !parseNullableString(nextLinkTargetValue)) {
    return invalid('linkTarget cannot be empty.');
  }
  if ((body as { status?: unknown }).status != null && !nextStatus) {
    return invalid('status is invalid.');
  }
  if ((body as { taskForType?: unknown }).taskForType != null && !nextTaskForType) {
    return invalid('taskForType is invalid.');
  }
  if ((body as { priority?: unknown }).priority != null && !nextPriority) {
    return invalid('priority is invalid.');
  }
  if ((body as { linkType?: unknown }).linkType != null && !nextLinkType) {
    return invalid('linkType is invalid.');
  }

  const identity = dashboardIdentitySeeds.find((seed) => seed.id === params.identityId);
  const actor = identity?.email ?? params.identityId;
  const now = new Date().toISOString();
  const patch = {
    workspaceId: parseNullableString((body as { workspaceId?: unknown }).workspaceId) ?? undefined,
    title: parseNullableString(nextTitleValue) ?? undefined,
    description:
      (body as { description?: unknown }).description !== undefined
        ? parseNullableString((body as { description?: unknown }).description)
        : undefined,
    taskForType: nextTaskForType,
    targetId:
      (body as { targetId?: unknown }).targetId !== undefined
        ? parseNullableString((body as { targetId?: unknown }).targetId)
        : undefined,
    targetLabel:
      (body as { targetLabel?: unknown }).targetLabel !== undefined
        ? parseNullableString((body as { targetLabel?: unknown }).targetLabel)
        : undefined,
    contextLabel:
      (body as { contextLabel?: unknown }).contextLabel !== undefined
        ? parseNullableString((body as { contextLabel?: unknown }).contextLabel)
        : undefined,
    priority: nextPriority,
    dueDate:
      (body as { dueDate?: unknown }).dueDate !== undefined
        ? parseDueDate((body as { dueDate?: unknown }).dueDate)
        : undefined,
    status: nextStatus,
    linkType: nextLinkType,
    linkTarget: parseNullableString(nextLinkTargetValue) ?? undefined,
    sortOrder:
      (body as { sortOrder?: unknown }).sortOrder !== undefined
        ? parseSortOrder((body as { sortOrder?: unknown }).sortOrder)
        : undefined,
    resolvedAt:
      nextStatus != null ? (nextStatus === 'resolved' ? now : null) : undefined,
  };

  try {
    const updated = await updateActionRequest({
      id,
      patch,
      updatedBy: actor,
    });
    return NextResponse.json({ item: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update action request.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
