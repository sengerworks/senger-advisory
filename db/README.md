# Workspace Database Foundation

`migrations/001_workspace_foundation.sql` defines the first transactional boundary for
production organizational workspaces. It has not been applied to a hosted database.

## Logical separation

- `app_identity` stores workspace, collection-round, and participant-slot mappings.
- `app_private` stores minimized individual submissions without account or invitation IDs.
- `app_shared` stores only threshold-qualified or explicitly suppressed organizational views.
- `app_operations` stores content-free audit events.

The participant-slot table is the restricted bridge between identity and a random submission
ID. Ordinary report queries do not join across that bridge.

## Tenant enforcement

Every tenant table:

- includes an immutable `workspace_id`;
- uses composite workspace foreign keys for tenant-owned relationships;
- has row-level security enabled and forced; and
- compares its workspace ID to the transaction-local `app.workspace_id` setting.

`workspace-tenant-boundary.js` sets that value with `set_config(..., true)` at the beginning
of a database transaction. The value must come from the server-verified Clerk organization
mapping, never a URL, form field, or JSON claim supplied by the browser.

Application authorization remains required. Row-level security prevents one workspace from
crossing into another; it does not decide whether an owner, facilitator, or participant may
perform a particular action inside the authorized workspace.

## Applying the migration later

Apply migrations with a migration-owner credential, not the runtime application credential.
Before a development connection is activated:

1. create a dedicated non-owner application role without `BYPASSRLS`;
2. grant it only connection, schema usage, and required table/sequence operations;
3. configure a separate aggregation role if private-submission reads need narrower access;
4. apply the migration to a disposable Neon development branch;
5. run real Postgres integration tests using two workspace identities; and
6. inspect policies and grants before retaining any participant data.

The migration deliberately does not create provider-specific users or embed database
credentials. Runtime grants belong in a later deployment migration after the exact Neon role
names and connection model are configured.
