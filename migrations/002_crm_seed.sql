-- Seed data for CRM: default pipeline/stages, sample user, org, person, lead, deal, activities.
-- Safe to run multiple times (uses INSERT ... ON CONFLICT or checks).

-- Insert a default staff user if no user exists (for dev/demo)
INSERT INTO users (id, name, email, role)
SELECT gen_random_uuid(), 'CRM Staff', 'staff@altvina.com', 'staff_admin'
WHERE NOT EXISTS (SELECT 1 FROM users LIMIT 1);

-- Get or create first user for ownership (use first user by email)
DO $$
DECLARE
  uid UUID;
BEGIN
  SELECT id INTO uid FROM users WHERE role IN ('staff_admin', 'super_admin') LIMIT 1;
  IF uid IS NULL THEN
    SELECT id INTO uid FROM users LIMIT 1;
  END IF;
  IF uid IS NOT NULL THEN
    -- Default sales pipeline
    IF NOT EXISTS (SELECT 1 FROM crm_pipelines LIMIT 1) THEN
      INSERT INTO crm_pipelines (id, name, description, is_active)
      VALUES (gen_random_uuid(), 'Sales', 'Default sales pipeline', true);

      INSERT INTO crm_stages (pipeline_id, name, order_index, default_probability)
      SELECT id, 'Lead', 0, 10 FROM crm_pipelines WHERE name = 'Sales' LIMIT 1
      UNION ALL
      SELECT id, 'Qualified', 1, 25 FROM crm_pipelines WHERE name = 'Sales' LIMIT 1
      UNION ALL
      SELECT id, 'Proposal', 2, 50 FROM crm_pipelines WHERE name = 'Sales' LIMIT 1
      UNION ALL
      SELECT id, 'Negotiation', 3, 75 FROM crm_pipelines WHERE name = 'Sales' LIMIT 1
      UNION ALL
      SELECT id, 'Won', 4, 100 FROM crm_pipelines WHERE name = 'Sales' LIMIT 1;
    END IF;

    -- Sample organization and person (only if empty)
    IF NOT EXISTS (SELECT 1 FROM crm_organizations LIMIT 1) THEN
      INSERT INTO crm_organizations (id, name, city, country, industry, website)
      VALUES (gen_random_uuid(), 'Acme Corp', 'New York', 'USA', 'Technology', 'https://acme.example.com');

      INSERT INTO crm_people (organization_id, first_name, last_name, email, job_title)
      SELECT o.id, 'Jane', 'Smith', 'jane@acme.example.com', 'VP Sales'
      FROM crm_organizations o WHERE o.name = 'Acme Corp' LIMIT 1;

      INSERT INTO crm_leads (person_id, organization_id, source, status, owner_id, title, notes)
      SELECT p.id, p.organization_id, 'Website', 'working', uid, 'Acme Corp - Enterprise deal', 'Initial inquiry'
      FROM crm_people p WHERE p.email = 'jane@acme.example.com' LIMIT 1;

      INSERT INTO crm_deals (title, person_id, organization_id, pipeline_id, stage_id, value, currency, owner_id, expected_close_date)
      SELECT
        'Acme Corp - Enterprise',
        p.id,
        p.organization_id,
        pip.id,
        (SELECT id FROM crm_stages WHERE pipeline_id = pip.id AND order_index = 2 LIMIT 1),
        50000,
        'USD',
        uid,
        CURRENT_DATE + INTERVAL '30 days'
      FROM crm_people p
      CROSS JOIN crm_pipelines pip
      WHERE p.email = 'jane@acme.example.com' AND pip.name = 'Sales'
      LIMIT 1;

      INSERT INTO crm_activities (type, subject, deal_id, person_id, organization_id, owner_id, due_at, done)
      SELECT 'meeting', 'Discovery call', d.id, d.person_id, d.organization_id, uid, now() + INTERVAL '2 days', false
      FROM crm_deals d LIMIT 1;
    END IF;
  END IF;
END $$;
