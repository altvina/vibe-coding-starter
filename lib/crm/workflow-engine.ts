import 'server-only';

import type { PoolClient } from 'pg';
import type { CrmWorkflowTrigger } from './types';
import type { WorkflowActionCreateActivity } from './types';

export interface WorkflowContext {
  deal_id?: string;
  pipeline_id?: string;
  stage_id?: string;
  previous_stage_id?: string;
  status?: string;
  owner_id?: string;
  activity_id?: string;
}

/**
 * Evaluates workflow rules for a trigger and executes matching actions.
 * Conditions are checked against context (e.g. pipeline_id, stage_id); actions run in order.
 */
export async function evaluateWorkflowRules(
  client: PoolClient,
  triggerType: CrmWorkflowTrigger,
  context: WorkflowContext
): Promise<void> {
  const { rows: rules } = await client.query(
    `SELECT id, conditions_json, actions_json FROM crm_workflow_rules
     WHERE trigger_type = $1 AND is_active = true`,
    [triggerType]
  );

  for (const rule of rules) {
    const conditions = (rule.conditions_json as Record<string, unknown>) ?? {};
    if (!matchConditions(conditions, context)) continue;

    const actions = (rule.actions_json as unknown[]) ?? [];
    for (const action of actions) {
      await executeAction(client, action as Record<string, unknown>, context);
    }
  }
}

function matchConditions(conditions: Record<string, unknown>, ctx: WorkflowContext): boolean {
  if (conditions.pipeline_id != null && ctx.pipeline_id !== conditions.pipeline_id) return false;
  if (conditions.stage_id != null && ctx.stage_id !== conditions.stage_id) return false;
  if (conditions.status != null && ctx.status !== conditions.status) return false;
  if (conditions.owner_id != null && ctx.owner_id !== conditions.owner_id) return false;
  return true;
}

async function executeAction(
  client: PoolClient,
  action: Record<string, unknown>,
  context: WorkflowContext
): Promise<void> {
  const type = action.type as string;
  if (type === 'create_activity') {
    const a = action as unknown as WorkflowActionCreateActivity;
    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + (a.due_in_days ?? 1));
    const ownerId = a.assign_to_deal_owner && context.owner_id ? context.owner_id : context.owner_id;
    if (!ownerId) return;
    await client.query(
      `INSERT INTO crm_activities (type, subject, deal_id, owner_id, due_at, done)
       VALUES ($1, $2, $3, $4, $5, false)`,
      [
        a.activity_type ?? 'task',
        a.subject ?? 'Follow-up',
        context.deal_id ?? null,
        ownerId,
        dueAt.toISOString(),
      ]
    );
  }
}
