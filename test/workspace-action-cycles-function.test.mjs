import test from "node:test";
import assert from "node:assert/strict";
import { createWorkspaceActionCyclesHandler } from "../netlify/functions/workspace-action-cycles.mjs";
import {
  ActionCycleInputError,
  validateActionCycleInput,
  validateActionCycleReview
} from "../netlify/lib/workspace-action-cycles.mjs";
import { WORKSPACE_ROLES } from "../workspace-authorization.js";

const workspaceId = "11111111-1111-4111-8111-111111111111";
const roundId = "22222222-2222-4222-8222-222222222222";
const now = new Date("2026-07-24T12:00:00.000Z");

const values = {
  roundId,
  constraintDomainId: "decisions",
  hypothesis: "If ownership is explicit, routine approvals should move faster.",
  commitment: "Publish owners and thresholds for three recurring approvals.",
  responsibleOwner: "Chief Operating Officer",
  evidenceMeasureId: "decisionPace",
  evidenceDescription: "Median elapsed time for the three approval types.",
  reviewDate: "2026-08-24",
  status: "active"
};

function request(method = "GET", body, roleOrigin = "https://example.com") {
  const suffix = method === "GET" ? `?roundId=${roundId}` : "";
  return new Request(`https://example.com/api/workspace/action-cycles${suffix}`, {
    method,
    headers: {
      origin: roleOrigin,
      ...(body === undefined ? {} : { "content-type": "application/json" })
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}

function authentication(role = WORKSPACE_ROLES.owner) {
  return async () => ({
    ok: true,
    value: { role, workspaceId, userId: "user_owner", organizationId: "org_alpha" }
  });
}

test("validates a bounded shared action cycle with an accountable owner", () => {
  const input = validateActionCycleInput(values, {
    now,
    id: "33333333-3333-4333-8333-333333333333"
  });
  assert.equal(input.responsibleOwner, "Chief Operating Officer");
  assert.equal(input.cycle.constraintDomainId, "decisions");
  assert.equal(input.cycle.status, "active");
  assert.throws(
    () => validateActionCycleInput({ ...values, responsibleOwner: "" }, { now }),
    ActionCycleInputError
  );
});

test("validates a causal-cautious action-cycle review", () => {
  const review = validateActionCycleReview({
    roundId,
    actionCycleId: "33333333-3333-4333-8333-333333333333",
    status: "completed",
    reviewNote: "Approval time fell during the cycle; continue observing."
  }, { now });
  assert.equal(review.status, "completed");
  assert.equal(review.closedAt, now.toISOString());
  assert.match(review.reviewNote, /continue observing/);
});

test("lists and creates action cycles only within the authenticated workspace", async () => {
  const calls = [];
  const handler = createWorkspaceActionCyclesHandler({
    authenticate: authentication(),
    listCycles: async (authorizedWorkspaceId, authorizedRoundId) => {
      calls.push(["list", authorizedWorkspaceId, authorizedRoundId]);
      return [];
    },
    createCycle: async value => {
      calls.push(["create", value.workspaceId, value.input.roundId]);
      return { ...value.input.cycle, responsibleOwner: value.input.responsibleOwner };
    },
    now: () => now
  });
  const listed = await handler(request());
  assert.equal(listed.status, 200);
  assert.deepEqual(await listed.json(), { actionCycles: [] });
  const created = await handler(request("POST", values));
  assert.equal(created.status, 201);
  assert.equal((await created.json()).actionCycle.responsibleOwner, "Chief Operating Officer");
  assert.deepEqual(calls, [
    ["list", workspaceId, roundId],
    ["create", workspaceId, roundId]
  ]);
});

test("blocks participants, foreign origins, malformed inputs, and unsupported methods", async () => {
  const participant = createWorkspaceActionCyclesHandler({
    authenticate: authentication(WORKSPACE_ROLES.participant)
  });
  assert.equal((await participant(request())).status, 403);
  assert.equal((await participant(request("GET", undefined, "https://attacker.example"))).status, 403);
  assert.equal((await participant(request("DELETE"))).status, 405);

  const owner = createWorkspaceActionCyclesHandler({
    authenticate: authentication(),
    createCycle: async () => {
      throw new Error("must not create");
    },
    now: () => now
  });
  assert.equal((await owner(request("POST", { ...values, hypothesis: "" }))).status, 400);
});

test("updates only the selected action cycle in the authenticated workspace", async () => {
  let reviewed;
  const handler = createWorkspaceActionCyclesHandler({
    authenticate: authentication(),
    reviewCycle: async value => {
      reviewed = value;
      return { ...value.review, responsibleOwner: "Chief Operating Officer" };
    },
    now: () => now
  });
  const response = await handler(request("PATCH", {
    roundId,
    actionCycleId: "33333333-3333-4333-8333-333333333333",
    status: "completed",
    reviewNote: "Decision time improved during the cycle."
  }));
  assert.equal(response.status, 200);
  assert.equal(reviewed.workspaceId, workspaceId);
  assert.equal(reviewed.review.status, "completed");
});
