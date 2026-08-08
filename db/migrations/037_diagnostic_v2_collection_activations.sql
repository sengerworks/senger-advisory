CREATE TABLE app_operations.diagnostic_v2_collection_activations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),workspace_id uuid NOT NULL,diagnostic_id uuid NOT NULL,
  frame_id uuid NOT NULL,protocol_id uuid NOT NULL,interview_version text NOT NULL CHECK(interview_version='2.0.0'),
  activation_note text NOT NULL CHECK(char_length(activation_note) BETWEEN 40 AND 1000),
  activated_by_clerk_user_id text NOT NULL,activated_at timestamptz NOT NULL DEFAULT now(),deactivated_at timestamptz,
  PRIMARY KEY(workspace_id,id),
  FOREIGN KEY(workspace_id,diagnostic_id) REFERENCES app_shared.diagnostics(workspace_id,id) ON DELETE CASCADE,
  FOREIGN KEY(workspace_id,diagnostic_id,frame_id) REFERENCES app_private.diagnostic_frames_v2(workspace_id,diagnostic_id,id) ON DELETE RESTRICT,
  FOREIGN KEY(workspace_id,diagnostic_id,protocol_id) REFERENCES app_shared.diagnostic_protocols_v2(workspace_id,diagnostic_id,id) ON DELETE RESTRICT,
  CHECK(deactivated_at IS NULL OR deactivated_at>=activated_at)
);
CREATE UNIQUE INDEX diagnostic_v2_collection_active_idx ON app_operations.diagnostic_v2_collection_activations(workspace_id,diagnostic_id) WHERE deactivated_at IS NULL;
ALTER TABLE app_operations.diagnostic_v2_collection_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_operations.diagnostic_v2_collection_activations FORCE ROW LEVEL SECURITY;
CREATE POLICY diagnostic_v2_collection_activation_tenant_policy ON app_operations.diagnostic_v2_collection_activations
  USING(workspace_id=app_identity.current_workspace_id()) WITH CHECK(workspace_id=app_identity.current_workspace_id());
GRANT SELECT,INSERT,UPDATE ON app_operations.diagnostic_v2_collection_activations TO capacity_workspace_app;
