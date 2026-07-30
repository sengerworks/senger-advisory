import test from "node:test";
import assert from "node:assert/strict";
import { createWorkspaceDiagnosticInterventionHandler } from "../netlify/functions/workspace-diagnostic-intervention.mjs";
import { DiagnosticInterventionInputError, validateInterventionInput } from "../netlify/lib/workspace-diagnostic-intervention.mjs";
import { WORKSPACE_ROLES } from "../workspace-authorization.js";

const diagnosticId = "22222222-2222-4222-8222-222222222222";
const auth = role => async () => ({ ok: true, value: { workspaceId: "11111111-1111-4111-8111-111111111111", userId: "user_advisor", role } });
const request = (method = "GET", body) => new Request(`https://example.com/api/workspace/diagnostic-intervention?diagnosticId=${diagnosticId}`, { method, headers: { origin: "https://example.com", ...(body ? { "content-type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
const proposal = { diagnosticId, serviceRoute: "advisor-guided", objective: "Reduce recurring commercial exception latency while preserving appropriate platform discipline.", rationale: "Leadership-validated evidence indicates that recurring commercial tradeoffs are concentrating at senior levels and delaying execution.", scope: "One recurring class of non-standard commercial request across Sales, Product, Engineering, and Customer Success.", operatingChanges: ["Publish delegated thresholds for the selected request class."], commitments: [{ action: "Apply and document the threshold to every qualifying request during the test.", ownerRole: "VP Product", timing: "First 30 days" }], learningRequirements: ["Decision-rights calibration for affected managers."], evidencePlan: [{ evidenceClass: "delivery", measure: "Share of qualifying requests processed through the agreed workflow.", observationCadence: "Weekly" }, { evidenceClass: "operating-change", measure: "Decision time, escalation volume, and handoff reliability for qualifying requests.", observationCadence: "Biweekly" }, { evidenceClass: "capacity-change", measure: "Reassessed decision capacity after the bounded intervention period.", observationCadence: "At 90 days" }], reviewCadence: "Biweekly operating review with a formal 30-day decision checkpoint.", duration: "90 days", commercialOfferRef: "POC-INTERVENTION-001" };

test("validates a bounded intervention with all three evidence classes", () => {
  const result = validateInterventionInput(proposal);
  assert.equal(result.serviceRoute, "advisor-guided");
  assert.deepEqual(result.proposal.evidencePlan.map(item => item.evidenceClass), ["delivery", "operating-change", "capacity-change"]);
  assert.throws(() => validateInterventionInput({ ...proposal, evidencePlan: proposal.evidencePlan.slice(0, 2) }), DiagnosticInterventionInputError);
});

test("assigned advisor reads readiness and creates a governed proposal", async () => {
  let received;
  const handler = createWorkspaceDiagnosticInterventionHandler({ authenticate: auth(WORKSPACE_ROLES.facilitator), get: async () => ({ state: "blocked", reason: "leadership-validation" }), create: async value => { received = value; return { interventionId: "intervention-1", status: "proposed" }; } });
  assert.equal((await handler(request())).status, 200);
  const response = await handler(request("POST", proposal));
  assert.equal(response.status, 201);
  assert.equal(received.input.serviceRoute, "advisor-guided");
});

test("intervention design blocks participants, malformed input, foreign origins, and unsupported methods", async () => {
  const handler = createWorkspaceDiagnosticInterventionHandler({ authenticate: auth(WORKSPACE_ROLES.participant) });
  assert.equal((await handler(request())).status, 403);
  assert.equal((await handler(new Request(`https://example.com/api/workspace/diagnostic-intervention?diagnosticId=${diagnosticId}`, { headers: { origin: "https://attacker.example" } }))).status, 403);
  assert.equal((await handler(request("DELETE"))).status, 405);
});

