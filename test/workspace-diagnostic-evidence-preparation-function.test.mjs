import test from "node:test";
import assert from "node:assert/strict";
import { createWorkspaceDiagnosticEvidencePreparationHandler } from "../netlify/functions/workspace-diagnostic-evidence-preparation.mjs";
import { WORKSPACE_ROLES } from "../workspace-authorization.js";
import { readFile } from "node:fs/promises";

const diagnosticId = "22222222-2222-4222-8222-222222222222";
const auth = role => async () => ({ ok: true, value: { workspaceId: "11111111-1111-4111-8111-111111111111", userId: "user_advisor", role: role || WORKSPACE_ROLES.facilitator } });
const request = (method = "POST", body = { diagnosticId }, origin = "https://example.com") => new Request("https://example.com/api/workspace/diagnostic-evidence-preparation", { method, headers: { origin, "content-type": "application/json" }, body: method === "POST" ? JSON.stringify(body) : undefined });

test("assigned advisor starts one bounded protected preparation job", async () => {
  let received;
  const handler = createWorkspaceDiagnosticEvidencePreparationHandler({ authenticate: auth(), deidentify: async () => [], prepare: async value => { received = value; return { prepared: true, evidenceCount: 12, requiresManualReview: true }; } });
  const response = await handler(request());
  assert.equal(response.status, 200);
  assert.equal(received.diagnosticId, diagnosticId);
  assert.equal(received.userId, "user_advisor");
  assert.equal(typeof received.deidentify, "function");
  assert.equal((await response.json()).requiresManualReview, true);
});

test("participants, foreign origins, malformed input, and unsupported methods fail closed", async () => {
  const participant = createWorkspaceDiagnosticEvidencePreparationHandler({ authenticate: auth(WORKSPACE_ROLES.participant) });
  assert.equal((await participant(request())).status, 403);
  const handler = createWorkspaceDiagnosticEvidencePreparationHandler({ authenticate: auth() });
  assert.equal((await handler(request("GET"))).status, 405);
  assert.equal((await handler(request("POST", { diagnosticId, extra: true }))).status, 400);
  assert.equal((await handler(request("POST", { diagnosticId }, "https://attacker.example"))).status, 403);
});

test("evidence preparation routes only the explicitly activated interview version",async()=>{
  const implementation=await readFile(new URL("../netlify/lib/workspace-diagnostic-evidence-preparation.mjs",import.meta.url),"utf8");
  assert.match(implementation,/diagnostic_v2_collection_activations/);
  assert.match(implementation,/source_interview_v2_id/);
  assert.match(implementation,/interviewVersion: source\.interviewVersion/);
  assert.doesNotMatch(implementation,/participant_slot_id|participant_clerk_user_id/);
});
