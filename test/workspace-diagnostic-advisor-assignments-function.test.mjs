import test from "node:test";
import assert from "node:assert/strict";
import { createWorkspaceDiagnosticAdvisorAssignmentsHandler } from "../netlify/functions/workspace-diagnostic-advisor-assignments.mjs";

const auth = async () => ({ ok: true, value: { workspaceId: "11111111-1111-4111-8111-111111111111", userId: "user_advisor", role: "org:admin" } });
const request = method => new Request("https://example.com/api/workspace/diagnostic-advisor-assignments", { method, headers: { origin: "https://example.com" } });

test("advisor accounts can list only their own active assignments", async () => {
  let received;
  const handler = createWorkspaceDiagnosticAdvisorAssignmentsHandler({ authenticate: auth, listAssignments: async value => (received = value, [{ diagnosticId: "diagnostic" }]) });
  assert.equal((await handler(request("GET"))).status, 200);
  assert.equal(received.userId, "user_advisor");
});

test("client and advisor surfaces cannot create their own assignment", async () => {
  const handler = createWorkspaceDiagnosticAdvisorAssignmentsHandler({ authenticate: auth });
  const response = await handler(request("POST"));
  assert.equal(response.status, 405);
  assert.match((await response.json()).error, /Platform Operations/);
});
