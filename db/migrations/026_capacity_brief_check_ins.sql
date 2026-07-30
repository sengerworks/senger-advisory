CREATE TABLE app_shared.capacity_brief_check_ins (
  id uuid NOT NULL DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL, diagnostic_id uuid NOT NULL, brief_id uuid NOT NULL,
  prompt text NOT NULL CHECK (char_length(prompt) BETWEEN 20 AND 800), due_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','responded','escalated')),
  response text CHECK (response IS NULL OR char_length(response) BETWEEN 20 AND 1500),
  attention_reason text CHECK (attention_reason IS NULL OR char_length(attention_reason) BETWEEN 20 AND 800),
  resolved_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id,diagnostic_id) REFERENCES app_shared.diagnostics(workspace_id,id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id,brief_id) REFERENCES app_shared.capacity_operating_briefs(workspace_id,id) ON DELETE CASCADE,
  CHECK ((status='open')=(resolved_at IS NULL)), CHECK (status<>'responded' OR response IS NOT NULL),
  CHECK (status<>'escalated' OR attention_reason IS NOT NULL)
);
CREATE INDEX capacity_brief_check_ins_due_idx ON app_shared.capacity_brief_check_ins(workspace_id,brief_id,due_at,status);
ALTER TABLE app_shared.capacity_brief_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_shared.capacity_brief_check_ins FORCE ROW LEVEL SECURITY;
CREATE POLICY capacity_brief_check_ins_tenant_policy ON app_shared.capacity_brief_check_ins USING (workspace_id=app_identity.current_workspace_id()) WITH CHECK (workspace_id=app_identity.current_workspace_id());
GRANT SELECT,INSERT,UPDATE ON app_shared.capacity_brief_check_ins TO capacity_workspace_app;
