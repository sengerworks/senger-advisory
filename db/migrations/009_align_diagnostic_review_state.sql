ALTER TABLE app_shared.diagnostics
  DROP CONSTRAINT diagnostics_human_review_status_check;

UPDATE app_shared.diagnostics
SET human_review_status = 'clear'
WHERE human_review_status = 'not-required';

ALTER TABLE app_shared.diagnostics
  ADD CONSTRAINT diagnostics_human_review_status_check
  CHECK (human_review_status IN ('clear', 'required', 'in-review', 'resolved'));

ALTER TABLE app_shared.diagnostics
  ALTER COLUMN human_review_status SET DEFAULT 'clear';
