import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Protocol v2 preserves sponsor review and steward finalization as separate auditable gates",async()=>{
  const sql=await readFile(new URL("../db/migrations/041_stewarded_protocol_governance.sql",import.meta.url),"utf8");
  assert.match(sql,/sponsor_reviewed_questions jsonb/);
  assert.match(sql,/jsonb_array_length\(sponsor_reviewed_questions\) = 18/);
  assert.match(sql,/sponsor_approved_by_clerk_user_id/);
  assert.match(sql,/steward_finalized_by_clerk_user_id/);
  assert.match(sql,/steward_finalized_at IS NULL OR sponsor_approved_at IS NOT NULL/);
});
