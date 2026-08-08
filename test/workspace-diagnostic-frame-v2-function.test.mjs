import test from "node:test";
import assert from "node:assert/strict";
import { createWorkspaceDiagnosticFrameV2Handler } from "../netlify/functions/workspace-diagnostic-frame-v2.mjs";
import { DiagnosticFrameV2StateError, toPublicDiagnosticFrameV2, validateDiagnosticFrameV2Input } from "../netlify/lib/workspace-diagnostic-frame-v2.mjs";
import { DiagnosticEvidenceReviewAccessError } from "../netlify/lib/workspace-diagnostic-evidence-review.mjs";
import { WORKSPACE_ROLES } from "../workspace-authorization.js";

const workspaceId = "11111111-1111-4111-8111-111111111111";
const diagnosticId = "22222222-2222-4222-8222-222222222222";
const observation = (dimension, index) => ({
  observationId: `observation-${index}`, source: "Approved sponsor discovery",
  description: `The organization reports a material increase in ${dimension} affecting the execution commitment.`,
  dimensions: [dimension], state: "current", classification: "mixed",
  classificationRationale: "The demand is partly inherent and partly amplified by current operating choices.",
  evidenceRefs: [], confidence: "moderate",
  confidenceBasis: "Sponsor evidence is concrete, but participant evidence has not yet been collected."
});
const input = {
  diagnosticId,
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
  complexityObservations: ["volume", "variety", "interdependence", "uncertainty", "rate-of-change"].map(observation),
  evidencePlan: {
    sourceTypes: ["sponsor-discovery", "participant-interview", "operating-data"],
    participantSlots: Array.from({ length: 5 }, (_, index) => ({ slotId: `slot-${index + 1}`, leadershipLevel: index ? "functional" : "enterprise", executionProximity: index > 2 ? "delivery" : "coordination", functionalLens: ["executive-leadership", "operations", "people", "commercial", "product-service"][index] })),
    formalArtifactsRequested: ["Decision-rights framework"], operatingDataRequested: ["Cross-functional cycle time"], acceptedCoverageGaps: []
  },
  outOfScope: ["Individual performance evaluation"], knownSensitivities: "Commercial and product leaders disagree about the source of strain.",
  approvalNote: "The execution demand, scope, and evidence plan are approved for v2 method development.",
  confirmedExecutionDemand: true, acceptedEvidencePlan: true
};
const auth = role => async () => ({ ok: true, value: { workspaceId, userId: "user_advisor", role: role || WORKSPACE_ROLES.facilitator } });
const request = (method = "GET", body, origin = "https://example.com") => new Request(`https://example.com/api/workspace/diagnostic-frame-v2?diagnosticId=${diagnosticId}`, { method, headers: { origin, ...(body ? { "content-type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });

test("validates a complete approved v2 Diagnostic Frame without accepting findings or scores", () => {
  const result = validateDiagnosticFrameV2Input(input);
  assert.equal(result.frameValues.diagnosticId, diagnosticId);
  assert.equal(result.frameValues.complexityObservations.length, 5);
  assert.throws(() => validateDiagnosticFrameV2Input({ ...input, capacityScore: 82 }), /unsupported fields/);
});

test("does not mistake an empty left-join row for an existing Diagnostic Frame", () => {
  assert.equal(toPublicDiagnosticFrameV2({ id: null, diagnostic_id: diagnosticId, frame_payload: null }), null);
});

test("assigned advisors retrieve source context and approve one frame", async () => {
  let received;
  const handler = createWorkspaceDiagnosticFrameV2Handler({
    authenticate: auth(),
    getFrame: async value => ({ frame: null, context: { strategicPriority: "Protect delivery." }, diagnosticId: value.diagnosticId }),
    approveFrame: async value => { received = value; return { frameId: "frame-1", status: "approved" }; }
  });
  assert.equal((await handler(request())).status, 200);
  const response = await handler(request("POST", input));
  assert.equal(response.status, 201);
  assert.equal(received.userId, "user_advisor");
  assert.equal(received.input.frameValues.diagnosticId, diagnosticId);
});

test("participants, foreign origins, missing assignments, and duplicate frames fail closed", async () => {
  const participant = createWorkspaceDiagnosticFrameV2Handler({ authenticate: auth(WORKSPACE_ROLES.participant) });
  assert.equal((await participant(request())).status, 403);
  const handler = createWorkspaceDiagnosticFrameV2Handler({ authenticate: auth() });
  assert.equal((await handler(request("GET", undefined, "https://attacker.example"))).status, 403);
  assert.equal((await handler(request("DELETE"))).status, 405);
  const unassigned = createWorkspaceDiagnosticFrameV2Handler({ authenticate: auth(), getFrame: async () => { throw new DiagnosticEvidenceReviewAccessError("assignment required"); } });
  assert.equal((await unassigned(request())).status, 403);
  const duplicate = createWorkspaceDiagnosticFrameV2Handler({ authenticate: auth(), approveFrame: async () => { throw new DiagnosticFrameV2StateError("already exists"); } });
  assert.equal((await duplicate(request("POST", input))).status, 409);
});
