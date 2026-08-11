import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
test("Intervention Directions are private, tenant-isolated, and steward-reviewed",async()=>{const sql=await readFile(new URL("../db/migrations/045_evidence_informed_intervention_directions.sql",import.meta.url),"utf8");assert.match(sql,/app_private\.diagnostic_intervention_directions/);assert.match(sql,/ENABLE ROW LEVEL SECURITY/);assert.match(sql,/FORCE ROW LEVEL SECURITY/);assert.match(sql,/workspace_id=app_identity\.current_workspace_id\(\)/);assert.match(sql,/advisor_review_status/);});
