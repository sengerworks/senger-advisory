# Neon Development Connection

## Status

The application adapter, migration runner, runtime grants, and real Postgres isolation test
are implemented. Migrations `001` and `002` have been applied to the Neon `development`
branch, and the live two-workspace isolation test passes through the restricted
`capacity_workspace_app` role. The production branch remains untouched.

## Required development resources

The Neon project uses a persistent development branch. The branch has
two connections:

1. the branch owner connection, used locally only to apply migrations; and
2. a non-owner role named exactly `capacity_workspace_app`, used by Netlify Functions and
   integration tests.

The runtime role must not own the database or tables and must not have `BYPASSRLS`. Do not use
the default `neondb_owner` connection as `NEON_DATABASE_URL`.

Use the direct branch-owner connection for migrations. The runtime connection may use Neon's
pooled endpoint. Keep `sslmode=require` and `channel_binding=require` when Neon includes them
in the generated connection string.

## Local environment

Copy `.env.example` to an ignored `.env` file and set:

```text
NEON_MIGRATION_DATABASE_URL=<direct development branch owner connection>
NEON_DATABASE_URL=<capacity_workspace_app connection>
```

Never paste either value into source files, a browser console, a commit, an assessment
payload, or this documentation.

## Verified first connection sequence

1. Create `capacity_workspace_app` with SQL so it does not inherit Neon's elevated console
   role.
2. Set the two local environment values.
3. Run `pnpm db:migrate`.
4. Run `pnpm test:workspace-db`.
5. Confirm the integration test reports one passing test and no skip. **Verified.**
6. Add only `NEON_DATABASE_URL` to the Netlify development or deploy-preview context.
   **Deferred until an authenticated function needs the connection.**

The migration runner records a SHA-256 checksum with each applied migration and refuses to
continue if an already-applied migration has changed. Each migration and its history record
commit atomically.

## What the integration test proves

The live test:

- verifies the runtime connection is `capacity_workspace_app`;
- verifies the role does not have `BYPASSRLS`;
- creates two disposable workspaces through the runtime role;
- confirms one workspace can read only its own row;
- confirms a cross-workspace update affects zero rows; and
- deletes both disposable workspaces in tenant-scoped transactions.

This is the first real database gate, not the final security review. Later tests must cover
rounds, participant slots, submissions, aggregates, audit events, revoked membership, and
concurrent closure/deletion.
