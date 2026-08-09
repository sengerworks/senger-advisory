import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createWorkspaceDiagnosticInvitationsHandler } from "../netlify/functions/workspace-diagnostic-invitations.mjs";
import {
  DiagnosticInvitationInputError,
  DiagnosticInvitationStateError,
  diagnosticCollectionStatus,
  diagnosticInvitationProviderError,
  summarizeDiagnosticCollection,
  validateDiagnosticInvitationInput
} from "../netlify/lib/workspace-diagnostic-invitations.mjs";
import { WORKSPACE_ROLES } from "../workspace-authorization.js";

const workspaceId = "11111111-1111-4111-8111-111111111111";
const diagnosticId = "22222222-2222-4222-8222-222222222222";
const planSlot = { slotId: "slot-1", leadershipLevel: "enterprise", executionProximity: "strategy", functionalLens: "executive-leadership" };
const input = { diagnosticId, planSlotId: "slot-1", emailAddress: "Participant@Example.com" };
function request(method = "GET", body, query = `?diagnosticId=${diagnosticId}`, origin = "https://example.com") {
  return new Request(`https://example.com/api/workspace/diagnostic-invitations${query}`, { method, headers: { origin, ...(body ? { "content-type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
}
function authentication(role = WORKSPACE_ROLES.owner) { return async () => ({ ok: true, value: { role, workspaceId, userId: "user_owner", organizationId: "org_alpha" } }); }

test("collection progress recognizes the activated Protocol v2 interview", async () => {
  const source = await readFile(new URL("../netlify/lib/workspace-diagnostic-invitations.mjs", import.meta.url), "utf8");
  assert.match(source, /diagnostic_interviews_v2/);
  assert.match(source, /COALESCE\(interview_v2\.status, interview\.status\) AS interview_status/);
});

test("accepts one normalized email for one approved perspective slot", () => {
  assert.deepEqual(validateDiagnosticInvitationInput(input), { diagnosticId, planSlotId: "slot-1", emailAddress: "participant@example.com" });
  assert.throws(() => validateDiagnosticInvitationInput({ ...input, participantName: "A Person" }), DiagnosticInvitationInputError);
  assert.throws(() => validateDiagnosticInvitationInput({ ...input, emailAddress: "invalid" }), DiagnosticInvitationInputError);
});

test("translates provider failures without exposing provider payloads", () => {
  assert.match(diagnosticInvitationProviderError({ message: "membership already exists" }).message, /already belongs/);
  assert.match(diagnosticInvitationProviderError({ errors: [{ code: "duplicate_invitation" }] }).message, /pending diagnostic invitation/);
  assert.match(diagnosticInvitationProviderError({ errors: [{ code: "invalid_role" }] }).message, /org:participant/);
  assert.equal(diagnosticInvitationProviderError({ message: "Bad Request" }), null);
});

test("derives collection progress without exposing interview content", () => {
  assert.equal(diagnosticCollectionStatus({}), "not-invited");
  assert.equal(diagnosticCollectionStatus({ invitation: { status: "pending" } }), "invited");
  assert.equal(diagnosticCollectionStatus({ invitation: { status: "accepted" } }), "joined");
  assert.equal(diagnosticCollectionStatus({ noticeAccepted: true }), "started");
  assert.equal(diagnosticCollectionStatus({ interviewStatus: "in-progress" }), "in-progress");
  assert.equal(diagnosticCollectionStatus({ interviewStatus: "submitted" }), "submitted");
  assert.deepEqual(summarizeDiagnosticCollection([
    { collectionStatus: "not-invited" }, { collectionStatus: "invited" },
    { collectionStatus: "in-progress" }, { collectionStatus: "submitted" }
  ]), { total: 4, invited: 3, joined: 2, inProgress: 1, submitted: 1, remaining: 1 });
});

test("administrators list plan slots and create a diagnostic-specific invitation", async () => {
  let created; let recorded;
  const invitation = { id: "orginv_123", planSlotId: "slot-1", emailAddress: "participant@example.com", status: "pending", createdAt: "2026-07-29T00:00:00.000Z", expiresAt: "2026-08-28T00:00:00.000Z" };
  const handler = createWorkspaceDiagnosticInvitationsHandler({
    authenticate: authentication(),
    getReadiness: async () => ({ diagnosticId, diagnosticState: "protocol-review", canInvite: true, planSlots: [planSlot] }),
    listSlots: async () => [],
    gateway: { list: async () => [], create: async value => { created = value; return invitation; } },
    recordInvitation: async value => { recorded = value; }
  });
  const listed = await handler(request());
  assert.equal(listed.status, 200);
  const listedBody = await listed.json();
  assert.equal(listedBody.planSlots[0].invitation, null);
  assert.equal("collectionStatus" in listedBody.planSlots[0], false);
  const response = await handler(request("POST", input, ""));
  assert.equal(response.status, 201);
  assert.equal(created.organizationId, "org_alpha");
  assert.equal(created.planSlotId, "slot-1");
  assert.equal(recorded.planSlot.functionalLens, "executive-leadership");
});

test("sponsor receives aggregate progress without identity-linked interview status", async () => {
  const accepted = { id: "orginv_accepted", emailAddress: "participant@example.com", status: "accepted" };
  const handler = createWorkspaceDiagnosticInvitationsHandler({
    authenticate: authentication(),
    getReadiness: async () => ({ diagnosticId, diagnosticState: "collection", canInvite: true, planSlots: [planSlot] }),
    listSlots: async () => [{ planSlotId: "slot-1", invitationId: accepted.id, noticeAccepted: true, interviewStatus: "submitted" }],
    gateway: { list: async () => [accepted] }
  });
  const body = await (await handler(request())).json();
  assert.equal(body.progress.submitted, 1);
  assert.equal(body.planSlots[0].invitation.emailAddress, "participant@example.com");
  assert.equal("collectionStatus" in body.planSlots[0], false);
});

test("participants, foreign origins, unknown slots, and duplicate invitations fail closed", async () => {
  const participant = createWorkspaceDiagnosticInvitationsHandler({ authenticate: authentication(WORKSPACE_ROLES.participant) });
  assert.equal((await participant(request())).status, 403);
  const foreign = createWorkspaceDiagnosticInvitationsHandler({ authenticate: authentication() });
  assert.equal((await foreign(request("GET", undefined, `?diagnosticId=${diagnosticId}`, "https://attacker.example"))).status, 403);
  const unknown = createWorkspaceDiagnosticInvitationsHandler({
    authenticate: authentication(), getReadiness: async () => ({ diagnosticId, canInvite: true, planSlots: [] }), listSlots: async () => [], gateway: { list: async () => [] }
  });
  assert.equal((await unknown(request("POST", input, ""))).status, 400);
  const duplicate = createWorkspaceDiagnosticInvitationsHandler({
    authenticate: authentication(), getReadiness: async () => ({ diagnosticId, canInvite: true, planSlots: [planSlot] }), listSlots: async () => [{ planSlotId: "slot-1" }], gateway: { list: async () => [] }
  });
  assert.equal((await duplicate(request("POST", input, ""))).status, 409);
  assert.equal(new DiagnosticInvitationStateError("duplicate") instanceof Error, true);
});
