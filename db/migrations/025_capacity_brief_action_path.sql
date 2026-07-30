CREATE TABLE app_shared.capacity_brief_action_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL, diagnostic_id uuid NOT NULL,
  brief_id uuid NOT NULL, phase_days integer NOT NULL CHECK (phase_days IN (30,60,90)),
  commitment text NOT NULL CHECK (char_length(commitment) BETWEEN 20 AND 800),
  accountable_role text NOT NULL CHECK (char_length(accountable_role) BETWEEN 2 AND 120),
  decision_gate text NOT NULL CHECK (char_length(decision_gate) BETWEEN 20 AND 800),
  evidence_prompt text NOT NULL CHECK (char_length(evidence_prompt) BETWEEN 20 AND 800),
  due_at timestamptz NOT NULL, status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','completed','blocked')),
  resolution_note text CHECK (resolution_note IS NULL OR char_length(resolution_note) BETWEEN 20 AND 1200),
  resolved_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id,diagnostic_id) REFERENCES app_shared.diagnostics(workspace_id,id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id,brief_id) REFERENCES app_shared.capacity_operating_briefs(workspace_id,id) ON DELETE CASCADE,
  CHECK ((status='planned') = (resolved_at IS NULL)), CHECK (status='planned' OR resolution_note IS NOT NULL)
);
CREATE INDEX capacity_brief_action_path_idx ON app_shared.capacity_brief_action_items(workspace_id,brief_id,phase_days,due_at,id);
ALTER TABLE app_shared.capacity_brief_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_shared.capacity_brief_action_items FORCE ROW LEVEL SECURITY;
CREATE POLICY capacity_brief_action_path_tenant_policy ON app_shared.capacity_brief_action_items USING (workspace_id=app_identity.current_workspace_id()) WITH CHECK (workspace_id=app_identity.current_workspace_id());
GRANT SELECT,INSERT,UPDATE ON app_shared.capacity_brief_action_items TO capacity_workspace_app;
