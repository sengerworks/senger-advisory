import test from "node:test";
import assert from "node:assert/strict";
import { createWorkspaceComparisonHandler } from "../netlify/functions/workspace-comparison.mjs";
import { WORKSPACE_ROLES } from "../workspace-authorization.js";

const workspaceId = "11111111-1111-4111-8111-111111111111";
const roundId = "22222222-2222-4222-8222-222222222222";

const authentication = role => async () => ({
  ok: true,
  value: { role, workspaceId, userId: "user_owner", organizationId: "org_alpha" }
});

const request = (method = "GET", origin = "https://example.com") =>
  new Request(`https://example.com/api/workspace/comparison?roundId=${roundId}`, {
    method,
    headers: { origin }
  });

test("returns only a linked organizational comparison to administrators", async () => {
  const expected = {
    baselineRound: { id: "33333333-3333-4333-8333-333333333333", label: "Baseline" },
    followUpRound: { id: roundId, label: "Follow-up" },
    comparison: { policy: "numeric-delta", overallDelta: 4 }
  };
  const handler = createWorkspaceComparisonHandler({
    authenticate: authentication(WORKSPACE_ROLES.owner),
    getComparison: async (authorizedWorkspaceId, authorizedRoundId) => {
      assert.equal(authorizedWorkspaceId, workspaceId);
      assert.equal(authorizedRoundId, roundId);
      return expected;
    }
  });
  const response = await handler(request());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), expected);
});

test("blocks participants, cross-origin requests, unsupported methods, and unlinked rounds", async () => {
  const participant = createWorkspaceComparisonHandler({
    authenticate: authentication(WORKSPACE_ROLES.participant)
  });
  assert.equal((await participant(request())).status, 403);
  assert.equal((await participant(request("GET", "https://attacker.example"))).status, 403);
  assert.equal((await participant(request("POST"))).status, 405);
  const owner = createWorkspaceComparisonHandler({
    authenticate: authentication(WORKSPACE_ROLES.owner),
    getComparison: async () => null
  });
  assert.equal((await owner(request())).status, 404);
});
