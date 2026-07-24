import test from "node:test";
import assert from "node:assert/strict";
import { createWorkspaceResultsHandler } from "../netlify/functions/workspace-results.mjs";
import { WORKSPACE_ROLES } from "../workspace-authorization.js";

const workspaceId = "11111111-1111-4111-8111-111111111111";
const roundId = "22222222-2222-4222-8222-222222222222";

function request(method = "GET", roleOrigin = "https://example.com") {
  return new Request(`https://example.com/api/workspace/results?roundId=${roundId}`, {
    method,
    headers: { origin: roleOrigin }
  });
}

function authentication(role) {
  return async () => ({
    ok: true,
    value: { role, workspaceId, userId: "user_test", organizationId: "org_alpha" }
  });
}

test("returns threshold progress without scores below five submissions", async () => {
  const handler = createWorkspaceResultsHandler({
    authenticate: authentication(WORKSPACE_ROLES.owner),
    getResults: async (authorizedWorkspaceId, authorizedRoundId) => {
      assert.equal(authorizedWorkspaceId, workspaceId);
      assert.equal(authorizedRoundId, roundId);
      return {
        round: { id: roundId, label: "Test Baseline", status: "open" },
        result: {
          policy: "suppressed",
          participantCount: 1,
          minimumRequired: 5,
          remaining: 4,
          reason: "Organizational results remain hidden until the privacy threshold is met."
        }
      };
    }
  });
  const response = await handler(request());
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.result.policy, "suppressed");
  assert.equal(body.result.participantCount, 1);
  assert.equal("domainScores" in body.result, false);
  assert.equal("overallIndex" in body.result, false);
});

test("returns only the aggregate profile after the repository establishes the threshold", async () => {
  const aggregate = {
    policy: "aggregate",
    participantCount: 5,
    minimumRequired: 5,
    assessmentVersion: "1.0.0",
    scoringVersion: "0.1.0",
    domainScores: {
      leadership: { mean: 55, perspectivePattern: "varied" }
    },
    overallIndex: 58,
    primaryConstraintIds: ["leadership"]
  };
  const handler = createWorkspaceResultsHandler({
    authenticate: authentication(WORKSPACE_ROLES.facilitator),
    getResults: async () => ({
      round: { id: roundId, label: "Test Baseline", status: "open" },
      result: aggregate
    })
  });
  const response = await handler(request());
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).result, aggregate);
});

test("blocks participants, foreign origins, invalid methods, and missing rounds", async () => {
  const participant = createWorkspaceResultsHandler({
    authenticate: authentication(WORKSPACE_ROLES.participant),
    getResults: async () => {
      throw new Error("must not read");
    }
  });
  assert.equal((await participant(request())).status, 403);
  assert.equal((await participant(request("GET", "https://attacker.example"))).status, 403);
  assert.equal((await participant(request("POST"))).status, 405);

  const owner = createWorkspaceResultsHandler({
    authenticate: authentication(WORKSPACE_ROLES.owner),
    getResults: async () => null
  });
  assert.equal((await owner(request())).status, 404);
});
