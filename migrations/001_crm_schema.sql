-- CRM schema for Altvina internal staff dashboard (Pipedrive-style).
-- Requires: existing `users` table with (id, name, email, role).
-- If users does not exist, we create a minimal one for development.

-- Ensure users table exists (minimal dev stub if missing)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'staff_admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1. Pipelines
CREATE TABLE IF NOT EXISTS crm_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Stages (ordered per pipeline)
CREATE TABLE IF NOT EXISTS crm_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES crm_pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  default_probability INT NOT NULL DEFAULT 50 CHECK (default_probability >= 0 AND default_probability <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(pipeline_id, order_index)
);

CREATE INDEX IF NOT EXISTS idx_crm_stages_pipeline ON crm_stages(pipeline_id);

-- 3. Organizations
CREATE TABLE IF NOT EXISTS crm_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  industry TEXT,
  revenue NUMERIC,
  employee_count INT,
  website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. People (contacts)
CREATE TABLE IF NOT EXISTS crm_people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES crm_organizations(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  job_title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_people_org ON crm_people(organization_id);

-- 5. Leads
CREATE TYPE crm_lead_status AS ENUM ('new', 'working', 'qualified', 'unqualified');

CREATE TABLE IF NOT EXISTS crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES crm_people(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES crm_organizations(id) ON DELETE SET NULL,
  source TEXT,
  status crm_lead_status NOT NULL DEFAULT 'new',
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_leads_owner ON crm_leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON crm_leads(status);

-- 6. Deals
CREATE TYPE crm_deal_status AS ENUM ('open', 'won', 'lost');

CREATE TABLE IF NOT EXISTS crm_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  person_id UUID REFERENCES crm_people(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES crm_organizations(id) ON DELETE SET NULL,
  pipeline_id UUID NOT NULL REFERENCES crm_pipelines(id) ON DELETE RESTRICT,
  stage_id UUID NOT NULL REFERENCES crm_stages(id) ON DELETE RESTRICT,
  value NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status crm_deal_status NOT NULL DEFAULT 'open',
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  expected_close_date DATE,
  won_at TIMESTAMPTZ,
  lost_at TIMESTAMPTZ,
  lost_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_deals_pipeline_stage ON crm_deals(pipeline_id, stage_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_owner ON crm_deals(owner_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_status ON crm_deals(status);

-- 7. Activities
CREATE TYPE crm_activity_type AS ENUM ('call', 'meeting', 'email', 'task', 'other');

CREATE TABLE IF NOT EXISTS crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type crm_activity_type NOT NULL DEFAULT 'task',
  subject TEXT NOT NULL,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE SET NULL,
  person_id UUID REFERENCES crm_people(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES crm_organizations(id) ON DELETE SET NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  due_at TIMESTAMPTZ NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  done_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_activities_deal ON crm_activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_owner_due ON crm_activities(owner_id, due_at);

-- 8. Notes
CREATE TABLE IF NOT EXISTS crm_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES crm_deals(id) ON DELETE SET NULL,
  person_id UUID REFERENCES crm_people(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES crm_organizations(id) ON DELETE SET NULL,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_notes_deal ON crm_notes(deal_id);
CREATE INDEX IF NOT EXISTS idx_crm_notes_person ON crm_notes(person_id);
CREATE INDEX IF NOT EXISTS idx_crm_notes_org ON crm_notes(organization_id);

-- 9. Products
CREATE TABLE IF NOT EXISTS crm_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Deal products (line items)
CREATE TABLE IF NOT EXISTS crm_deal_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES crm_deals(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES crm_products(id) ON DELETE RESTRICT,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_deal_products_deal ON crm_deal_products(deal_id);

-- 11. Custom field definitions (Admin+)
CREATE TYPE crm_entity_type AS ENUM ('organization', 'person', 'lead', 'deal', 'activity', 'product');
CREATE TYPE crm_field_type AS ENUM ('text', 'number', 'date', 'boolean', 'select');

CREATE TABLE IF NOT EXISTS crm_custom_field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type crm_entity_type NOT NULL,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  field_type crm_field_type NOT NULL,
  options_json JSONB,
  is_required BOOLEAN NOT NULL DEFAULT false,
  order_index INT NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(entity_type, name)
);

CREATE INDEX IF NOT EXISTS idx_crm_custom_def_entity ON crm_custom_field_definitions(entity_type);

-- 12. Custom field values
CREATE TABLE IF NOT EXISTS crm_custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  definition_id UUID NOT NULL REFERENCES crm_custom_field_definitions(id) ON DELETE CASCADE,
  entity_type crm_entity_type NOT NULL,
  entity_id UUID NOT NULL,
  value_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(definition_id, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_crm_custom_values_entity ON crm_custom_field_values(entity_type, entity_id);

-- 13. Workflow rules
CREATE TYPE crm_workflow_trigger AS ENUM (
  'deal_created',
  'deal_stage_changed',
  'deal_status_changed',
  'activity_completed'
);

CREATE TABLE IF NOT EXISTS crm_workflow_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trigger_type crm_workflow_trigger NOT NULL,
  conditions_json JSONB NOT NULL DEFAULT '{}',
  actions_json JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_workflow_trigger ON crm_workflow_rules(trigger_type);
