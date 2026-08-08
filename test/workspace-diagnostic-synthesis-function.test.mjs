import test from "node:test";
import assert from "node:assert/strict";
import { createWorkspaceDiagnosticSynthesisHandler } from "../netlify/functions/workspace-diagnostic-synthesis.mjs";
import { DiagnosticSynthesisStateError } from "../netlify/lib/workspace-diagnostic-synthesis.mjs";
import { readFile } from "node:fs/promises";
import { WORKSPACE_ROLES } from "../workspace-authorization.js";

const workspaceId = "11111111-1111-4111-8111-111111111111";
const diagnosticId = "22222222-2222-4222-8222-222222222222";
const auth = role => async () => ({ ok: true, value: { workspaceId, userId: "user_advisor", role: role || WORKSPACE_ROLES.facilitator } });
const request = (method = "GET", body) => new Request(`https://example.com/api/workspace/diagnostic-synthesis?diagnosticId=${diagnosticId}`, { method, headers: { origin: "https://example.com", ...(body ? { "content-type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });

test("assigned advisor reads and creates a protected synthesis draft", async () => {
  let received;
  const handler = createWorkspaceDiagnosticSynthesisHandler({
    authenticate: auth(),
    get: async value => ({ findingId: diagnosticId, status: "draft", diagnosticId: value.diagnosticId }),
    create: async value => { received = value; return { findingId: diagnosticId, status: "draft" }; },
    synthesize: async () => ({})
  });
  assert.equal((await handler(request())).status, 200);
  const response = await handler(request("POST", { diagnosticId }));
  assert.equal(response.status, 200);
  assert.equal(received.userId, "user_advisor");
  assert.equal(received.diagnosticId, diagnosticId);
});

test("assigned advisor records a distinct synthesis validation decision", async () => {
  let received;
  const handler = createWorkspaceDiagnosticSynthesisHandler({
    authenticate: auth(),
    review: async value => { received = value; return { findingId: diagnosticId, advisorReviewStatus: value.decision }; }
  });
  const response = await handler(request("PATCH", { diagnosticId, decision: "approved", reviewNote: "Evidence and uncertainty are faithfully represented." }));
  assert.equal(response.status, 200);
  assert.equal(received.userId, "user_advisor");
  assert.equal(received.decision, "approved");
  assert.match(received.reviewNote, /faithfully represented/);
});

test("synthesis blocks participants, unfinished review, malformed input, and foreign origins", async () => {
  const participant = createWorkspaceDiagnosticSynthesisHandler({ authenticate: auth(WORKSPACE_ROLES.participant) });
  assert.equal((await participant(request())).status, 403);
  const unfinished = createWorkspaceDiagnosticSynthesisHandler({ authenticate: auth(), create: async () => { throw new DiagnosticSynthesisStateError("review every evidence candidate"); }, synthesize: async () => ({}) });
  assert.equal((await unfinished(request("POST", { diagnosticId }))).status, 409);
  assert.equal((await unfinished(request("POST", { diagnosticId, extra: true }))).status, 400);
  assert.equal((await unfinished(request("PATCH", { diagnosticId, decision: "approved" }))).status, 400);
  const foreign = new Request(`https://example.com/api/workspace/diagnostic-synthesis?diagnosticId=${diagnosticId}`, { headers: { origin: "https://attacker.example" } });
  assert.equal((await unfinished(foreign)).status, 403);
});

test("activated v2 synthesis carries only approved frame and de-identified mechanism context",async()=>{
  const implementation=await readFile(new URL("../netlify/lib/workspace-diagnostic-synthesis.mjs",import.meta.url),"utf8");
  assert.match(implementation,/diagnostic_v2_collection_activations/);
  assert.match(implementation,/evidenceLayerId/);
  assert.match(implementation,/executionDemand/);
  assert.match(implementation,/mechanismIds/);
  assert.doesNotMatch(implementation,/participant_slot_id|encrypted_response_payload|clerk_user_id AS participant/);
});
