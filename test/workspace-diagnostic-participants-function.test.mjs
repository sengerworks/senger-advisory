import test from "node:test";
import assert from "node:assert/strict";
import { createWorkspaceDiagnosticParticipantsHandler } from "../netlify/functions/workspace-diagnostic-participants.mjs";
import {
  DiagnosticParticipantInputError,
  DiagnosticParticipantStateError,
  validateDiagnosticParticipantPlan,
  workspaceDiagnosticParticipantPolicy
} from "../netlify/lib/workspace-diagnostic-participants.mjs";
import { WORKSPACE_ROLES } from "../workspace-authorization.js";

const workspaceId = "11111111-1111-4111-8111-111111111111";
const diagnosticId = "22222222-2222-4222-8222-222222222222";
const input = {
  diagnosticId,
  targetLeadershipLevels: ["enterprise", "functional", "operational"],
  targetExecutionProximities: ["strategy", "coordination", "delivery"],
  targetFunctionalLenses: ["executive-leadership", "operations", "commercial"],
  participantSlots: [
    { slotId: "slot-1", leadershipLevel: "enterprise", executionProximity: "strategy", functionalLens: "executive-leadership" },
    { slotId: "slot-2", leadershipLevel: "functional", executionProximity: "coordination", functionalLens: "operations" },
    { slotId: "slot-3", leadershipLevel: "operational", executionProximity: "delivery", functionalLens: "commercial" }
  ],
  acceptedGaps: [],
  approvalNote: "The intended perspectives cover the operating system."
};

function request(method = "GET", body, query = `?diagnosticId=${diagnosticId}`, origin = "https://example.com") {
  return new Request(`https://example.com/api/workspace/diagnostic-participants${query}`, {
    method,
    headers: { origin, ...(body === undefined ? {} : { "content-type": "application/json" }) },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}
function authentication(role = WORKSPACE_ROLES.owner) {
  return async () => ({ ok: true, value: { role, workspaceId, userId: "user_owner" } });
}

test("approves identity-free participant coverage and rejects unresolved gaps", () => {
  const validated = validateDiagnosticParticipantPlan(input);
  assert.equal(validated.participantSlots.length, 3);
  assert.equal(validated.participantSlots.some(slot => "email" in slot || "name" in slot), false);
  assert.equal(workspaceDiagnosticParticipantPolicy.fixedParticipantMinimum, null);
  assert.equal(workspaceDiagnosticParticipantPolicy.participantIdentityStoredInPlan, false);
  assert.throws(() => validateDiagnosticParticipantPlan({
    ...input,
    participantSlots: [input.participantSlots[0]]
  }), DiagnosticParticipantInputError);
});

test("documented gap acceptance allows a deliberately bounded plan", () => {
  const oneSlot = input.participantSlots[0];
  const acceptedGaps = [
    "leadershipLevels:functional", "leadershipLevels:operational",
    "executionProximities:coordination", "executionProximities:delivery",
    "functionalLenses:operations", "functionalLenses:commercial"
  ].map(gapId => ({ gapId, reason: "Sponsor accepted this documented limitation for the POC." }));
  assert.equal(validateDiagnosticParticipantPlan({ ...input, participantSlots: [oneSlot], acceptedGaps }).acceptedGaps.length, 6);
});

test("administrators retrieve and approve one participant plan", async () => {
  let approved;
  const plan = { id: "plan-1", diagnosticId, participantSlots: input.participantSlots };
  const handler = createWorkspaceDiagnosticParticipantsHandler({
    authenticate: authentication(),
    getPlan: async (actualWorkspaceId, actualDiagnosticId) => {
      assert.equal(actualWorkspaceId, workspaceId);
      assert.equal(actualDiagnosticId, diagnosticId);
      return plan;
    },
    approvePlan: async value => { approved = value; return plan; }
  });
  assert.equal((await handler(request())).status, 200);
  assert.equal((await handler(request("POST", input, ""))).status, 201);
  assert.equal(approved.workspaceId, workspaceId);
  assert.equal(approved.input.participantSlots.length, 3);
});

test("participant access, foreign origins, invalid IDs, and state conflicts fail closed", async () => {
  const participant = createWorkspaceDiagnosticParticipantsHandler({ authenticate: authentication(WORKSPACE_ROLES.participant) });
  assert.equal((await participant(request())).status, 403);
  const owner = createWorkspaceDiagnosticParticipantsHandler({ authenticate: authentication() });
  assert.equal((await owner(request("GET", undefined, "?diagnosticId=bad"))).status, 400);
  assert.equal((await owner(request("GET", undefined, `?diagnosticId=${diagnosticId}`, "https://attacker.example"))).status, 403);
  const conflict = createWorkspaceDiagnosticParticipantsHandler({
    authenticate: authentication(),
    approvePlan: async () => { throw new DiagnosticParticipantStateError("Context required."); }
  });
  assert.equal((await conflict(request("POST", input, ""))).status, 409);
});
