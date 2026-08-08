ALTER TABLE app_private.diagnostic_evidence
  ALTER COLUMN source_interview_id DROP NOT NULL,
  ADD COLUMN source_interview_v2_id uuid,
  ADD CONSTRAINT diagnostic_evidence_v2_source_fk
    FOREIGN KEY (workspace_id,source_interview_v2_id)
    REFERENCES app_private.diagnostic_interviews_v2(workspace_id,id) ON DELETE RESTRICT,
  ADD CONSTRAINT diagnostic_evidence_exactly_one_interview_source
    CHECK (num_nonnulls(source_interview_id,source_interview_v2_id)=1);

CREATE INDEX diagnostic_evidence_v2_source_idx
  ON app_private.diagnostic_evidence(workspace_id,source_interview_v2_id)
  WHERE source_interview_v2_id IS NOT NULL;
