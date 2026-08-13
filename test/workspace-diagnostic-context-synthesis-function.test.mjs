import test from "node:test";
import assert from "node:assert/strict";
import { createWorkspaceDiagnosticContextSynthesisHandler } from "../netlify/functions/workspace-diagnostic-context-synthesis.mjs";
import { WORKSPACE_ROLES } from "../workspace-authorization.js";

const body = {
  diagnosticId: "22222222-2222-4222-8222-222222222222", organizationSizeBand: "50-149", organizationHeadcount: 120,
  sponsorPerspective: "founder-ceo", sponsorRoleTitle: "CEO", sponsorOrganizationalLevel: "enterprise", sponsorFunction: "enterprise-leadership",
  sponsorResponsibility: "Enterprise strategy, operating performance, and leadership decisions.", diagnosticScopeType: "cross-functional-system",
  industry: "technology-software", businessModel: "b2b", operatingEnvironment: "distributed-remote", organizationOffering: "Enterprise workflow software for mid-market operators.",
  diagnosticScopeName: "Growth execution", diagnosticScopeHeadcount: 45, diagnosticScopeBoundary: "Commercial and delivery execution.",
  crossBoundaryDependencies: "Sales, delivery, and client escalation.", guidanceSessionScheduledFor: "2026-08-12T16:00:00.000Z", guidanceSessionAcknowledged: true,
  organizationContext: "A growing organization is adding operating complexity.", strategicPriority: "Scale delivery without weakening client trust.",
  triggeringConcern: "Work slows when decisions cross functional boundaries.", decisionsAtRisk: "Hiring, ownership, and client commitments.",
  recentChanges: ["Added functional leaders"], priorInterventions: ["Clarified meeting cadence"],
  knownSensitivities: "Avoid individual performance conclusions.", decisionNeeded: "Which operating boundary should leadership address first?", approvalNote: ""
};
const request = (value = body, origin = "https://example.com") => new Request("https://example.com/api/workspace/diagnostic-context-synthesis", { method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify(value) });
const authenticate = role => async () => ({ ok: true, value: { role, workspaceId: "11111111-1111-4111-8111-111111111111", userId: "user" } });

test("only the sponsor receives a bounded working synthesis", async () => {
  const handler = createWorkspaceDiagnosticContextSynthesisHandler({ authenticate: authenticate(WORKSPACE_ROLES.owner), synthesize: async value => ({ executiveFrame: value.strategicPriority }) });
  const response = await handler(request());
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.synthesis.executiveFrame, body.strategicPriority);
  assert.match(payload.boundary, /not a diagnostic finding/);
});

test("context synthesis blocks participants, foreign origins, and malformed context", async () => {
  const participant = createWorkspaceDiagnosticContextSynthesisHandler({ authenticate: authenticate(WORKSPACE_ROLES.participant), synthesize: async () => ({}) });
  assert.equal((await participant(request())).status, 403);
  const owner = createWorkspaceDiagnosticContextSynthesisHandler({ authenticate: authenticate(WORKSPACE_ROLES.owner), synthesize: async () => ({}) });
  assert.equal((await owner(request(body, "https://attacker.example"))).status, 403);
  assert.equal((await owner(request({ diagnosticId: body.diagnosticId }))).status, 400);
});
