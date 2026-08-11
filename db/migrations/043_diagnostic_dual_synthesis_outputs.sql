CREATE TABLE app_shared.diagnostic_executive_briefs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  diagnostic_id uuid NOT NULL,
  finding_id uuid NOT NULL,
  output_version text NOT NULL,
  brief_payload jsonb NOT NULL CHECK (jsonb_typeof(brief_payload) = 'object'),
  status text NOT NULL DEFAULT 'locked' CHECK (status IN ('locked','released')),
  advisor_review_status text NOT NULL DEFAULT 'pending' CHECK (advisor_review_status IN ('pending','approved','revision-required')),
  advisor_review_note text,
  advisor_reviewed_by_clerk_user_id text,
  advisor_reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id,id),
  UNIQUE (workspace_id,diagnostic_id),
  FOREIGN KEY (workspace_id,diagnostic_id) REFERENCES app_shared.diagnostics(workspace_id,id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id,finding_id) REFERENCES app_shared.diagnostic_findings(workspace_id,id) ON DELETE RESTRICT,
  CHECK ((advisor_reviewed_at IS NULL) = (advisor_reviewed_by_clerk_user_id IS NULL))
);

CREATE TABLE app_private.diagnostic_revelation_guides (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  diagnostic_id uuid NOT NULL,
  finding_id uuid NOT NULL,
  output_version text NOT NULL,
  guide_payload jsonb NOT NULL CHECK (jsonb_typeof(guide_payload) = 'object'),
  advisor_review_status text NOT NULL DEFAULT 'pending' CHECK (advisor_review_status IN ('pending','approved','revision-required')),
  advisor_review_note text,
  advisor_reviewed_by_clerk_user_id text,
  advisor_reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id,id),
  UNIQUE (workspace_id,diagnostic_id),
  FOREIGN KEY (workspace_id,diagnostic_id) REFERENCES app_shared.diagnostics(workspace_id,id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id,finding_id) REFERENCES app_shared.diagnostic_findings(workspace_id,id) ON DELETE RESTRICT,
  CHECK ((advisor_reviewed_at IS NULL) = (advisor_reviewed_by_clerk_user_id IS NULL))
);

ALTER TABLE app_shared.diagnostic_executive_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_shared.diagnostic_executive_briefs FORCE ROW LEVEL SECURITY;
CREATE POLICY diagnostic_executive_brief_tenant_policy ON app_shared.diagnostic_executive_briefs
  USING (workspace_id = app_identity.current_workspace_id())
  WITH CHECK (workspace_id = app_identity.current_workspace_id());

ALTER TABLE app_private.diagnostic_revelation_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private.diagnostic_revelation_guides FORCE ROW LEVEL SECURITY;
CREATE POLICY diagnostic_revelation_guide_tenant_policy ON app_private.diagnostic_revelation_guides
  USING (workspace_id = app_identity.current_workspace_id())
  WITH CHECK (workspace_id = app_identity.current_workspace_id());

GRANT SELECT,INSERT,UPDATE ON app_shared.diagnostic_executive_briefs TO capacity_workspace_app;
GRANT SELECT,INSERT,UPDATE ON app_private.diagnostic_revelation_guides TO capacity_workspace_app;
