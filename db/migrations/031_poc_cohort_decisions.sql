CREATE TABLE app_operations.poc_cohort_decisions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  diagnostic_id uuid NOT NULL,
  decision text NOT NULL CHECK (decision IN ('continue','continue-with-adjustment','hold','narrow-scope','ready-to-monetize')),
  rationale text NOT NULL CHECK (char_length(rationale) BETWEEN 40 AND 1500),
  required_changes jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(required_changes) = 'array'),
  unresolved_risks jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(unresolved_risks) = 'array'),
  next_hypotheses jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(next_hypotheses) = 'array'),
  next_review_at timestamptz,
  decided_by_clerk_user_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id,diagnostic_id) REFERENCES app_shared.diagnostics(workspace_id,id) ON DELETE CASCADE,
  CHECK (decision <> 'continue-with-adjustment' OR jsonb_array_length(required_changes) > 0),
  CHECK (decision <> 'hold' OR jsonb_array_length(unresolved_risks) > 0)
);
CREATE INDEX poc_cohort_decisions_history_idx ON app_operations.poc_cohort_decisions(workspace_id,diagnostic_id,created_at DESC);
ALTER TABLE app_operations.poc_cohort_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_operations.poc_cohort_decisions FORCE ROW LEVEL SECURITY;
CREATE POLICY poc_cohort_decisions_tenant_policy ON app_operations.poc_cohort_decisions
  USING (workspace_id=app_identity.current_workspace_id())
  WITH CHECK (workspace_id=app_identity.current_workspace_id());
GRANT SELECT,INSERT ON app_operations.poc_cohort_decisions TO capacity_workspace_app;
