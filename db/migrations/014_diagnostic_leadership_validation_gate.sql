UPDATE app_shared.diagnostics diagnostic
SET state = 'leadership-validation', updated_at = now()
FROM app_shared.diagnostic_findings finding
WHERE finding.workspace_id = diagnostic.workspace_id
  AND finding.diagnostic_id = diagnostic.id
  AND finding.advisor_review_status = 'approved'
  AND diagnostic.state = 'synthesis';

