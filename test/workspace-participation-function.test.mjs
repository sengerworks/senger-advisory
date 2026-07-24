import test from "node:test";
import assert from "node:assert/strict";
import { createWorkspaceParticipationHandler } from "../netlify/functions/workspace-participation.mjs";
import { createWorkspaceSubmissionHandler } from "../netlify/functions/workspace-submission.mjs";
import {
  validateWorkspaceSubmissionEnvelope,
  WORKSPACE_NOTICE_VERSION
} from "../netlify/lib/workspace-participation.mjs";
import { WORKSPACE_ROLES } from "../workspace-authorization.js";

const workspaceId = "11111111-1111-4111-8111-111111111111";
const roundId = "22222222-2222-4222-8222-222222222222";

function authentication(role = WORKSPACE_ROLES.participant) {
  return async () => ({
    ok: true,
    value: {
      role,
      workspaceId,
      userId: "user_participant",
      organizationId: "org_alpha"
    }
  });
}

function request(path, method = "GET", body, origin = "https://example.com") {
  return new Request(`https://example.com${path}`, {
    method,
    headers: {
      origin,
      ...(body === undefined ? {} : { "content-type": "application/json" })
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}

function submission() {
  return {
    submissionId: "33333333-3333-4333-8333-333333333333",
    completedAt: "2026-08-04T12:00:00.000Z",
    assessmentVersion: "1.0.0",
    scoringVersion: "0.1.0",
    domainScores: {
      leadership: 50,
      decisions: 50,
      rhythm: 50,
      alignment: 50,
      technology: 50,
      culture: 50
    },
    overallIndex: 50,
    interpretationBand: "Strained",
    primaryConstraintIds: [
      "leadership",
      "decisions",
      "rhythm",
      "alignment",
      "technology",
      "culture"
    ]
  };
}

test("returns minimized participant readiness and records explicit notice acceptance", async () => {
  let accepted;
  const handler = createWorkspaceParticipationHandler({
    authenticate: authentication(),
    getParticipation: async identity => {
      assert.equal(identity.workspaceId, workspaceId);
      return {
        state: "ready",
        round: { id: roundId, label: "Test Baseline" },
        noticeVersion: WORKSPACE_NOTICE_VERSION,
        noticeAccepted: false,
        submitted: false
      };
    },
    acceptNotice: async value => {
      accepted = value;
      return { accepted: true, submitted: false };
    }
  });
  const response = await handler(request("/api/workspace/participation"));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).noticeAccepted, false);

  const acceptance = await handler(request(
    "/api/workspace/participation",
    "POST",
    { roundId, noticeVersion: WORKSPACE_NOTICE_VERSION }
  ));
  assert.equal(acceptance.status, 200);
  assert.equal(accepted.userId, "user_participant");
  assert.equal(accepted.noticeVersion, WORKSPACE_NOTICE_VERSION);
});

test("accepts only the minimized aggregate submission contract", () => {
  const valid = validateWorkspaceSubmissionEnvelope({ roundId, submission: submission() });
  assert.equal(valid.roundId, roundId);
  for (const invalid of [
    { roundId, submission: { ...submission(), answers: [1, 2, 3] } },
    { roundId, submission: { ...submission(), overallIndex: 101 } },
    { roundId, submission: submission(), emailAddress: "participant@example.com" }
  ]) {
    assert.throws(() => validateWorkspaceSubmissionEnvelope(invalid));
  }
});

test("submits one server-authenticated participant perspective without identity in the payload", async () => {
  let submitted;
  const handler = createWorkspaceSubmissionHandler({
    authenticate: authentication(),
    submitAssessment: async value => {
      submitted = value;
      return { submitted: true };
    }
  });
  const response = await handler(request(
    "/api/workspace/submission",
    "POST",
    { roundId, submission: submission() }
  ));
  assert.equal(response.status, 201);
  assert.equal(submitted.userId, "user_participant");
  assert.equal(submitted.submission.overallIndex, 50);
  assert.equal("emailAddress" in submitted.submission, false);
});

test("rejects non-participants, foreign origins, malformed notices, and unsupported methods", async () => {
  const ownerParticipation = createWorkspaceParticipationHandler({
    authenticate: authentication(WORKSPACE_ROLES.owner)
  });
  assert.equal((await ownerParticipation(request("/api/workspace/participation"))).status, 403);
  assert.equal((await ownerParticipation(request(
    "/api/workspace/participation",
    "GET",
    undefined,
    "https://attacker.example"
  ))).status, 403);
  assert.equal((await ownerParticipation(request("/api/workspace/participation", "DELETE"))).status, 405);

  const ownerSubmission = createWorkspaceSubmissionHandler({
    authenticate: authentication(WORKSPACE_ROLES.owner)
  });
  assert.equal((await ownerSubmission(request(
    "/api/workspace/submission",
    "POST",
    { roundId, submission: submission() }
  ))).status, 403);
});
