import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("POC scorecard counts completed Protocol v2 interviews", async () => {
  const source = await readFile(new URL("../netlify/lib/workspace-poc-scorecard.mjs", import.meta.url), "utf8");
  assert.match(source, /diagnostic_interviews_v2/);
  assert.match(source, /COALESCE\(interview_v2\.status,interview\.status\)/);
  assert.doesNotMatch(source, /encrypted_response_payload|response_payload/);
  assert.match(source, /participantIdentityIncluded:false/);
});
