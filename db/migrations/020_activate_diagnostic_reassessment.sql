ALTER TABLE app_private.diagnostic_reassessment_plans
  ADD COLUMN followup_diagnostic_id uuid,
  ADD COLUMN activated_at timestamptz;

ALTER TABLE app_private.diagnostic_reassessment_plans
  ADD CONSTRAINT diagnostic_reassessment_followup_fk
  FOREIGN KEY (workspace_id,followup_diagnostic_id)
  REFERENCES app_shared.diagnostics(workspace_id,id) ON DELETE RESTRICT,
  ADD CONSTRAINT diagnostic_reassessment_activation_consistency
  CHECK ((status='planned') = (followup_diagnostic_id IS NULL AND activated_at IS NULL));

CREATE UNIQUE INDEX diagnostic_reassessment_followup_idx
  ON app_private.diagnostic_reassessment_plans(workspace_id,followup_diagnostic_id)
  WHERE followup_diagnostic_id IS NOT NULL;
