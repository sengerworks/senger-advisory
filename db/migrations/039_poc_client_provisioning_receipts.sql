CREATE TABLE app_operations.poc_client_provisioning_receipts (
  workspace_id uuid NOT NULL REFERENCES app_identity.workspaces(id) ON DELETE CASCADE,
  request_id uuid NOT NULL,
  input_digest text NOT NULL CHECK (input_digest ~ '^[a-f0-9]{64}$'),
  status text NOT NULL CHECK (status IN ('pending', 'organization-created', 'workspace-created', 'diagnostic-created', 'completed')),
  clerk_organization_id text,
  client_workspace_id uuid,
  diagnostic_id uuid,
  clerk_invitation_id text,
  created_by_clerk_user_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  PRIMARY KEY (workspace_id, request_id),
  CHECK ((status = 'completed') = (completed_at IS NOT NULL))
);

ALTER TABLE app_operations.poc_client_provisioning_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_operations.poc_client_provisioning_receipts FORCE ROW LEVEL SECURITY;
CREATE POLICY poc_client_provisioning_receipt_tenant_policy
  ON app_operations.poc_client_provisioning_receipts
  USING (workspace_id = app_identity.current_workspace_id())
  WITH CHECK (workspace_id = app_identity.current_workspace_id());

GRANT SELECT, INSERT, UPDATE ON app_operations.poc_client_provisioning_receipts TO capacity_workspace_app;
