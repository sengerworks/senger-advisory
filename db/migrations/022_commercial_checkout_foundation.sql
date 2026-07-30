CREATE TABLE app_operations.commercial_checkout_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL,
  diagnostic_id uuid NOT NULL, entitlement_id uuid NOT NULL,
  provider text NOT NULL CHECK (provider='stripe'), provider_checkout_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('open','completed','expired')),
  created_by_clerk_user_id text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz, PRIMARY KEY (workspace_id,id),
  UNIQUE (workspace_id,provider_checkout_id),
  FOREIGN KEY (workspace_id,diagnostic_id) REFERENCES app_shared.diagnostics(workspace_id,id) ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id,entitlement_id) REFERENCES app_shared.commercial_entitlements(workspace_id,id) ON DELETE RESTRICT,
  CHECK ((status='completed') = (completed_at IS NOT NULL))
);

CREATE TABLE app_operations.commercial_webhook_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL,
  provider text NOT NULL CHECK (provider='stripe'), provider_event_id text NOT NULL,
  event_type text NOT NULL, provider_checkout_id text,
  processing_result text NOT NULL CHECK (processing_result IN ('activated','ignored')),
  received_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (workspace_id,id),
  UNIQUE (provider,provider_event_id),
  FOREIGN KEY (workspace_id) REFERENCES app_identity.workspaces(id) ON DELETE RESTRICT
);

CREATE INDEX commercial_checkout_entitlement_idx ON app_operations.commercial_checkout_sessions(workspace_id,entitlement_id,created_at DESC);
ALTER TABLE app_operations.commercial_checkout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_operations.commercial_checkout_sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE app_operations.commercial_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_operations.commercial_webhook_events FORCE ROW LEVEL SECURITY;
CREATE POLICY commercial_checkout_session_tenant_policy ON app_operations.commercial_checkout_sessions USING (workspace_id=app_identity.current_workspace_id()) WITH CHECK (workspace_id=app_identity.current_workspace_id());
CREATE POLICY commercial_webhook_event_tenant_policy ON app_operations.commercial_webhook_events USING (workspace_id=app_identity.current_workspace_id()) WITH CHECK (workspace_id=app_identity.current_workspace_id());
GRANT SELECT,INSERT,UPDATE ON app_operations.commercial_checkout_sessions TO capacity_workspace_app;
GRANT SELECT,INSERT ON app_operations.commercial_webhook_events TO capacity_workspace_app;
