import 'server-only';

import { Pool } from 'pg';

import type {
  ActionRequestLinkType,
  ActionRequestPriority,
  ActionRequestRecord,
  ActionRequestTaskForType,
  ActionRequestStatus,
} from '@/lib/action-requests';

declare global {
  var __altvinaActionRequestsPool: Pool | undefined;
}

type ActionRequestRow = {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  requested_from_type: ActionRequestTaskForType;
  requested_from_id: string | null;
  context_label: string | null;
  priority: ActionRequestPriority;
  due_date: string | Date | null;
  status: ActionRequestStatus;
  link_type: ActionRequestLinkType;
  link_target: string;
  sort_order: number | null;
  created_by: string;
  updated_by: string;
  created_at: string | Date;
  updated_at: string | Date;
  resolved_at: string | Date | null;
};

type ActionRequestPatch = Partial<{
  workspaceId: string;
  title: string;
  description: string | null;
  taskForType: ActionRequestTaskForType;
  targetId: string | null;
  targetLabel: string | null;
  contextLabel: string | null;
  priority: ActionRequestPriority;
  dueDate: string | null;
  status: ActionRequestStatus;
  linkType: ActionRequestLinkType;
  linkTarget: string;
  sortOrder: number | null;
  resolvedAt: string | null;
}>;

function toIso(value: string | Date | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function mapRow(row: ActionRequestRow): ActionRequestRecord {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    title: row.title,
    description: row.description,
    taskForType: row.requested_from_type,
    targetId: row.requested_from_id,
    targetLabel: null,
    requesterId: row.created_by,
    requesterName: null,
    contextLabel: row.context_label,
    priority: row.priority,
    dueDate: toIso(row.due_date),
    status: row.status,
    linkType: row.link_type,
    linkTarget: row.link_target,
    sortOrder: row.sort_order,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: toIso(row.updated_at) ?? new Date().toISOString(),
    resolvedAt: toIso(row.resolved_at),
  };
}

function getPool() {
  if (globalThis.__altvinaActionRequestsPool) return globalThis.__altvinaActionRequestsPool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured.');
  }
  globalThis.__altvinaActionRequestsPool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  });
  return globalThis.__altvinaActionRequestsPool;
}

export async function listWorkspaceActionRequests(args: {
  workspaceId: string;
  status?: ActionRequestStatus;
  statuses?: ActionRequestStatus[];
  limit?: number;
}) {
  const pool = getPool();
  const values: Array<string | number | string[]> = [args.workspaceId];
  let sql = `
    select *
    from action_requests
    where workspace_id = $1
  `;

  if (args.statuses?.length) {
    values.push(args.statuses);
    sql += ` and status = any($${values.length}::text[])`;
  } else if (args.status) {
    values.push(args.status);
    sql += ` and status = $${values.length}`;
  }

  sql += `
    order by
      case when sort_order is null then 1 else 0 end asc,
      sort_order asc,
      case priority
        when 'high' then 3
        when 'medium' then 2
        else 1
      end desc,
      due_date asc nulls last,
      created_at desc
  `;

  if (typeof args.limit === 'number' && Number.isFinite(args.limit) && args.limit > 0) {
    values.push(Math.min(Math.max(Math.round(args.limit), 1), 100));
    sql += ` limit $${values.length}`;
  }

  const result = await pool.query<ActionRequestRow>(sql, values);
  return result.rows.map(mapRow);
}

export async function createActionRequest(
  input: Omit<ActionRequestRecord, 'createdAt' | 'updatedAt'>,
) {
  const pool = getPool();
  const result = await pool.query<ActionRequestRow>(
    `
      insert into action_requests (
        id,
        workspace_id,
        title,
        description,
        requested_from_type,
        requested_from_id,
        context_label,
        priority,
        due_date,
        status,
        link_type,
        link_target,
        sort_order,
        created_by,
        updated_by,
        resolved_at
      )
      values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16
      )
      returning *
    `,
    [
      input.id,
      input.workspaceId,
      input.title,
      input.description ?? null,
      input.taskForType,
      input.targetId ?? null,
      input.contextLabel ?? null,
      input.priority,
      input.dueDate ?? null,
      input.status,
      input.linkType,
      input.linkTarget,
      input.sortOrder ?? null,
      input.createdBy,
      input.updatedBy,
      input.resolvedAt ?? null,
    ],
  );
  return mapRow(result.rows[0]);
}

export async function updateActionRequest(args: {
  id: string;
  updatedBy: string;
  patch: ActionRequestPatch;
}) {
  const entries = Object.entries(args.patch).filter(([, value]) => value !== undefined);
  if (!entries.length) {
    throw new Error('No fields to update.');
  }

  const columnByKey: Record<keyof ActionRequestPatch, string> = {
    workspaceId: 'workspace_id',
    title: 'title',
    description: 'description',
    taskForType: 'requested_from_type',
    targetId: 'requested_from_id',
    targetLabel: 'context_label',
    contextLabel: 'context_label',
    priority: 'priority',
    dueDate: 'due_date',
    status: 'status',
    linkType: 'link_type',
    linkTarget: 'link_target',
    sortOrder: 'sort_order',
    resolvedAt: 'resolved_at',
  };

  const values: Array<string | number | null> = [args.id];
  const assignments = entries.map(([key, value]) => {
    const column = columnByKey[key as keyof ActionRequestPatch];
    values.push(value as string | number | null);
    return `${column} = $${values.length}`;
  });

  values.push(args.updatedBy);
  const updatedByParam = values.length;

  const pool = getPool();
  const result = await pool.query<ActionRequestRow>(
    `
      update action_requests
      set
        ${assignments.join(', ')},
        updated_by = $${updatedByParam},
        updated_at = now()
      where id = $1
      returning *
    `,
    values,
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error('Action request not found.');
  }
  return mapRow(row);
}
