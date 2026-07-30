import test from "node:test";
import assert from "node:assert/strict";
import { createWorkspaceDiagnosticEvidenceReviewHandler } from "../netlify/functions/workspace-diagnostic-evidence-review.mjs";
import { DiagnosticEvidenceReviewAccessError, validateEvidenceReviewInput } from "../netlify/lib/workspace-diagnostic-evidence-review.mjs";
import { WORKSPACE_ROLES } from "../workspace-authorization.js";

const workspaceId = "11111111-1111-4111-8111-111111111111";
const diagnosticId = "22222222-2222-4222-8222-222222222222";
const evidenceId = "33333333-3333-4333-8333-333333333333";
const auth = role => async () => ({ ok: true, value: { workspaceId, userId: "user_advisor", role: role || WORKSPACE_ROLES.facilitator } });
const request = (method = "GET", body, origin = "https://example.com") => new Request(
  `https://example.com/api/workspace/diagnostic-evidence-review?diagnosticId=${diagnosticId}`,
  { method, headers: { origin, ...(body ? { "content-type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined }
);

test("validates bounded human evidence-review decisions", () => {
  assert.deepEqual(validateEvidenceReviewInput({ diagnosticId, evidenceId, decision: "approved", reviewNote: "Disclosure risk checked." }), { diagnosticId, evidenceId, decision: "approved", reviewNote: "Disclosure risk checked." });
  assert.throws(() => validateEvidenceReviewInput({ diagnosticId, evidenceId, decision: "excluded", reviewNote: "" }), /Explain why/);
});

test("returns only the assigned advisor de-identified queue", async () => {
  let received;
  const handler = createWorkspaceDiagnosticEvidenceReviewHandler({
    authenticate: auth(),
    getQueue: async value => { received = value; return { progress: { total: 1, pending: 1 }, evidence: [{ evidenceId, deidentifiedText: "A protected operating pattern suitable for disclosure review." }] }; }
  });
  const response = await handler(request());
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(received.userId, "user_advisor");
  assert.equal(payload.evidence[0].evidenceId, evidenceId);
  assert.equal("sourceInterviewId" in payload.evidence[0], false);
});

test("records an assigned advisor review and blocks participants or unassigned users", async () => {
  let reviewed;
  const handler = createWorkspaceDiagnosticEvidenceReviewHandler({
    authenticate: auth(),
    reviewEvidence: async value => { reviewed = value; return { evidenceId, reviewStatus: value.input.decision }; }
  });
  const body = { diagnosticId, evidenceId, decision: "excluded", reviewNote: "The incident remains too distinctive." };
  assert.equal((await handler(request("POST", body))).status, 200);
  assert.equal(reviewed.userId, "user_advisor");
  const participant = createWorkspaceDiagnosticEvidenceReviewHandler({ authenticate: auth(WORKSPACE_ROLES.participant) });
  assert.equal((await participant(request())).status, 403);
  const unassigned = createWorkspaceDiagnosticEvidenceReviewHandler({ authenticate: auth(), getQueue: async () => { throw new DiagnosticEvidenceReviewAccessError("assignment required"); } });
  assert.equal((await unassigned(request())).status, 403);
  assert.equal((await handler(request("GET", undefined, "https://attacker.example"))).status, 403);
});
