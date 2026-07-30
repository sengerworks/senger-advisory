CREATE TABLE app_private.diagnostic_reassessment_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  diagnostic_id uuid NOT NULL,
  brief_id uuid NOT NULL,
  source_review_id uuid NOT NULL,
  reassessment_version text NOT NULL,
  method_version text NOT NULL,
  protocol_snapshot jsonb NOT NULL CHECK (jsonb_typeof(protocol_snapshot) = 'object'),
  coverage_snapshot jsonb NOT NULL CHECK (jsonb_typeof(coverage_snapshot) = 'object'),
  target_at timestamptz NOT NULL,
  planning_note text NOT NULL CHECK (char_length(planning_note) BETWEEN 20 AND 1000),
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','collecting','completed')),
  created_by_clerk_user_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id,id),
  UNIQUE (workspace_id,diagnostic_id),
  FOREIGN KEY (workspace_id,diagnostic_id) REFERENCES app_shared.diagnostics(workspace_id,id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id,brief_id) REFERENCES app_shared.capacity_operating_briefs(workspace_id,id) ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id,source_review_id) REFERENCES app_shared.capacity_brief_reviews(workspace_id,id) ON DELETE RESTRICT
);

ALTER TABLE app_private.diagnostic_reassessment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private.diagnostic_reassessment_plans FORCE ROW LEVEL SECURITY;
CREATE POLICY diagnostic_reassessment_plan_tenant_policy ON app_private.diagnostic_reassessment_plans
  USING (workspace_id=app_identity.current_workspace_id())
  WITH CHECK (workspace_id=app_identity.current_workspace_id());
GRANT SELECT,INSERT,UPDATE ON app_private.diagnostic_reassessment_plans TO capacity_workspace_app;
