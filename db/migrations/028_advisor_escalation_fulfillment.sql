ALTER TABLE app_operations.intervention_advisor_escalations
  ADD COLUMN advisor_note text CHECK (advisor_note IS NULL OR char_length(advisor_note) BETWEEN 20 AND 1200),
  ADD COLUMN handled_by_clerk_user_id text,
  ADD COLUMN contacted_at timestamptz,
  ADD COLUMN closed_at timestamptz,
  ADD CONSTRAINT intervention_advisor_escalation_contacted_check CHECK (status <> 'contacted' OR (advisor_note IS NOT NULL AND contacted_at IS NOT NULL)),
  ADD CONSTRAINT intervention_advisor_escalation_closed_check CHECK (status <> 'closed' OR (advisor_note IS NOT NULL AND closed_at IS NOT NULL));
GRANT UPDATE ON app_operations.intervention_advisor_escalations TO capacity_workspace_app;
