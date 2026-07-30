import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("diagnostic synthesis advisor review is explicit and attributable", async () => {
  const migration = await readFile(new URL("../db/migrations/013_diagnostic_synthesis_advisor_validation.sql", import.meta.url), "utf8");
  assert.match(migration, /advisor_review_status text NOT NULL DEFAULT 'pending'/);
  assert.match(migration, /'approved', 'revision-required'/);
  assert.match(migration, /advisor_reviewed_by_clerk_user_id/);
  assert.match(migration, /advisor_reviewed_at timestamptz/);
});
