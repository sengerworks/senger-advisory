import test from "node:test";
import assert from "node:assert/strict";
import { createWorkspaceDiagnosticAdvisorAssignmentsHandler } from "../netlify/functions/workspace-diagnostic-advisor-assignments.mjs";
import { validateDevelopmentAdvisorAssignment } from "../netlify/lib/workspace-diagnostic-advisor-assignments.mjs";
import { WORKSPACE_ROLES } from "../workspace-authorization.js";

const diagnosticId = "22222222-2222-4222-8222-222222222222";
const input = { diagnosticId, purpose: "POC evidence review and synthesis validation for Senger Advisory." };
const auth = role => async () => ({ ok: true, value: { workspaceId: "11111111-1111-4111-8111-111111111111", userId: "user_advisor", role: role || WORKSPACE_ROLES.owner } });
const request = (method = "GET", body, origin = "https://example.com") => new Request("https://example.com/api/workspace/diagnostic-advisor-assignments", { method, headers: { origin, ...(body ? { "content-type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });

test("validates the development assignment purpose", () => {
  assert.deepEqual(validateDevelopmentAdvisorAssignment(input), input);
  assert.throws(() => validateDevelopmentAdvisorAssignment({ ...input, purpose: "short" }), /20 to 500/);
});

test("lists assignments and creates only the explicit POC bridge", async () => {
  let created;
  const handler = createWorkspaceDiagnosticAdvisorAssignmentsHandler({ authenticate: auth(), listAssignments: async () => [{ diagnosticId }], createAssignment: async value => { created = value; return { diagnosticId }; } });
  assert.equal((await request()).method, "GET");
  assert.equal((await handler(request())).status, 200);
  assert.equal((await handler(request("POST", input))).status, 201);
  assert.equal(created.userId, "user_advisor");
  const facilitator = createWorkspaceDiagnosticAdvisorAssignmentsHandler({ authenticate: auth(WORKSPACE_ROLES.facilitator) });
  assert.equal((await facilitator(request("POST", input))).status, 403);
  const participant = createWorkspaceDiagnosticAdvisorAssignmentsHandler({ authenticate: auth(WORKSPACE_ROLES.participant) });
  assert.equal((await participant(request())).status, 403);
});
