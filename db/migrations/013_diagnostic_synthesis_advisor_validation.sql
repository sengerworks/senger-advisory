ALTER TABLE app_shared.diagnostic_findings
  ADD COLUMN advisor_review_status text NOT NULL DEFAULT 'pending'
    CHECK (advisor_review_status IN ('pending', 'approved', 'revision-required')),
  ADD COLUMN advisor_review_note text NOT NULL DEFAULT ''
    CHECK (char_length(advisor_review_note) <= 1200),
  ADD COLUMN advisor_reviewed_by_clerk_user_id text,
  ADD COLUMN advisor_reviewed_at timestamptz;

ALTER TABLE app_shared.diagnostic_findings
  ADD CONSTRAINT diagnostic_finding_advisor_review_check
  CHECK (
    (advisor_review_status = 'pending' AND advisor_reviewed_by_clerk_user_id IS NULL AND advisor_reviewed_at IS NULL)
    OR
    (advisor_review_status <> 'pending' AND advisor_reviewed_by_clerk_user_id IS NOT NULL AND advisor_reviewed_at IS NOT NULL)
  );
