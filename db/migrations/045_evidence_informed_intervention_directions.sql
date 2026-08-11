CREATE TABLE app_private.diagnostic_intervention_directions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  diagnostic_id uuid NOT NULL,
  finding_id uuid NOT NULL,
  direction_version text NOT NULL,
  direction_payload jsonb NOT NULL CHECK (jsonb_typeof(direction_payload)='object'),
  advisor_review_status text NOT NULL DEFAULT 'pending'
    CHECK (advisor_review_status IN ('pending','approved','revision-required')),
  advisor_review_note text,
  advisor_reviewed_by_clerk_user_id text,
  advisor_reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id,id),
  UNIQUE (workspace_id,diagnostic_id),
  FOREIGN KEY (workspace_id,diagnostic_id) REFERENCES app_shared.diagnostics(workspace_id,id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id,finding_id) REFERENCES app_shared.diagnostic_findings(workspace_id,id) ON DELETE RESTRICT,
  CHECK ((advisor_reviewed_at IS NULL)=(advisor_reviewed_by_clerk_user_id IS NULL))
);

ALTER TABLE app_private.diagnostic_intervention_directions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private.diagnostic_intervention_directions FORCE ROW LEVEL SECURITY;
CREATE POLICY diagnostic_intervention_direction_tenant_policy
  ON app_private.diagnostic_intervention_directions
  USING (workspace_id=app_identity.current_workspace_id())
  WITH CHECK (workspace_id=app_identity.current_workspace_id());
GRANT SELECT,INSERT,UPDATE ON app_private.diagnostic_intervention_directions TO capacity_workspace_app;
