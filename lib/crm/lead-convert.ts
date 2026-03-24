import 'server-only';

import type { PoolClient } from 'pg';
import { evaluateWorkflowRules } from './workflow-engine';
import type { ConvertLeadToDealBody } from './types';

export interface ConvertLeadResult {
  deal_id: string;
  person_id: string | null;
  organization_id: string | null;
}

/**
 * Converts a lead into a deal: ensures person/org exist, creates deal in given pipeline/stage,
 * marks lead as qualified. Caller must run inside a transaction (same client).
 */
export async function convertLeadToDeal(
  client: PoolClient,
  leadId: string,
  body: ConvertLeadToDealBody
): Promise<ConvertLeadResult> {
  const { rows: leads } = await client.query(
    `SELECT id, person_id, organization_id, title, owner_id FROM crm_leads WHERE id = $1`,
    [leadId]
  );
  if (leads.length === 0) throw new Error('Lead not found');

  const lead = leads[0];
  let personId = lead.person_id as string | null;
  const organizationId = lead.organization_id as string | null;

  if (!personId && !organizationId) {
    const [p] = (
      await client.query(
        `INSERT INTO crm_people (first_name, last_name) VALUES ('Lead', $1) RETURNING id`,
        [lead.title]
      )
    ).rows;
    personId = p.id;
  }

  const stageId =
    body.stage_id ??
    (
      await client.query(
        `SELECT id FROM crm_stages WHERE pipeline_id = $1 ORDER BY order_index ASC LIMIT 1`,
        [body.pipeline_id]
      )
    ).rows[0]?.id;
  if (!stageId) throw new Error('Pipeline has no stages');

  const { rows: dealRows } = await client.query(
    `INSERT INTO crm_deals (title, person_id, organization_id, pipeline_id, stage_id, value, currency, owner_id)
     VALUES ($1, $2, $3, $4, $5, 0, 'USD', $6)
     RETURNING id`,
    [
      body.deal_title ?? lead.title,
      personId,
      organizationId,
      body.pipeline_id,
      stageId,
      body.owner_id,
    ]
  );
  const dealId = dealRows[0].id;

  await client.query(
    `UPDATE crm_leads SET status = 'qualified', updated_at = now() WHERE id = $1`,
    [leadId]
  );

  await evaluateWorkflowRules(client, 'deal_created', {
    deal_id: dealId,
    pipeline_id: body.pipeline_id,
    stage_id: stageId,
    owner_id: body.owner_id,
  });

  return { deal_id: dealId, person_id: personId, organization_id: organizationId };
}
