import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("advisor-approved synthesis advances existing diagnostics to leadership validation", async () => {
  const migration = await readFile(new URL("../db/migrations/014_diagnostic_leadership_validation_gate.sql", import.meta.url), "utf8");
  assert.match(migration, /advisor_review_status = 'approved'/);
  assert.match(migration, /state = 'leadership-validation'/);
  assert.match(migration, /diagnostic\.state = 'synthesis'/);
});

