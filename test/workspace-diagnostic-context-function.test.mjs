import test from "node:test";
import assert from "node:assert/strict";
import { createWorkspaceDiagnosticContextHandler } from "../netlify/functions/workspace-diagnostic-context.mjs";
import {
  DiagnosticContextInputError,
  DiagnosticContextStateError,
  validateDiagnosticContextId,
  validateDiagnosticContextInput,
  workspaceDiagnosticDiscoveryPolicy
} from "../netlify/lib/workspace-diagnostic-context.mjs";
import { WORKSPACE_ROLES } from "../workspace-authorization.js";

const workspaceId = "11111111-1111-4111-8111-111111111111";
const diagnosticId = "22222222-2222-4222-8222-222222222222";
const input = {
  diagnosticId,
  organizationSizeBand: "50-149",
  organizationHeadcount: 120,
  sponsorPerspective: "founder-ceo",
  sponsorRoleTitle: "Founder and CEO",
  sponsorOrganizationalLevel: "enterprise",
  sponsorFunction: "enterprise-leadership",
  sponsorResponsibility: "Enterprise strategy, operating performance, and leadership decisions.",
  industry: "professional-services",
  businessModel: "b2b",
  operatingEnvironment: "multi-location",
  organizationOffering: "Advisory and implementation services for growing businesses.",
  diagnosticScopeType: "cross-functional-system",
  diagnosticScopeName: "Market-entry execution system",
  diagnosticScopeHeadcount: 45,
  diagnosticScopeBoundary: "The commercial, operating, and delivery work required to enter the second market.",
  crossBoundaryDependencies: "Founder decisions, sales commitments, delivery staffing, and client escalation.",
  guidanceSessionScheduledFor: "2026-08-12T16:00:00.000Z",
  guidanceSessionAcknowledged: true,
  organizationContext: "A growing services firm is adding a second operating layer.",
  strategicPriority: "Scale delivery without making every decision dependent on the founders.",
  triggeringConcern: "Client work slows when decisions cross functional boundaries.",
  decisionsAtRisk: "Hiring, delivery ownership, and client escalation decisions.",
  recentChanges: ["Added two functional leaders"],
  priorInterventions: ["Clarified the executive meeting cadence"],
  knownSensitivities: "The diagnostic must not become a performance evaluation.",
  decisionNeeded: "What operating constraint should leadership address first?",
  approvalNote: "Approved as a starting context, not a finding."
};

function request(method = "GET", body, query = `?diagnosticId=${diagnosticId}`, origin = "https://example.com") {
  return new Request(`https://example.com/api/workspace/diagnostic-context${query}`, {
    method,
    headers: { origin, ...(body === undefined ? {} : { "content-type": "application/json" }) },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}
function authentication(role = WORKSPACE_ROLES.owner) {
  return async () => ({ ok: true, value: { role, workspaceId, userId: "user_owner" } });
}

test("validates a bounded explicitly approved diagnostic context", () => {
  const validated = validateDiagnosticContextInput(input);
  assert.equal(validated.diagnosticId, diagnosticId);
  assert.deepEqual(validated.recentChanges, ["Added two functional leaders"]);
  assert.equal(validated.industry, "professional-services");
  assert.equal(workspaceDiagnosticDiscoveryPolicy.discoveryVersion, "1.2.0");
  assert.equal(workspaceDiagnosticDiscoveryPolicy.industries.includes("technology-software"), true);
  assert.equal(workspaceDiagnosticDiscoveryPolicy.diagnosticScopeTypes.includes("function"), true);
  assert.equal(validateDiagnosticContextId(diagnosticId), diagnosticId);
  assert.throws(() => validateDiagnosticContextId("not-a-diagnostic"), DiagnosticContextInputError);
  assert.throws(() => validateDiagnosticContextInput({ ...input, finding: "The answer" }), DiagnosticContextInputError);
  assert.throws(() => validateDiagnosticContextInput({ ...input, organizationContext: "" }), DiagnosticContextInputError);
});

test("administrators retrieve and approve context within the authenticated workspace", async () => {
  let approved;
  const context = { id: "context-1", diagnosticId, triggeringConcern: input.triggeringConcern };
  const handler = createWorkspaceDiagnosticContextHandler({
    authenticate: authentication(),
    getContext: async (actualWorkspaceId, actualDiagnosticId) => {
      assert.equal(actualWorkspaceId, workspaceId);
      assert.equal(actualDiagnosticId, diagnosticId);
      return context;
    },
    approveContext: async value => { approved = value; return context; }
  });
  const listed = await handler(request());
  assert.equal(listed.status, 200);
  assert.deepEqual((await listed.json()).context, context);
  const response = await handler(request("POST", input, ""));
  assert.equal(response.status, 201);
  assert.equal(approved.workspaceId, workspaceId);
  assert.equal(approved.actorUserId, "user_owner");
  assert.equal(approved.input.decisionNeeded, input.decisionNeeded);
});

test("participants, foreign origins, invalid input, and state conflicts fail closed", async () => {
  const participant = createWorkspaceDiagnosticContextHandler({ authenticate: authentication(WORKSPACE_ROLES.participant) });
  assert.equal((await participant(request())).status, 403);
  assert.equal((await participant(request("POST", input, ""))).status, 403);
  const owner = createWorkspaceDiagnosticContextHandler({ authenticate: authentication() });
  assert.equal((await owner(request("GET", undefined, "", "https://attacker.example"))).status, 403);
  assert.equal((await owner(request("GET", undefined, ""))).status, 400);
  assert.equal((await owner(request("DELETE", undefined, ""))).status, 405);
  const conflict = createWorkspaceDiagnosticContextHandler({
    authenticate: authentication(),
    approveContext: async () => { throw new DiagnosticContextStateError("Access is pending."); }
  });
  assert.equal((await conflict(request("POST", input, ""))).status, 409);
});
