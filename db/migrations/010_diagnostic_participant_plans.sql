CREATE TABLE app_private.diagnostic_participant_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  diagnostic_id uuid NOT NULL,
  discovery_version text NOT NULL,
  approved_payload jsonb NOT NULL CHECK (jsonb_typeof(approved_payload) = 'object'),
  approved_by_clerk_user_id text NOT NULL,
  approved_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, id),
  UNIQUE (workspace_id, diagnostic_id),
  FOREIGN KEY (workspace_id, diagnostic_id)
    REFERENCES app_shared.diagnostics(workspace_id, id) ON DELETE CASCADE
);

ALTER TABLE app_private.diagnostic_participant_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private.diagnostic_participant_plans FORCE ROW LEVEL SECURITY;

CREATE POLICY diagnostic_participant_plan_tenant_policy
  ON app_private.diagnostic_participant_plans
  USING (workspace_id = app_identity.current_workspace_id())
  WITH CHECK (workspace_id = app_identity.current_workspace_id());

GRANT SELECT, INSERT, UPDATE, DELETE
  ON app_private.diagnostic_participant_plans
  TO capacity_workspace_app;
