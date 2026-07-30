CREATE TABLE app_operations.poc_checkpoint_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL, diagnostic_id uuid NOT NULL,
  checkpoint text NOT NULL CHECK (checkpoint IN ('sponsor-setup','participant-onboarding','interview-completion','finding-release','intervention-acceptance','brief-review','reassessment','final-debrief')),
  respondent_role text NOT NULL CHECK (respondent_role IN ('sponsor','participant','advisor')),
  clarity_rating integer CHECK (clarity_rating BETWEEN 1 AND 5), trust_rating integer CHECK (trust_rating BETWEEN 1 AND 5),
  actionability_rating integer CHECK (actionability_rating BETWEEN 1 AND 5), support_required boolean NOT NULL DEFAULT false,
  purchase_intent text NOT NULL DEFAULT 'not-asked' CHECK (purchase_intent IN ('yes','no','uncertain','not-asked')),
  feedback text CHECK (feedback IS NULL OR char_length(feedback) BETWEEN 20 AND 1500), created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id,id), FOREIGN KEY (workspace_id,diagnostic_id) REFERENCES app_shared.diagnostics(workspace_id,id) ON DELETE CASCADE,
  CHECK (clarity_rating IS NOT NULL OR trust_rating IS NOT NULL OR actionability_rating IS NOT NULL OR feedback IS NOT NULL),
  CHECK (respondent_role<>'participant' OR purchase_intent='not-asked')
);
CREATE INDEX poc_checkpoint_feedback_summary_idx ON app_operations.poc_checkpoint_feedback(workspace_id,diagnostic_id,checkpoint,respondent_role,created_at);
ALTER TABLE app_operations.poc_checkpoint_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_operations.poc_checkpoint_feedback FORCE ROW LEVEL SECURITY;
CREATE POLICY poc_checkpoint_feedback_tenant_policy ON app_operations.poc_checkpoint_feedback USING (workspace_id=app_identity.current_workspace_id()) WITH CHECK (workspace_id=app_identity.current_workspace_id());
GRANT INSERT ON app_operations.poc_checkpoint_feedback TO capacity_workspace_app;
