import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  resolveNeonWorkspaceId,
  withNeonWorkspaceTransaction
} from "../netlify/lib/neon-workspace-database.mjs";

const connectionString = process.env.NEON_DATABASE_URL;
const integrationTest = connectionString ? test : test.skip;

integrationTest("real Postgres RLS isolates two workspaces", async () => {
  const alphaWorkspaceId = randomUUID();
  const bravoWorkspaceId = randomUUID();
  const marker = randomUUID();
  const clerkOrganizationId = `org_${marker.replaceAll("-", "")}`;

  const roleCheck = await withNeonWorkspaceTransaction(alphaWorkspaceId, async ({ query }) => {
    return query(`
      SELECT current_user AS role_name, rolbypassrls
      FROM pg_roles
      WHERE rolname = current_user
    `);
  }, connectionString);
  assert.equal(roleCheck.rows[0].role_name, "capacity_workspace_app");
  assert.equal(roleCheck.rows[0].rolbypassrls, false);

  await withNeonWorkspaceTransaction(alphaWorkspaceId, async ({ query }) => {
    await query(
      `INSERT INTO app_identity.workspaces
        (id, clerk_organization_id, display_label, created_by_clerk_user_id)
       VALUES ($1, $2, $3, $4)`,
      [alphaWorkspaceId, clerkOrganizationId, "Integration Alpha", `user_${marker}`]
    );
  }, connectionString);

  await withNeonWorkspaceTransaction(bravoWorkspaceId, async ({ query }) => {
    await query(
      `INSERT INTO app_identity.workspaces
        (id, clerk_organization_id, display_label, created_by_clerk_user_id)
       VALUES ($1, $2, $3, $4)`,
      [bravoWorkspaceId, `org_bravo_${marker}`, "Integration Bravo", `user_${marker}`]
    );
  }, connectionString);

  try {
    assert.equal(
      await resolveNeonWorkspaceId(clerkOrganizationId, connectionString),
      alphaWorkspaceId
    );
    assert.equal(
      await resolveNeonWorkspaceId(`org_${randomUUID().replaceAll("-", "")}`, connectionString),
      null
    );

    const alphaRows = await withNeonWorkspaceTransaction(alphaWorkspaceId, async ({ query }) => {
      return query("SELECT id, display_label FROM app_identity.workspaces ORDER BY display_label");
    }, connectionString);

    assert.deepEqual(
      alphaRows.rows.map(({ id, display_label }) => ({ id, display_label })),
      [{ id: alphaWorkspaceId, display_label: "Integration Alpha" }]
    );

    const round = await withNeonWorkspaceTransaction(alphaWorkspaceId, async ({ query }) => {
      return query(
        `INSERT INTO app_identity.collection_rounds
          (workspace_id, display_label, assessment_version, scoring_version, notice_version,
           minimum_participants, opens_at, closes_at)
         VALUES ($1, $2, '1.0.0', '0.1.0', '1.0.0', 5, now(), now() + interval '14 days')
         RETURNING display_label, status, minimum_participants`,
        [alphaWorkspaceId, "Integration Capacity Baseline"]
      );
    }, connectionString);
    assert.deepEqual(round.rows[0], {
      display_label: "Integration Capacity Baseline",
      status: "draft",
      minimum_participants: 5
    });

    const crossTenantMutation = await withNeonWorkspaceTransaction(
      alphaWorkspaceId,
      async ({ query }) => query(
        "UPDATE app_identity.workspaces SET display_label = $1 WHERE id = $2",
        ["Cross-tenant mutation", bravoWorkspaceId]
      ),
      connectionString
    );
    assert.equal(crossTenantMutation.rowCount, 0);
  } finally {
    for (const workspaceId of [alphaWorkspaceId, bravoWorkspaceId]) {
      await withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
        await query("DELETE FROM app_identity.workspaces WHERE id = $1", [workspaceId]);
      }, connectionString);
    }
  }
});
