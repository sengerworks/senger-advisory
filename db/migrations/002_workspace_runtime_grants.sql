-- Create this exact non-owner login role in the Neon console before applying this migration.
-- Its password and connection string must never appear in this repository.
GRANT USAGE ON SCHEMA app_identity, app_private, app_shared, app_operations
  TO capacity_workspace_app;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON app_identity.workspaces,
     app_identity.collection_rounds,
     app_identity.participant_slots,
     app_private.submissions,
     app_shared.organizational_aggregates,
     app_operations.audit_events
  TO capacity_workspace_app;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA app_operations
  TO capacity_workspace_app;

REVOKE CREATE ON SCHEMA app_identity, app_private, app_shared, app_operations
  FROM capacity_workspace_app;
