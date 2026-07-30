import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
test("Capacity Operating Brief is tenant-isolated and linked to validated product records",async()=>{const migration=await readFile(new URL("../db/migrations/016_capacity_operating_briefs.sql",import.meta.url),"utf8");assert.match(migration,/app_shared\.capacity_operating_briefs/);assert.match(migration,/finding_id uuid NOT NULL/);assert.match(migration,/intervention_id uuid NOT NULL/);assert.match(migration,/ENABLE ROW LEVEL SECURITY/);assert.match(migration,/FORCE ROW LEVEL SECURITY/);assert.match(migration,/UNIQUE \(workspace_id, diagnostic_id\)/);});

