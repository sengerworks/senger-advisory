CREATE TABLE app_shared.action_cycles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  round_id uuid NOT NULL,
  action_cycle_version text NOT NULL,
  constraint_domain_id text NOT NULL CHECK (
    constraint_domain_id IN ('leadership', 'decisions', 'rhythm', 'alignment', 'technology', 'culture')
  ),
  hypothesis text NOT NULL CHECK (char_length(hypothesis) BETWEEN 1 AND 500),
  commitment text NOT NULL CHECK (char_length(commitment) BETWEEN 1 AND 500),
  responsible_owner text NOT NULL CHECK (char_length(responsible_owner) BETWEEN 1 AND 120),
  evidence_measure_id text NOT NULL CHECK (
    evidence_measure_id IN (
      'decisionPace', 'leadershipEscalationLoad', 'crossFunctionalCoordinationLoad',
      'executionReliability', 'changeAbsorption', 'other'
    )
  ),
  evidence_description text NOT NULL CHECK (char_length(evidence_description) BETWEEN 1 AND 300),
  review_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('planned', 'active', 'completed', 'stopped')),
  review_note text NOT NULL DEFAULT '' CHECK (char_length(review_note) <= 500),
  created_by_clerk_user_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  PRIMARY KEY (workspace_id, id),
  FOREIGN KEY (workspace_id, round_id)
    REFERENCES app_identity.collection_rounds(workspace_id, id) ON DELETE CASCADE,
  CHECK ((status IN ('completed', 'stopped')) = (closed_at IS NOT NULL))
);

CREATE INDEX action_cycles_workspace_round_idx
  ON app_shared.action_cycles(workspace_id, round_id, created_at DESC);

ALTER TABLE app_shared.action_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_shared.action_cycles FORCE ROW LEVEL SECURITY;

CREATE POLICY action_cycle_tenant_policy ON app_shared.action_cycles
  USING (workspace_id = app_identity.current_workspace_id())
  WITH CHECK (workspace_id = app_identity.current_workspace_id());

GRANT SELECT, INSERT, UPDATE, DELETE
  ON app_shared.action_cycles
  TO capacity_workspace_app;
