CREATE TABLE app_operations.diagnostic_steward_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  diagnostic_id uuid NOT NULL,
  session_type text NOT NULL CHECK (session_type IN ('guidance','design','revelation')),
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled')),
  scheduled_at timestamptz NOT NULL,
  booking_source text NOT NULL DEFAULT 'onecal-link' CHECK (booking_source IN ('onecal-link','onecal-api')),
  booked_by_clerk_user_id text NOT NULL,
  completed_by_clerk_user_id text,
  completion_note text,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, diagnostic_id, session_type),
  FOREIGN KEY (workspace_id, diagnostic_id) REFERENCES app_shared.diagnostics(workspace_id,id) ON DELETE CASCADE,
  CHECK ((completed_at IS NULL) = (completed_by_clerk_user_id IS NULL)),
  CHECK ((completed_at IS NULL) = (completion_note IS NULL))
);

ALTER TABLE app_operations.diagnostic_steward_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_operations.diagnostic_steward_sessions FORCE ROW LEVEL SECURITY;
CREATE POLICY diagnostic_steward_session_tenant_policy ON app_operations.diagnostic_steward_sessions
  USING (workspace_id = app_identity.current_workspace_id())
  WITH CHECK (workspace_id = app_identity.current_workspace_id());
GRANT SELECT,INSERT,UPDATE ON app_operations.diagnostic_steward_sessions TO capacity_workspace_app;
