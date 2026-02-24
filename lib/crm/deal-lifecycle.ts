import 'server-only';

import type { PoolClient } from 'pg';
import { evaluateWorkflowRules } from './workflow-engine';

export async function moveDealToStage(
  client: PoolClient,
  dealId: string,
  stageId: string
): Promise<{ pipeline_id: string; previous_stage_id: string }> {
  const { rows: deals } = await client.query(
    `SELECT id, pipeline_id, stage_id, owner_id FROM crm_deals WHERE id = $1`,
    [dealId]
  );
  if (deals.length === 0) throw new Error('Deal not found');
  const deal = deals[0];
  const previousStageId = deal.stage_id;

  const { rows: stageRows } = await client.query(
    `SELECT id, pipeline_id FROM crm_stages WHERE id = $1`,
    [stageId]
  );
  if (stageRows.length === 0) throw new Error('Stage not found');
  if (stageRows[0].pipeline_id !== deal.pipeline_id) {
    throw new Error('Stage does not belong to deal pipeline');
  }

  await client.query(
    `UPDATE crm_deals SET stage_id = $1, updated_at = now() WHERE id = $2`,
    [stageId, dealId]
  );

  await evaluateWorkflowRules(client, 'deal_stage_changed', {
    deal_id: dealId,
    pipeline_id: deal.pipeline_id,
    stage_id: stageId,
    previous_stage_id: previousStageId,
    owner_id: deal.owner_id,
  });

  return { pipeline_id: deal.pipeline_id, previous_stage_id: previousStageId };
}

export async function markDealWon(client: PoolClient, dealId: string): Promise<void> {
  const { rowCount } = await client.query(
    `UPDATE crm_deals SET status = 'won', won_at = now(), updated_at = now() WHERE id = $1`,
    [dealId]
  );
  if (rowCount === 0) throw new Error('Deal not found');

  const { rows } = await client.query(
    `SELECT pipeline_id, stage_id, owner_id FROM crm_deals WHERE id = $1`,
    [dealId]
  );
  if (rows.length) {
    await evaluateWorkflowRules(client, 'deal_status_changed', {
      deal_id: dealId,
      pipeline_id: rows[0].pipeline_id,
      stage_id: rows[0].stage_id,
      status: 'won',
      owner_id: rows[0].owner_id,
    });
  }
}

export async function markDealLost(
  client: PoolClient,
  dealId: string,
  lostReason?: string
): Promise<void> {
  const { rowCount } = await client.query(
    `UPDATE crm_deals SET status = 'lost', lost_at = now(), lost_reason = $2, updated_at = now() WHERE id = $1`,
    [dealId, lostReason ?? null]
  );
  if (rowCount === 0) throw new Error('Deal not found');

  const { rows } = await client.query(
    `SELECT pipeline_id, stage_id, owner_id FROM crm_deals WHERE id = $1`,
    [dealId]
  );
  if (rows.length) {
    await evaluateWorkflowRules(client, 'deal_status_changed', {
      deal_id: dealId,
      pipeline_id: rows[0].pipeline_id,
      stage_id: rows[0].stage_id,
      status: 'lost',
      owner_id: rows[0].owner_id,
    });
  }
}
