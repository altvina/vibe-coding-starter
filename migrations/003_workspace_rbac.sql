-- Workspace-scoped RBAC foundation for Dash.
-- Safe to run in local dev environments with no existing auth tables.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Minimal user table for Dash RBAC in local development.
-- If an existing users table is present, this statement is a no-op.
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workspace_membership_role') THEN
    CREATE TYPE workspace_membership_role AS ENUM (
      'admin',
      'internal',
      'contractor',
      'client',
      'viewer'
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workspace_membership_status') THEN
    CREATE TYPE workspace_membership_status AS ENUM (
      'active',
      'invited',
      'suspended',
      'removed'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS workspace_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  role workspace_membership_role NOT NULL DEFAULT 'viewer',
  status workspace_membership_status NOT NULL DEFAULT 'invited',
  tool_access JSONB NOT NULL DEFAULT jsonb_build_object(
    'canAccessDash', false,
    'canAccessPlane', false,
    'canAccessMattermost', false,
    'canPostUpdates', false,
    'canCreateTasks', false,
    'canManageWorkspaceUsers', false
  ),
  permissions_override JSONB,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, workspace_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_memberships_workspace_status
  ON workspace_memberships(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_workspace_memberships_user_status
  ON workspace_memberships(user_id, status);

-- Dev defaults that mirror dashboard workspace seeds.
INSERT INTO workspaces (slug, name, metadata)
VALUES
  ('super-admin', 'Super Admin', '{"origin":"dash-seed"}'::jsonb),
  ('acme-logistics', 'Acme Logistics', '{"origin":"dash-seed"}'::jsonb),
  ('horizon-health', 'Horizon Health', '{"origin":"dash-seed"}'::jsonb),
  ('vertex-retail', 'Vertex Retail', '{"origin":"dash-seed"}'::jsonb)
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  metadata = EXCLUDED.metadata,
  updated_at = now();

-- Safe role mapping from legacy global roles when a legacy role column exists.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    INSERT INTO workspace_memberships (
      user_id,
      workspace_id,
      role,
      status,
      tool_access,
      permissions_override
    )
    SELECT
      u.id,
      w.id,
      CASE
        WHEN u.role = 'super_admin' THEN 'admin'::workspace_membership_role
        WHEN u.role = 'staff_admin' THEN 'internal'::workspace_membership_role
        WHEN u.role = 'expert' THEN 'contractor'::workspace_membership_role
        WHEN u.role = 'client' THEN 'client'::workspace_membership_role
        ELSE 'viewer'::workspace_membership_role
      END AS role,
      'active'::workspace_membership_status AS status,
      CASE
        WHEN u.role = 'super_admin' THEN jsonb_build_object(
          'canAccessDash', true,
          'canAccessPlane', true,
          'canAccessMattermost', true,
          'canPostUpdates', true,
          'canCreateTasks', true,
          'canManageWorkspaceUsers', true
        )
        WHEN u.role = 'staff_admin' THEN jsonb_build_object(
          'canAccessDash', true,
          'canAccessPlane', true,
          'canAccessMattermost', true,
          'canPostUpdates', true,
          'canCreateTasks', true,
          'canManageWorkspaceUsers', true
        )
        WHEN u.role = 'expert' THEN jsonb_build_object(
          'canAccessDash', true,
          'canAccessPlane', true,
          'canAccessMattermost', true,
          'canPostUpdates', true,
          'canCreateTasks', true,
          'canManageWorkspaceUsers', false
        )
        WHEN u.role = 'client' THEN jsonb_build_object(
          'canAccessDash', true,
          'canAccessPlane', false,
          'canAccessMattermost', false,
          'canPostUpdates', true,
          'canCreateTasks', false,
          'canManageWorkspaceUsers', false
        )
        ELSE jsonb_build_object(
          'canAccessDash', true,
          'canAccessPlane', false,
          'canAccessMattermost', false,
          'canPostUpdates', false,
          'canCreateTasks', false,
          'canManageWorkspaceUsers', false
        )
      END AS tool_access,
      NULL::jsonb AS permissions_override
    FROM users u
    CROSS JOIN workspaces w
    WHERE
      -- Legacy super admins and staff get broad defaults.
      u.role IN ('super_admin', 'staff_admin')
      OR (
        -- Legacy experts and clients are scoped away from super-admin workspace by default.
        u.role IN ('expert', 'client')
        AND w.slug <> 'super-admin'
      )
    ON CONFLICT (user_id, workspace_id) DO NOTHING;
  END IF;
END
$$;
