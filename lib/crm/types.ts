/** CRM entity types for custom fields and API. */
export type CrmEntityType =
  | 'organization'
  | 'person'
  | 'lead'
  | 'deal'
  | 'activity'
  | 'product';

export type CrmLeadStatus = 'new' | 'working' | 'qualified' | 'unqualified';
export type CrmDealStatus = 'open' | 'won' | 'lost';
export type CrmActivityType = 'call' | 'meeting' | 'email' | 'task' | 'other';
export type CrmFieldType = 'text' | 'number' | 'date' | 'boolean' | 'select';
export type CrmWorkflowTrigger =
  | 'deal_created'
  | 'deal_stage_changed'
  | 'deal_status_changed'
  | 'activity_completed';

export interface CrmUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface CrmPipeline {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CrmStage {
  id: string;
  pipeline_id: string;
  name: string;
  order_index: number;
  default_probability: number;
  created_at: string;
  updated_at: string;
}

export interface CrmOrganization {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  industry: string | null;
  revenue: number | null;
  employee_count: number | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmPerson {
  id: string;
  organization_id: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmLead {
  id: string;
  person_id: string | null;
  organization_id: string | null;
  source: string | null;
  status: CrmLeadStatus;
  owner_id: string;
  title: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmDeal {
  id: string;
  title: string;
  person_id: string | null;
  organization_id: string | null;
  pipeline_id: string;
  stage_id: string;
  value: number;
  currency: string;
  status: CrmDealStatus;
  owner_id: string;
  expected_close_date: string | null;
  won_at: string | null;
  lost_at: string | null;
  lost_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmActivity {
  id: string;
  type: CrmActivityType;
  subject: string;
  deal_id: string | null;
  person_id: string | null;
  organization_id: string | null;
  owner_id: string;
  due_at: string;
  done: boolean;
  done_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmNote {
  id: string;
  deal_id: string | null;
  person_id: string | null;
  organization_id: string | null;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CrmProduct {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface CrmDealProduct {
  id: string;
  deal_id: string;
  product_id: string;
  quantity: number;
  price: number;
  created_at: string;
  updated_at: string;
}

export interface CrmCustomFieldDefinition {
  id: string;
  entity_type: CrmEntityType;
  name: string;
  label: string;
  field_type: CrmFieldType;
  options_json: unknown;
  is_required: boolean;
  order_index: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CrmCustomFieldValue {
  id: string;
  definition_id: string;
  entity_type: CrmEntityType;
  entity_id: string;
  value_json: unknown;
  created_at: string;
  updated_at: string;
}

export interface CrmWorkflowRule {
  id: string;
  name: string;
  trigger_type: CrmWorkflowTrigger;
  conditions_json: Record<string, unknown>;
  actions_json: unknown[];
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/** API: pagination */
export interface CrmPagination {
  page: number;
  page_size: number;
  total: number;
}

/** API: lead convert to deal body */
export interface ConvertLeadToDealBody {
  pipeline_id: string;
  stage_id?: string;
  owner_id: string;
  deal_title?: string;
}

/** API: move deal stage body */
export interface MoveDealStageBody {
  stage_id: string;
}

/** API: mark deal won/lost body */
export interface MarkDealLostBody {
  lost_reason?: string;
}

/** Workflow action: create_activity */
export interface WorkflowActionCreateActivity {
  type: 'create_activity';
  activity_type: CrmActivityType;
  subject: string;
  due_in_days: number;
  assign_to_deal_owner?: boolean;
}
