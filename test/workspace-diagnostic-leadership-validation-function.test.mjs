import test from "node:test";
import assert from "node:assert/strict";
import { createWorkspaceDiagnosticLeadershipValidationHandler } from "../netlify/functions/workspace-diagnostic-leadership-validation.mjs";
import { LeadershipValidationInputError, validateLeadershipValidationInput } from "../netlify/lib/workspace-diagnostic-leadership-validation.mjs";
import { WORKSPACE_ROLES } from "../workspace-authorization.js";

const diagnosticId = "22222222-2222-4222-8222-222222222222";
const request = (origin = "https://example.com") => new Request(`https://example.com/api/workspace/diagnostic-leadership-validation?diagnosticId=${diagnosticId}`, { headers: { origin } });
const authenticate = role => async () => ({ ok: true, value: { workspaceId: "11111111-1111-4111-8111-111111111111", userId: "user_test", role } });

test("client sponsor receives only the governed confidentiality-gated view", async () => {
  let received;
  const handler = createWorkspaceDiagnosticLeadershipValidationHandler({
    authenticate: authenticate(WORKSPACE_ROLES.owner),
    getView: async value => { received = value; return { state: "ready", confidentiality: { completed: 5 }, finding: { confidence: "moderate" } }; }
  });
  const response = await handler(request());
  assert.equal(response.status, 200);
  assert.equal(received.diagnosticId, diagnosticId);
  const payload = await response.json();
  assert.equal(payload.state, "ready");
  assert.equal(payload.confidentiality.completed, 5);
  assert.doesNotMatch(JSON.stringify(payload), /participantIdentity|evidenceId|rawResponse|advisorReviewNote/);
});

test("leadership validation blocks non-sponsors, foreign origins, and unsupported methods", async () => {
  const facilitator = createWorkspaceDiagnosticLeadershipValidationHandler({ authenticate: authenticate(WORKSPACE_ROLES.facilitator) });
  assert.equal((await facilitator(request())).status, 403);
  assert.equal((await facilitator(request("https://attacker.example"))).status, 403);
  assert.equal((await facilitator(new Request(`https://example.com/api/workspace/diagnostic-leadership-validation?diagnosticId=${diagnosticId}`, { method: "DELETE", headers: { origin: "https://example.com" } }))).status, 405);
});

const accepted = { diagnosticId, resonance: "supports", completeness: "complete-enough", surprised: true, missingEvidence: "", materialObjection: false, objection: "", decision: "accepted", decisionNote: "Leadership accepts this finding as complete enough to inform intervention design." };

test("client sponsor records one explicit leadership validation decision", async () => {
  let received;
  const handler = createWorkspaceDiagnosticLeadershipValidationHandler({
    authenticate: authenticate(WORKSPACE_ROLES.owner),
    record: async value => { received = value; return { validationId: "validation-1", decision: value.input.decision }; }
  });
  const response = await handler(new Request("https://example.com/api/workspace/diagnostic-leadership-validation", { method: "POST", headers: { origin: "https://example.com", "content-type": "application/json" }, body: JSON.stringify(accepted) }));
  assert.equal(response.status, 201);
  assert.equal(received.input.decision, "accepted");
  assert.equal(received.input.diagnosticId, diagnosticId);
});

test("material challenges cannot be accepted without revision", () => {
  assert.throws(() => validateLeadershipValidationInput({ ...accepted, materialObjection: true, objection: "The finding excludes a material operating constraint that changes the interpretation." }), LeadershipValidationInputError);
  const revision = validateLeadershipValidationInput({ ...accepted, resonance: "challenges", completeness: "material-gaps", missingEvidence: "The frontline delivery perspective is materially absent from this finding.", materialObjection: true, objection: "The current hypothesis overstates leadership authority as the primary constraint.", decision: "revision-required" });
  assert.equal(revision.decision, "revision-required");
});
