CREATE TABLE app_operations.intervention_advisor_escalations (
  id uuid NOT NULL DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL, diagnostic_id uuid NOT NULL, brief_id uuid NOT NULL,
  support_type text NOT NULL CHECK (support_type IN ('facilitation','executive-coaching','learning-design','intervention-review')),
  urgency text NOT NULL CHECK (urgency IN ('standard','time-sensitive')),
  context text NOT NULL CHECK (char_length(context) BETWEEN 40 AND 1500),
  desired_outcome text NOT NULL CHECK (char_length(desired_outcome) BETWEEN 40 AND 1000),
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','contacted','closed')),
  requested_by_clerk_user_id text NOT NULL, requested_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id,diagnostic_id) REFERENCES app_shared.diagnostics(workspace_id,id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id,brief_id) REFERENCES app_shared.capacity_operating_briefs(workspace_id,id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX intervention_advisor_escalation_open_idx ON app_operations.intervention_advisor_escalations(workspace_id,diagnostic_id) WHERE status IN ('requested','contacted');
ALTER TABLE app_operations.intervention_advisor_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_operations.intervention_advisor_escalations FORCE ROW LEVEL SECURITY;
CREATE POLICY intervention_advisor_escalation_tenant_policy ON app_operations.intervention_advisor_escalations USING (workspace_id=app_identity.current_workspace_id()) WITH CHECK (workspace_id=app_identity.current_workspace_id());
GRANT SELECT,INSERT ON app_operations.intervention_advisor_escalations TO capacity_workspace_app;
