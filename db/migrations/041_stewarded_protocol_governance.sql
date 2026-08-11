ALTER TABLE app_shared.diagnostic_protocols_v2
  ADD COLUMN sponsor_reviewed_questions jsonb,
  ADD COLUMN sponsor_question_reviews jsonb,
  ADD COLUMN sponsor_approval_note text,
  ADD COLUMN sponsor_approved_by_clerk_user_id text,
  ADD COLUMN sponsor_approved_at timestamptz,
  ADD COLUMN steward_finalized_by_clerk_user_id text,
  ADD COLUMN steward_finalized_at timestamptz;

ALTER TABLE app_shared.diagnostic_protocols_v2
  ADD CONSTRAINT diagnostic_protocols_v2_sponsor_review_shape CHECK (
    sponsor_reviewed_questions IS NULL OR (
      jsonb_typeof(sponsor_reviewed_questions) = 'array'
      AND jsonb_array_length(sponsor_reviewed_questions) = 18
    )
  ),
  ADD CONSTRAINT diagnostic_protocols_v2_question_reviews_shape CHECK (
    sponsor_question_reviews IS NULL OR (
      jsonb_typeof(sponsor_question_reviews) = 'array'
      AND jsonb_array_length(sponsor_question_reviews) = 18
    )
  ),
  ADD CONSTRAINT diagnostic_protocols_v2_sponsor_approval_complete CHECK (
    (sponsor_approved_at IS NULL) = (sponsor_approved_by_clerk_user_id IS NULL)
    AND (sponsor_approved_at IS NULL) = (sponsor_reviewed_questions IS NULL)
    AND (sponsor_approved_at IS NULL) = (sponsor_question_reviews IS NULL)
    AND (sponsor_approved_at IS NULL) = (sponsor_approval_note IS NULL)
  ),
  ADD CONSTRAINT diagnostic_protocols_v2_steward_finalization_complete CHECK (
    (steward_finalized_at IS NULL) = (steward_finalized_by_clerk_user_id IS NULL)
    AND (steward_finalized_at IS NULL OR sponsor_approved_at IS NOT NULL)
  );

CREATE INDEX diagnostic_protocols_v2_governance_idx
  ON app_shared.diagnostic_protocols_v2(workspace_id, diagnostic_id, sponsor_approved_at, steward_finalized_at);
