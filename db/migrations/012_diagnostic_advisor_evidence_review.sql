CREATE TABLE app_operations.diagnostic_advisor_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  diagnostic_id uuid NOT NULL,
  advisor_clerk_user_id text NOT NULL CHECK (char_length(advisor_clerk_user_id) BETWEEN 1 AND 200),
  purpose text NOT NULL CHECK (char_length(purpose) BETWEEN 20 AND 500),
  assigned_by_clerk_user_id text NOT NULL CHECK (char_length(assigned_by_clerk_user_id) BETWEEN 1 AND 200),
  starts_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, id),
  FOREIGN KEY (workspace_id, diagnostic_id)
    REFERENCES app_shared.diagnostics(workspace_id, id) ON DELETE CASCADE,
  CHECK (expires_at > starts_at),
  CHECK (revoked_at IS NULL OR revoked_at >= starts_at)
);

CREATE UNIQUE INDEX diagnostic_advisor_active_assignment_idx
  ON app_operations.diagnostic_advisor_assignments
  (workspace_id, diagnostic_id, advisor_clerk_user_id)
  WHERE revoked_at IS NULL;

ALTER TABLE app_operations.diagnostic_advisor_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_operations.diagnostic_advisor_assignments FORCE ROW LEVEL SECURITY;

CREATE POLICY diagnostic_advisor_assignment_tenant_policy
  ON app_operations.diagnostic_advisor_assignments
  USING (workspace_id = app_identity.current_workspace_id())
  WITH CHECK (workspace_id = app_identity.current_workspace_id());

GRANT SELECT, INSERT, UPDATE, DELETE
  ON app_operations.diagnostic_advisor_assignments
  TO capacity_workspace_app;

ALTER TABLE app_private.diagnostic_evidence
  ADD COLUMN transformation_note text NOT NULL DEFAULT 'Legacy evidence record; transformation note unavailable.'
    CHECK (char_length(transformation_note) BETWEEN 20 AND 500),
  ADD COLUMN review_note text NOT NULL DEFAULT ''
    CHECK (char_length(review_note) <= 500),
  ADD COLUMN reviewed_by_clerk_user_id text;

ALTER TABLE app_private.diagnostic_evidence
  ADD CONSTRAINT diagnostic_evidence_review_actor_check
  CHECK ((review_status = 'pending') = (reviewed_by_clerk_user_id IS NULL));
