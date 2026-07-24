import test from "node:test";
import assert from "node:assert/strict";
import { createWorkspaceRoundsHandler } from "../netlify/functions/workspace-rounds.mjs";
import {
  RoundInputError,
  validateRoundDraft,
  workspaceRoundPolicy
} from "../netlify/lib/workspace-rounds.mjs";
import { WORKSPACE_ROLES } from "../workspace-authorization.js";

const workspaceId = "11111111-1111-4111-8111-111111111111";
const now = Date.parse("2026-08-01T00:00:00.000Z");

function request(method = "GET", body, origin = "https://example.com") {
  return new Request("https://example.com/api/workspace/rounds", {
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
      userId: "user_owner"
    }
  });
}

test("validates a bounded collection-round draft and fixes the privacy floor at five", () => {
  const draft = validateRoundDraft({
    label: "  Leadership   Capacity Baseline ",
    opensAt: "2026-08-02T06:00:00.000Z",
    closesAt: "2026-08-16T05:59:59.999Z"
  }, now);
  assert.deepEqual(draft, {
    label: "Leadership Capacity Baseline",
    opensAt: "2026-08-02T06:00:00.000Z",
    closesAt: "2026-08-16T05:59:59.999Z"
  });
  assert.equal(workspaceRoundPolicy.minimumParticipants, 5);
});

test("rejects unknown fields, past openings, reversed dates, and excessive durations", () => {
  const valid = {
    label: "Capacity Baseline",
    opensAt: "2026-08-02T00:00:00.000Z",
    closesAt: "2026-08-16T00:00:00.000Z"
  };
  for (const value of [
    { ...valid, minimumParticipants: 1 },
    { ...valid, opensAt: "2026-07-01T00:00:00.000Z" },
    { ...valid, closesAt: "2026-08-01T00:00:00.000Z" },
    { ...valid, closesAt: "2027-08-16T00:00:00.000Z" }
  ]) {
    assert.throws(() => validateRoundDraft(value, now), RoundInputError);
  }
});

test("lists only minimized rounds and creates a draft for an administrator", async () => {
  const round = {
    id: "22222222-2222-4222-8222-222222222222",
    label: "Capacity Baseline",
    status: "draft",
    minimumParticipants: 5,
    opensAt: "2026-08-02T00:00:00.000Z",
    closesAt: "2026-08-16T00:00:00.000Z",
    createdAt: "2026-08-01T00:00:00.000Z"
  };
  let createInput;
  const handler = createWorkspaceRoundsHandler({
    authenticate: authentication(),
    listRounds: async id => {
      assert.equal(id, workspaceId);
      return [round];
    },
    createRound: async value => {
      createInput = value;
      return round;
    },
    now: () => now
  });

  const listed = await handler(request());
  assert.equal(listed.status, 200);
  assert.deepEqual(await listed.json(), {
    rounds: [round],
    policy: { minimumParticipants: 5 }
  });

  const created = await handler(request("POST", {
    label: "Capacity Baseline",
    opensAt: "2026-08-02T00:00:00.000Z",
    closesAt: "2026-08-16T00:00:00.000Z"
  }));
  assert.equal(created.status, 201);
  assert.equal(createInput.workspaceId, workspaceId);
  assert.equal(createInput.actorUserId, "user_owner");
  assert.equal(createInput.draft.label, "Capacity Baseline");
});

test("updates, opens, closes, and deletes only through explicit administrative actions", async () => {
  const round = {
    id: "22222222-2222-4222-8222-222222222222",
    label: "Capacity Baseline",
    status: "draft",
    minimumParticipants: 5,
    opensAt: "2026-08-02T00:00:00.000Z",
    closesAt: "2026-08-16T00:00:00.000Z",
    createdAt: "2026-08-01T00:00:00.000Z"
  };
  const calls = [];
  const handler = createWorkspaceRoundsHandler({
    authenticate: authentication(),
    updateRound: async value => {
      calls.push(["update", value]);
      return round;
    },
    openRound: async value => {
      calls.push(["open", value]);
      return { ...round, status: "open" };
    },
    closeRound: async value => {
      calls.push(["close", value]);
      return { ...round, status: "closed" };
    },
    deleteRound: async value => {
      calls.push(["delete", value]);
      return { id: value.roundId };
    },
    now: () => now
  });

  assert.equal((await handler(request("PATCH", {
    action: "update",
    roundId: round.id,
    label: round.label,
    opensAt: round.opensAt,
    closesAt: round.closesAt
  }))).status, 200);
  assert.equal((await handler(request("PATCH", {
    action: "open",
    roundId: round.id
  }))).status, 200);
  assert.equal((await handler(request("PATCH", {
    action: "close",
    roundId: round.id
  }))).status, 200);
  assert.equal((await handler(request("DELETE", {
    roundId: round.id
  }))).status, 200);
  assert.deepEqual(calls.map(([action]) => action), ["update", "open", "close", "delete"]);
});

test("creates a version-linked follow-up from one closed collection", async () => {
  let followUpInput;
  const handler = createWorkspaceRoundsHandler({
    authenticate: authentication(),
    createFollowUp: async value => {
      followUpInput = value;
      return {
        id: "44444444-4444-4444-8444-444444444444",
        priorRoundId: value.priorRoundId,
        label: value.draft.label,
        status: "draft"
      };
    },
    now: () => now
  });
  const response = await handler(request("POST", {
    priorRoundId: "22222222-2222-4222-8222-222222222222",
    label: "Capacity Follow-up",
    opensAt: "2026-08-02T00:00:00.000Z",
    closesAt: "2026-08-16T00:00:00.000Z"
  }));
  assert.equal(response.status, 201);
  assert.equal(followUpInput.workspaceId, workspaceId);
  assert.equal(followUpInput.draft.label, "Capacity Follow-up");
});

test("prevents participants, foreign origins, malformed bodies, and unsupported methods", async () => {
  const participant = createWorkspaceRoundsHandler({
    authenticate: authentication(WORKSPACE_ROLES.participant),
    createRound: async () => {
      throw new Error("must not create");
    },
    now: () => now
  });
  const body = {
    label: "Capacity Baseline",
    opensAt: "2026-08-02T00:00:00.000Z",
    closesAt: "2026-08-16T00:00:00.000Z"
  };
  assert.equal((await participant(request("POST", body))).status, 403);
  assert.equal((await participant(request("GET", undefined, "https://attacker.example"))).status, 403);
  assert.equal((await participant(request("PUT"))).status, 405);

  const owner = createWorkspaceRoundsHandler({
    authenticate: authentication(),
    now: () => now
  });
  const malformed = new Request("https://example.com/api/workspace/rounds", {
    method: "POST",
    headers: { origin: "https://example.com", "content-type": "application/json" },
    body: "{"
  });
  assert.equal((await owner(malformed)).status, 400);
});
