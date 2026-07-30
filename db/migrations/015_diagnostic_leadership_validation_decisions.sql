CREATE TABLE app_operations.diagnostic_leadership_validations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  diagnostic_id uuid NOT NULL,
  finding_id uuid NOT NULL,
  validator_clerk_user_id text NOT NULL CHECK (char_length(validator_clerk_user_id) BETWEEN 1 AND 200),
  validation_version text NOT NULL,
  response_payload jsonb NOT NULL CHECK (jsonb_typeof(response_payload) = 'object'),
  decision text NOT NULL CHECK (decision IN ('accepted', 'revision-required')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, id),
  UNIQUE (workspace_id, diagnostic_id),
  FOREIGN KEY (workspace_id, diagnostic_id)
    REFERENCES app_shared.diagnostics(workspace_id, id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id, finding_id)
    REFERENCES app_shared.diagnostic_findings(workspace_id, id) ON DELETE RESTRICT
);

ALTER TABLE app_operations.diagnostic_leadership_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_operations.diagnostic_leadership_validations FORCE ROW LEVEL SECURITY;

CREATE POLICY diagnostic_leadership_validation_tenant_policy
  ON app_operations.diagnostic_leadership_validations
  USING (workspace_id = app_identity.current_workspace_id())
  WITH CHECK (workspace_id = app_identity.current_workspace_id());

GRANT SELECT, INSERT ON app_operations.diagnostic_leadership_validations TO capacity_workspace_app;

