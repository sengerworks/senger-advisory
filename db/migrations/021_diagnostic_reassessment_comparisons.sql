CREATE TABLE app_shared.diagnostic_reassessment_comparisons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  reassessment_plan_id uuid NOT NULL,
  baseline_diagnostic_id uuid NOT NULL,
  followup_diagnostic_id uuid NOT NULL,
  baseline_finding_id uuid NOT NULL,
  followup_finding_id uuid NOT NULL,
  comparison_version text NOT NULL,
  comparison_payload jsonb NOT NULL CHECK (jsonb_typeof(comparison_payload)='object'),
  change_assessment text NOT NULL CHECK (change_assessment IN ('material-shift','directional-shift','persistent','mixed','insufficient-evidence')),
  status text NOT NULL CHECK (status='released'),
  authored_by_clerk_user_id text NOT NULL,
  released_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id,id),
  UNIQUE (workspace_id,reassessment_plan_id),
  UNIQUE (workspace_id,followup_diagnostic_id),
  FOREIGN KEY (workspace_id,reassessment_plan_id) REFERENCES app_private.diagnostic_reassessment_plans(workspace_id,id) ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id,baseline_diagnostic_id) REFERENCES app_shared.diagnostics(workspace_id,id) ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id,followup_diagnostic_id) REFERENCES app_shared.diagnostics(workspace_id,id) ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id,baseline_finding_id) REFERENCES app_shared.diagnostic_findings(workspace_id,id) ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id,followup_finding_id) REFERENCES app_shared.diagnostic_findings(workspace_id,id) ON DELETE RESTRICT
);

ALTER TABLE app_shared.diagnostic_reassessment_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_shared.diagnostic_reassessment_comparisons FORCE ROW LEVEL SECURITY;
CREATE POLICY diagnostic_reassessment_comparison_tenant_policy ON app_shared.diagnostic_reassessment_comparisons
  USING (workspace_id=app_identity.current_workspace_id())
  WITH CHECK (workspace_id=app_identity.current_workspace_id());
GRANT SELECT,INSERT ON app_shared.diagnostic_reassessment_comparisons TO capacity_workspace_app;
