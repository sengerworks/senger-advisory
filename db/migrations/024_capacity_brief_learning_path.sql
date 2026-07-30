CREATE TABLE app_shared.capacity_brief_learning_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  diagnostic_id uuid NOT NULL,
  brief_id uuid NOT NULL,
  title text NOT NULL CHECK (char_length(title) BETWEEN 5 AND 160),
  purpose text NOT NULL CHECK (char_length(purpose) BETWEEN 20 AND 800),
  accountable_role text NOT NULL CHECK (char_length(accountable_role) BETWEEN 2 AND 120),
  due_at timestamptz NOT NULL,
  application_prompt text NOT NULL CHECK (char_length(application_prompt) BETWEEN 20 AND 800),
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'completed', 'cancelled')),
  application_note text CHECK (application_note IS NULL OR char_length(application_note) BETWEEN 20 AND 1200),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, id),
  FOREIGN KEY (workspace_id, diagnostic_id) REFERENCES app_shared.diagnostics(workspace_id, id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id, brief_id) REFERENCES app_shared.capacity_operating_briefs(workspace_id, id) ON DELETE CASCADE,
  CHECK ((status = 'completed') = (completed_at IS NOT NULL)),
  CHECK (status <> 'completed' OR application_note IS NOT NULL)
);
CREATE INDEX capacity_brief_learning_timeline_idx ON app_shared.capacity_brief_learning_items(workspace_id, brief_id, due_at, created_at);
ALTER TABLE app_shared.capacity_brief_learning_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_shared.capacity_brief_learning_items FORCE ROW LEVEL SECURITY;
CREATE POLICY capacity_brief_learning_tenant_policy ON app_shared.capacity_brief_learning_items
  USING (workspace_id = app_identity.current_workspace_id())
  WITH CHECK (workspace_id = app_identity.current_workspace_id());
GRANT SELECT, INSERT, UPDATE ON app_shared.capacity_brief_learning_items TO capacity_workspace_app;
