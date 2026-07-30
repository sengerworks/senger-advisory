CREATE TABLE app_shared.capacity_operating_briefs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  diagnostic_id uuid NOT NULL,
  finding_id uuid NOT NULL,
  intervention_id uuid NOT NULL,
  brief_version text NOT NULL,
  brief_payload jsonb NOT NULL CHECK (jsonb_typeof(brief_payload) = 'object'),
  status text NOT NULL CHECK (status IN ('active', 'completed')),
  activated_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, id),
  UNIQUE (workspace_id, diagnostic_id),
  FOREIGN KEY (workspace_id, diagnostic_id) REFERENCES app_shared.diagnostics(workspace_id, id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id, finding_id) REFERENCES app_shared.diagnostic_findings(workspace_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, intervention_id) REFERENCES app_shared.diagnostic_interventions(workspace_id, id) ON DELETE RESTRICT
);

ALTER TABLE app_shared.capacity_operating_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_shared.capacity_operating_briefs FORCE ROW LEVEL SECURITY;
CREATE POLICY capacity_operating_brief_tenant_policy ON app_shared.capacity_operating_briefs
  USING (workspace_id = app_identity.current_workspace_id())
  WITH CHECK (workspace_id = app_identity.current_workspace_id());
GRANT SELECT, INSERT, UPDATE ON app_shared.capacity_operating_briefs TO capacity_workspace_app;

