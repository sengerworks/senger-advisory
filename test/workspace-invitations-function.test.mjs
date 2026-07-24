import test from "node:test";
import assert from "node:assert/strict";
import { createWorkspaceInvitationsHandler } from "../netlify/functions/workspace-invitations.mjs";
import {
  createClerkInvitationGateway,
  InvitationInputError,
  validateInvitationInput,
  validateInvitationReference
} from "../netlify/lib/workspace-invitations.mjs";
import { WORKSPACE_ROLES } from "../workspace-authorization.js";

const workspaceId = "11111111-1111-4111-8111-111111111111";
const roundId = "22222222-2222-4222-8222-222222222222";
const organizationId = "org_alpha";
const invitationId = "orginv_alpha1";

const openRound = {
  id: roundId,
  label: "Test Baseline",
  status: "open",
  closesAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
};

function request(method = "GET", body, suffix = `?roundId=${roundId}`, origin = "https://example.com") {
  return new Request(`https://example.com/api/workspace/invitations${suffix}`, {
    method,
    headers: {
      origin,
      ...(body === undefined ? {} : { "content-type": "application/json" })
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}

function authentication(role = WORKSPACE_ROLES.owner) {
  return async () => ({
    ok: true,
    value: {
      role,
      workspaceId,
      userId: "user_owner",
      organizationId
    }
  });
}

function invitation(status = "pending") {
  return {
    id: invitationId,
    emailAddress: "participant@example.com",
    status,
    role: "org:participant",
    createdAt: Date.parse("2026-08-01T00:00:00.000Z"),
    expiresAt: Date.parse("2026-08-15T00:00:00.000Z"),
    privateMetadata: { collectionRoundId: roundId }
  };
}

test("accepts one normalized participant email and rejects extra or malformed fields", () => {
  assert.deepEqual(
    validateInvitationInput({ roundId, emailAddress: " Participant@Example.com " }),
    { roundId, emailAddress: "participant@example.com" }
  );
  assert.deepEqual(validateInvitationReference({ roundId, invitationId }), {
    roundId,
    invitationId
  });
  assert.throws(
    () => validateInvitationInput({ roundId, emailAddress: "invalid", role: "org:admin" }),
    InvitationInputError
  );
});

test("Clerk gateway fixes the participant role, redirect, expiry, and private round mapping", async () => {
  let createParams;
  const gateway = createClerkInvitationGateway({
    organizations: {
      createOrganizationInvitation: async params => {
        createParams = params;
        return invitation();
      }
    }
  });
  const created = await gateway.create({
    organizationId,
    inviterUserId: "user_owner",
    round: openRound,
    emailAddress: "participant@example.com",
    redirectOrigin: "https://preview.example.com"
  });
  assert.equal(created.emailAddress, "participant@example.com");
  assert.equal(createParams.role, "org:participant");
  assert.equal(createParams.redirectUrl, "https://preview.example.com/workspace/");
  assert.deepEqual(createParams.privateMetadata, { collectionRoundId: roundId });
  assert.ok(createParams.expiresInDays >= 1 && createParams.expiresInDays <= 30);
});

test("lists invitation counts, sends one invitation, and records a content-free event", async () => {
  const events = [];
  const gateway = {
    list: async () => [invitation("accepted"), invitation("pending")],
    create: async () => invitation("pending")
  };
  const handler = createWorkspaceInvitationsHandler({
    authenticate: authentication(),
    gateway,
    getRound: async () => openRound,
    recordEvent: async value => events.push(value)
  });

  const listed = await handler(request());
  assert.equal(listed.status, 200);
  const listBody = await listed.json();
  assert.deepEqual(listBody.counts, { invited: 2, accepted: 1, pending: 1 });

  const created = await handler(request("POST", {
    roundId,
    emailAddress: "participant@example.com"
  }, ""));
  assert.equal(created.status, 201);
  assert.equal(events[0].action, "invitation.created");
  assert.equal("emailAddress" in events[0], false);
});

test("blocks participant administration, closed rounds, foreign origins, and unknown methods", async () => {
  const participant = createWorkspaceInvitationsHandler({
    authenticate: authentication(WORKSPACE_ROLES.participant),
    gateway: {},
    getRound: async () => openRound
  });
  assert.equal((await participant(request())).status, 403);
  assert.equal((await participant(request("GET", undefined, `?roundId=${roundId}`, "https://attacker.example"))).status, 403);
  assert.equal((await participant(request("PATCH"))).status, 405);

  const owner = createWorkspaceInvitationsHandler({
    authenticate: authentication(),
    gateway: { create: async () => { throw new Error("must not send"); } },
    getRound: async () => ({ ...openRound, status: "draft" })
  });
  assert.equal((await owner(request("POST", {
    roundId,
    emailAddress: "participant@example.com"
  }, ""))).status, 409);
});
