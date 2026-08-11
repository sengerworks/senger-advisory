import test from "node:test";
import assert from "node:assert/strict";
import { createWorkspaceDiagnosticProtocolV2Handler } from "../netlify/functions/workspace-diagnostic-protocol-v2.mjs";
import { compileWorkspaceDiagnosticProtocolV2, DiagnosticProtocolV2StateError, validateDiagnosticProtocolV2Approval } from "../netlify/lib/workspace-diagnostic-protocol-v2.mjs";
import { DiagnosticEvidenceReviewAccessError } from "../netlify/lib/workspace-diagnostic-evidence-review.mjs";
import { WORKSPACE_ROLES } from "../workspace-authorization.js";

const workspaceId = "11111111-1111-4111-8111-111111111111";
const diagnosticId = "22222222-2222-4222-8222-222222222222";
const frame = Object.freeze({
  frameId: "33333333-3333-4333-8333-333333333333", diagnosticId, frameVersion: "2.0.0", status: "approved",
  organizationContext: "A growing organization must protect platform delivery while integrating more teams, customers, and locations.",
  executionDemand: {
    commitment: "Deliver the next platform release while improving customer reliability and disciplined commercial growth.",
    successDefinition: "The release ships on time and teams make aligned tradeoffs without repeated executive escalation.",
    failureExposure: "Delivery delay and unstable service would expose renewals, growth expectations, and retention.",
    timeHorizon: "Next two quarters"
  },
  diagnosticQuestion: "What prevents the operating system from carrying the coordination and decision load required by the strategy?",
  leadershipDecision: "Whether to change decision rights, commercial gates, and cross-functional routines before planning.",
  performanceConsequences: ["Renewals and the core platform release are exposed to avoidable execution risk."],
  complexityProfile: { observations: [], dimensionsRepresented: [], classificationState: "provisional" },
  evidencePlan: { sourceTypes: [], participantSlots: [], formalArtifactsRequested: [], operatingDataRequested: [], acceptedCoverageGaps: [] },
  approval: { approvedAt: "2026-08-08T12:00:00.000Z" }
});
const draft = compileWorkspaceDiagnosticProtocolV2(frame, { id: "protocol-1", now: new Date("2026-08-08T12:00:00.000Z") });
const approval = { diagnosticId, questions: draft.questions.map(question => ({ templateId: question.templateId, questionText: question.questionText, contextualizationNote: question.contextualizationNote })), approvalNote: "Approved as an evidence-sufficient protocol for the framed execution demand.", acceptedResearchLimitations: true };
const auth = role => async () => ({ ok: true, value: { workspaceId, userId: "user_advisor", role: role || WORKSPACE_ROLES.facilitator } });
const request = (method = "GET", body, origin = "https://example.com") => new Request(`https://example.com/api/workspace/diagnostic-protocol-v2?diagnosticId=${diagnosticId}`, { method, headers: { origin, ...(body ? { "content-type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });

test("compiles eighteen frame-specific questions with evidence-layer sufficiency", () => {
  assert.equal(draft.questions.length, 18);
  assert.match(draft.questions[0].questionText, /execution commitment in view/);
  assert.equal(draft.questions.every(question => question.questionText.length <= 600), true);
  assert.equal(new Set(draft.questions.flatMap(question => question.mechanismIds)).size, 5);
});

test("validates protocol approval against its frame and research boundary", () => {
  const validated = validateDiagnosticProtocolV2Approval(approval, frame);
  assert.equal(validated.questions.length, 18);
  assert.equal(validated.acceptedResearchLimitations, true);
  assert.throws(() => validateDiagnosticProtocolV2Approval({ ...approval, acceptedResearchLimitations: false }, frame), /Adaptive Capacity/);
  assert.throws(() => validateDiagnosticProtocolV2Approval({ ...approval, finding: "answer" }, frame), /Only the diagnostic/);
});

test("assigned advisors retrieve and approve the v2 protocol", async () => {
  let received;
  const handler = createWorkspaceDiagnosticProtocolV2Handler({
    authenticate: auth(),
    getProtocol: async value => ({ protocol: null, draft, diagnosticId: value.diagnosticId }),
    approveProtocol: async value => { received = value; return { protocolId: "protocol-1", status: "approved" }; }
  });
  assert.equal((await handler(request())).status, 200);
  assert.equal((await handler(request("POST", approval))).status, 201);
  assert.equal(received.input.diagnosticId, diagnosticId);
  assert.equal(received.userId, "user_advisor");
});

test("assigned steward finalizes only the sponsor-approved protocol", async () => {
  let received;
  const handler = createWorkspaceDiagnosticProtocolV2Handler({
    authenticate: auth(),
    finalizeProtocol: async value => { received = value; return { state: "finalized" }; }
  });
  const response = await handler(request("PATCH", { diagnosticId, approvalNote: "The sponsor-approved wording preserves all evidence objectives and is ready for controlled collection." }));
  assert.equal(response.status, 200);
  assert.equal(received.input.diagnosticId, diagnosticId);
  assert.equal(received.userId, "user_advisor");
});

test("participants, foreign origins, missing frames, and missing assignments fail closed", async () => {
  const participant = createWorkspaceDiagnosticProtocolV2Handler({ authenticate: auth(WORKSPACE_ROLES.participant) });
  assert.equal((await participant(request())).status, 403);
  const base = createWorkspaceDiagnosticProtocolV2Handler({ authenticate: auth() });
  assert.equal((await base(request("GET", undefined, "https://attacker.example"))).status, 403);
  assert.equal((await base(new Request("https://example.com/api/workspace/diagnostic-protocol-v2?diagnosticId=invalid", { headers: { origin: "https://example.com" } }))).status, 400);
  assert.equal((await base(request("DELETE"))).status, 405);
  const unassigned = createWorkspaceDiagnosticProtocolV2Handler({ authenticate: auth(), getProtocol: async () => { throw new DiagnosticEvidenceReviewAccessError("assignment"); } });
  assert.equal((await unassigned(request())).status, 403);
  const missingFrame = createWorkspaceDiagnosticProtocolV2Handler({ authenticate: auth(), getProtocol: async () => { throw new DiagnosticProtocolV2StateError("frame required"); } });
  assert.equal((await missingFrame(request())).status, 409);
});
