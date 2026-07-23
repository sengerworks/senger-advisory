import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  requireMatchingWorkspace,
  requireWorkspaceId,
  withWorkspaceTransaction
} from "../workspace-tenant-boundary.js";
import {
  ALPHA_WORKSPACE_ID,
  BRAVO_WORKSPACE_ID,
  workspaceRows
} from "../test-support/workspace-tenants.mjs";

const migrationUrl = new URL("../db/migrations/001_workspace_foundation.sql", import.meta.url);

function createDatabaseRecorder() {
  const calls = [];
  return {
    calls,
    async transaction(operation) {
      calls.push({ type: "begin" });
      const result = await operation({
        async query(text, parameters) {
          calls.push({ type: "query", text, parameters });
          return { rows: [] };
        }
      });
      calls.push({ type: "commit" });
      return result;
    }
  };
}

test("requires a canonical UUID before opening a workspace transaction", async () => {
  assert.equal(requireWorkspaceId(ALPHA_WORKSPACE_ID), ALPHA_WORKSPACE_ID);
  assert.throws(() => requireWorkspaceId("alpha"), /valid authorized workspace ID/);
  assert.throws(() => requireWorkspaceId(undefined), /valid authorized workspace ID/);
});

test("binds the authorized workspace as transaction-local database context", async () => {
  const database = createDatabaseRecorder();

  const result = await withWorkspaceTransaction(database, ALPHA_WORKSPACE_ID, async (scope) => {
    assert.equal(scope.workspaceId, ALPHA_WORKSPACE_ID);
    await scope.query("SELECT id FROM app_identity.collection_rounds");
    return "complete";
  });

  assert.equal(result, "complete");
  assert.deepEqual(database.calls[1], {
    type: "query",
    text: "SELECT set_config('app.workspace_id', $1, true)",
    parameters: [ALPHA_WORKSPACE_ID]
  });
  assert.equal(database.calls.at(-1).type, "commit");
});

test("denies records belonging to a second workspace", () => {
  const alphaScope = { workspaceId: ALPHA_WORKSPACE_ID };
  const alphaRecord = workspaceRows.find((row) => row.workspace_id === ALPHA_WORKSPACE_ID);
  const bravoRecord = workspaceRows.find((row) => row.workspace_id === BRAVO_WORKSPACE_ID);

  assert.equal(requireMatchingWorkspace(alphaScope, alphaRecord), alphaRecord);
  assert.throws(
    () => requireMatchingWorkspace(alphaScope, bravoRecord),
    /Workspace access denied/
  );
  assert.throws(
    () => requireMatchingWorkspace({ workspaceId: BRAVO_WORKSPACE_ID }, alphaRecord),
    /Workspace access denied/
  );
});

test("migration enables and forces RLS for every tenant table", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  const tenantTables = [
    "app_identity.workspaces",
    "app_identity.collection_rounds",
    "app_identity.participant_slots",
    "app_private.submissions",
    "app_shared.organizational_aggregates",
    "app_operations.audit_events"
  ];

  for (const table of tenantTables) {
    assert.match(sql, new RegExp(`ALTER TABLE ${table.replace(".", "\\.")} ENABLE ROW LEVEL SECURITY`));
    assert.match(sql, new RegExp(`ALTER TABLE ${table.replace(".", "\\.")} FORCE ROW LEVEL SECURITY`));
  }
  assert.equal((sql.match(/CREATE POLICY /g) || []).length, tenantTables.length);
});

test("tenant-owned relationships use composite workspace foreign keys", async () => {
  const sql = await readFile(migrationUrl, "utf8");

  assert.match(
    sql,
    /FOREIGN KEY \(workspace_id, round_id\)\s+REFERENCES app_identity\.collection_rounds\(workspace_id, id\)/g
  );
  assert.match(
    sql,
    /FOREIGN KEY \(workspace_id, submission_id\)\s+REFERENCES app_private\.submissions\(workspace_id, id\)/
  );
  assert.doesNotMatch(sql, /REFERENCES app_private\.submissions\(id\)/);
});
