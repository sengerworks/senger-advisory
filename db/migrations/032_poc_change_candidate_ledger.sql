ALTER TABLE app_operations.poc_cohort_decisions
  ADD CONSTRAINT poc_cohort_decisions_diagnostic_identity UNIQUE (workspace_id,diagnostic_id,id);

CREATE TABLE app_operations.poc_change_candidates (
  id uuid NOT NULL DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL, diagnostic_id uuid NOT NULL,
  cohort_decision_id uuid, observed_problem text NOT NULL CHECK (char_length(observed_problem) BETWEEN 40 AND 1500),
  affected_role text NOT NULL CHECK (char_length(affected_role) BETWEEN 2 AND 120),
  evidence_summary text NOT NULL CHECK (char_length(evidence_summary) BETWEEN 40 AND 1500),
  frequency_summary text NOT NULL CHECK (char_length(frequency_summary) BETWEEN 10 AND 500),
  severity text NOT NULL CHECK (severity IN ('S0','S1','S2','S3','S4')),
  risk_of_no_change text NOT NULL CHECK (char_length(risk_of_no_change) BETWEEN 40 AND 1000),
  proposed_change text NOT NULL CHECK (char_length(proposed_change) BETWEEN 40 AND 1500),
  owner text NOT NULL CHECK (char_length(owner) BETWEEN 2 AND 120), target_release text NOT NULL CHECK (char_length(target_release) BETWEEN 2 AND 120),
  validation_measure text NOT NULL CHECK (char_length(validation_measure) BETWEEN 20 AND 1000),
  rollback_condition text NOT NULL CHECK (char_length(rollback_condition) BETWEEN 20 AND 1000),
  governance_impacts jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(governance_impacts)='array'),
  created_by_clerk_user_id text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id,diagnostic_id) REFERENCES app_shared.diagnostics(workspace_id,id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id,diagnostic_id,cohort_decision_id) REFERENCES app_operations.poc_cohort_decisions(workspace_id,diagnostic_id,id)
);
CREATE INDEX poc_change_candidates_history_idx ON app_operations.poc_change_candidates(workspace_id,diagnostic_id,created_at DESC);

CREATE TABLE app_operations.poc_change_candidate_decisions (
  id uuid NOT NULL DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL, diagnostic_id uuid NOT NULL, candidate_id uuid NOT NULL,
  decision text NOT NULL CHECK (decision IN ('approved','rejected','deferred')),
  rationale text NOT NULL CHECK (char_length(rationale) BETWEEN 40 AND 1500), decided_by_clerk_user_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (workspace_id,id), UNIQUE (workspace_id,candidate_id),
  FOREIGN KEY (workspace_id,diagnostic_id) REFERENCES app_shared.diagnostics(workspace_id,id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id,candidate_id) REFERENCES app_operations.poc_change_candidates(workspace_id,id) ON DELETE CASCADE
);

CREATE TABLE app_operations.poc_change_candidate_validations (
  id uuid NOT NULL DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL, diagnostic_id uuid NOT NULL, candidate_id uuid NOT NULL,
  result text NOT NULL CHECK (result IN ('validated','invalidated','inconclusive')),
  observed_result text NOT NULL CHECK (char_length(observed_result) BETWEEN 40 AND 1500),
  measure_assessment text NOT NULL CHECK (char_length(measure_assessment) BETWEEN 40 AND 1500),
  rollback_triggered boolean NOT NULL DEFAULT false,
  next_action text NOT NULL CHECK (char_length(next_action) BETWEEN 20 AND 1000),
  validated_by_clerk_user_id text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id,diagnostic_id) REFERENCES app_shared.diagnostics(workspace_id,id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id,candidate_id) REFERENCES app_operations.poc_change_candidates(workspace_id,id) ON DELETE CASCADE
);
CREATE INDEX poc_change_candidate_validations_history_idx ON app_operations.poc_change_candidate_validations(workspace_id,candidate_id,created_at DESC);

ALTER TABLE app_operations.poc_change_candidates ENABLE ROW LEVEL SECURITY; ALTER TABLE app_operations.poc_change_candidates FORCE ROW LEVEL SECURITY;
ALTER TABLE app_operations.poc_change_candidate_decisions ENABLE ROW LEVEL SECURITY; ALTER TABLE app_operations.poc_change_candidate_decisions FORCE ROW LEVEL SECURITY;
ALTER TABLE app_operations.poc_change_candidate_validations ENABLE ROW LEVEL SECURITY; ALTER TABLE app_operations.poc_change_candidate_validations FORCE ROW LEVEL SECURITY;
CREATE POLICY poc_change_candidates_tenant_policy ON app_operations.poc_change_candidates USING (workspace_id=app_identity.current_workspace_id()) WITH CHECK (workspace_id=app_identity.current_workspace_id());
CREATE POLICY poc_change_candidate_decisions_tenant_policy ON app_operations.poc_change_candidate_decisions USING (workspace_id=app_identity.current_workspace_id()) WITH CHECK (workspace_id=app_identity.current_workspace_id());
CREATE POLICY poc_change_candidate_validations_tenant_policy ON app_operations.poc_change_candidate_validations USING (workspace_id=app_identity.current_workspace_id()) WITH CHECK (workspace_id=app_identity.current_workspace_id());
GRANT SELECT,INSERT ON app_operations.poc_change_candidates,app_operations.poc_change_candidate_decisions,app_operations.poc_change_candidate_validations TO capacity_workspace_app;
