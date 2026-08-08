CREATE TABLE app_private.diagnostic_frames_v2 (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  diagnostic_id uuid NOT NULL,
  frame_version text NOT NULL CHECK (frame_version = '2.0.0'),
  status text NOT NULL CHECK (status IN ('draft','approved')),
  frame_payload jsonb NOT NULL CHECK (jsonb_typeof(frame_payload) = 'object'),
  created_by_clerk_user_id text NOT NULL,
  approved_by_clerk_user_id text,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id,id),
  UNIQUE (workspace_id,diagnostic_id),
  UNIQUE (workspace_id,diagnostic_id,id),
  FOREIGN KEY (workspace_id,diagnostic_id)
    REFERENCES app_shared.diagnostics(workspace_id,id) ON DELETE CASCADE,
  CHECK ((status = 'approved') = (approved_at IS NOT NULL)),
  CHECK ((status = 'approved') = (approved_by_clerk_user_id IS NOT NULL))
);

CREATE TABLE app_shared.diagnostic_protocols_v2 (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  diagnostic_id uuid NOT NULL,
  frame_id uuid NOT NULL,
  protocol_version text NOT NULL CHECK (protocol_version = '2.0.0'),
  question_library_version text NOT NULL CHECK (question_library_version = '2.0.0'),
  governed_questions jsonb NOT NULL CHECK (jsonb_typeof(governed_questions) = 'array'),
  approval_note text NOT NULL CHECK (char_length(approval_note) BETWEEN 20 AND 800),
  approved_by_clerk_user_id text NOT NULL,
  approved_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id,id),
  UNIQUE (workspace_id,diagnostic_id),
  FOREIGN KEY (workspace_id,diagnostic_id)
    REFERENCES app_shared.diagnostics(workspace_id,id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id,diagnostic_id,frame_id)
    REFERENCES app_private.diagnostic_frames_v2(workspace_id,diagnostic_id,id) ON DELETE RESTRICT,
  CHECK (jsonb_array_length(governed_questions) BETWEEN 12 AND 18)
);

CREATE TABLE app_private.diagnostic_typed_evidence_v2 (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  diagnostic_id uuid NOT NULL,
  frame_id uuid NOT NULL,
  evidence_model_version text NOT NULL CHECK (evidence_model_version = '2.0.0'),
  evidence_type text NOT NULL CHECK (evidence_type IN ('mechanism','friction','compensation','formal-lived','cross-cutting')),
  evidence_payload jsonb NOT NULL CHECK (jsonb_typeof(evidence_payload) = 'object'),
  status text NOT NULL CHECK (status IN ('draft','approved')),
  created_by_clerk_user_id text NOT NULL,
  approved_by_clerk_user_id text,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id,id),
  UNIQUE (workspace_id,diagnostic_id,id),
  FOREIGN KEY (workspace_id,diagnostic_id)
    REFERENCES app_shared.diagnostics(workspace_id,id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id,diagnostic_id,frame_id)
    REFERENCES app_private.diagnostic_frames_v2(workspace_id,diagnostic_id,id) ON DELETE RESTRICT,
  CHECK ((status = 'approved') = (approved_at IS NOT NULL)),
  CHECK ((status = 'approved') = (approved_by_clerk_user_id IS NOT NULL))
);

CREATE INDEX diagnostic_frames_v2_history_idx ON app_private.diagnostic_frames_v2(workspace_id,diagnostic_id,updated_at DESC);
CREATE INDEX diagnostic_typed_evidence_v2_review_idx ON app_private.diagnostic_typed_evidence_v2(workspace_id,diagnostic_id,status,created_at);

ALTER TABLE app_private.diagnostic_frames_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private.diagnostic_frames_v2 FORCE ROW LEVEL SECURITY;
ALTER TABLE app_shared.diagnostic_protocols_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_shared.diagnostic_protocols_v2 FORCE ROW LEVEL SECURITY;
ALTER TABLE app_private.diagnostic_typed_evidence_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private.diagnostic_typed_evidence_v2 FORCE ROW LEVEL SECURITY;

CREATE POLICY diagnostic_frames_v2_tenant_policy ON app_private.diagnostic_frames_v2
  USING (workspace_id = app_identity.current_workspace_id())
  WITH CHECK (workspace_id = app_identity.current_workspace_id());
CREATE POLICY diagnostic_protocols_v2_tenant_policy ON app_shared.diagnostic_protocols_v2
  USING (workspace_id = app_identity.current_workspace_id())
  WITH CHECK (workspace_id = app_identity.current_workspace_id());
CREATE POLICY diagnostic_typed_evidence_v2_tenant_policy ON app_private.diagnostic_typed_evidence_v2
  USING (workspace_id = app_identity.current_workspace_id())
  WITH CHECK (workspace_id = app_identity.current_workspace_id());

GRANT SELECT,INSERT,UPDATE ON
  app_private.diagnostic_frames_v2,
  app_shared.diagnostic_protocols_v2,
  app_private.diagnostic_typed_evidence_v2
TO capacity_workspace_app;
