CREATE TABLE app_shared.capacity_brief_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL, diagnostic_id uuid NOT NULL,
  brief_id uuid NOT NULL, decision text NOT NULL CHECK (decision IN ('continue','adjust','escalate','stop','reassess')),
  summary text NOT NULL CHECK (char_length(summary) BETWEEN 40 AND 1200),
  evidence_assessment text NOT NULL CHECK (char_length(evidence_assessment) BETWEEN 40 AND 1500),
  adjustments jsonb NOT NULL CHECK (jsonb_typeof(adjustments)='array'), next_review_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id,diagnostic_id) REFERENCES app_shared.diagnostics(workspace_id,id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id,brief_id) REFERENCES app_shared.capacity_operating_briefs(workspace_id,id) ON DELETE CASCADE,
  CHECK ((decision IN ('continue','adjust','escalate')) = (next_review_at IS NOT NULL))
);
CREATE INDEX capacity_brief_reviews_timeline_idx ON app_shared.capacity_brief_reviews(workspace_id,brief_id,created_at DESC);
ALTER TABLE app_shared.capacity_brief_reviews ENABLE ROW LEVEL SECURITY;ALTER TABLE app_shared.capacity_brief_reviews FORCE ROW LEVEL SECURITY;
CREATE POLICY capacity_brief_review_tenant_policy ON app_shared.capacity_brief_reviews USING (workspace_id=app_identity.current_workspace_id()) WITH CHECK (workspace_id=app_identity.current_workspace_id());
GRANT SELECT,INSERT ON app_shared.capacity_brief_reviews TO capacity_workspace_app;

