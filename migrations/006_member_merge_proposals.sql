-- Member merge proposal workflow + applied aliases.

CREATE TABLE IF NOT EXISTS member_merge_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL,
  canonical_member_id TEXT NOT NULL,
  duplicate_member_id TEXT NOT NULL,
  signals JSONB NOT NULL DEFAULT '[]'::jsonb,
  approval_mode TEXT NOT NULL CHECK (approval_mode IN ('assigned_user', 'first_authorized_responder')),
  assigned_approver_identity_id TEXT,
  authorized_approver_identity_ids TEXT[] NOT NULL DEFAULT '{}'::text[],
  authorized_roles TEXT[] NOT NULL DEFAULT '{}'::text[],
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  decisions JSONB NOT NULL DEFAULT '[]'::jsonb,
  resolved_at TIMESTAMPTZ,
  resolved_by_identity_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (canonical_member_id <> duplicate_member_id)
);

-- Enforce one active proposal per pair (regardless of pair ordering).
CREATE UNIQUE INDEX IF NOT EXISTS uq_member_merge_proposals_active_pair
  ON member_merge_proposals (
    workspace_id,
    LEAST(canonical_member_id, duplicate_member_id),
    GREATEST(canonical_member_id, duplicate_member_id)
  )
  WHERE status IN ('pending', 'approved');

CREATE INDEX IF NOT EXISTS idx_member_merge_proposals_workspace_created
  ON member_merge_proposals(workspace_id, created_at DESC);

CREATE TABLE IF NOT EXISTS member_merge_aliases (
  workspace_id TEXT NOT NULL,
  duplicate_member_id TEXT NOT NULL,
  canonical_member_id TEXT NOT NULL,
  applied_by_identity_id TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, duplicate_member_id),
  CHECK (canonical_member_id <> duplicate_member_id)
);

CREATE INDEX IF NOT EXISTS idx_member_merge_aliases_workspace
  ON member_merge_aliases(workspace_id);
