import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("leadership validation identity and responses remain in an operational tenant boundary", async () => {
  const migration = await readFile(new URL("../db/migrations/015_diagnostic_leadership_validation_decisions.sql", import.meta.url), "utf8");
  assert.match(migration, /app_operations\.diagnostic_leadership_validations/);
  assert.match(migration, /validator_clerk_user_id/);
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /FORCE ROW LEVEL SECURITY/);
  assert.match(migration, /UNIQUE \(workspace_id, diagnostic_id\)/);
});
