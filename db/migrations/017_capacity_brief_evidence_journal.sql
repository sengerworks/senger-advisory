CREATE TABLE app_shared.capacity_brief_evidence_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  diagnostic_id uuid NOT NULL,
  brief_id uuid NOT NULL,
  evidence_class text NOT NULL CHECK (evidence_class IN ('delivery', 'operating-change', 'capacity-change')),
  observation text NOT NULL CHECK (char_length(observation) BETWEEN 20 AND 1500),
  source_note text NOT NULL CHECK (char_length(source_note) BETWEEN 1 AND 300),
  observed_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, id),
  FOREIGN KEY (workspace_id, diagnostic_id) REFERENCES app_shared.diagnostics(workspace_id, id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id, brief_id) REFERENCES app_shared.capacity_operating_briefs(workspace_id, id) ON DELETE CASCADE
);
CREATE INDEX capacity_brief_evidence_timeline_idx ON app_shared.capacity_brief_evidence_entries(workspace_id, brief_id, observed_at DESC);
ALTER TABLE app_shared.capacity_brief_evidence_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_shared.capacity_brief_evidence_entries FORCE ROW LEVEL SECURITY;
CREATE POLICY capacity_brief_evidence_tenant_policy ON app_shared.capacity_brief_evidence_entries
  USING (workspace_id = app_identity.current_workspace_id())
  WITH CHECK (workspace_id = app_identity.current_workspace_id());
GRANT SELECT, INSERT ON app_shared.capacity_brief_evidence_entries TO capacity_workspace_app;

