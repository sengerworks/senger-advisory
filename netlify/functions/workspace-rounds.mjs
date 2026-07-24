import { authorizeWorkspaceAction } from "../../workspace-authorization.js";
import { authenticateWorkspaceRequest } from "../lib/clerk-workspace-auth.mjs";
import {
  createWorkspaceRound,
  deleteWorkspaceRound,
  listWorkspaceRounds,
  openWorkspaceRound,
  RoundInputError,
  RoundStateError,
  updateWorkspaceRound,
  validateRoundDraft,
  workspaceRoundPolicy
} from "../lib/workspace-rounds.mjs";

const headers = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff"
};

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers });
}

function sameOrigin(request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

async function jsonBody(request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new RoundInputError("Use application/json.");
  }
  const text = await request.text();
  if (text.length > 4096) throw new RoundInputError("Request too large.");
  try {
    return JSON.parse(text);
  } catch {
    throw new RoundInputError("Enter valid collection-round details.");
  }
}

export function createWorkspaceRoundsHandler({
  authenticate = authenticateWorkspaceRequest,
  listRounds = listWorkspaceRounds,
  createRound = createWorkspaceRound,
  updateRound = updateWorkspaceRound,
  openRound = openWorkspaceRound,
  deleteRound = deleteWorkspaceRound,
  now = () => Date.now()
} = {}) {
  return async request => {
    if (!["GET", "POST", "PATCH", "DELETE"].includes(request.method)) {
      return json(405, { error: "Method not allowed." });
    }
    if (!sameOrigin(request)) return json(403, { error: "Origin not allowed." });

    try {
      const result = await authenticate(request);
      if (!result.ok) return json(result.status, { error: "Workspace access unavailable." });
      const { role, workspaceId, userId } = result.value;

      if (request.method === "GET") {
        if (!authorizeWorkspaceAction({ role, action: "round:read" })) {
          return json(403, { error: "Workspace access unavailable." });
        }
        return json(200, {
          rounds: await listRounds(workspaceId),
          policy: { minimumParticipants: workspaceRoundPolicy.minimumParticipants }
        });
      }

      if (request.method === "POST") {
        if (!authorizeWorkspaceAction({ role, action: "round:create" })) {
          return json(403, { error: "Only workspace administrators can create a round." });
        }
        const draft = validateRoundDraft(await jsonBody(request), now());
        const round = await createRound({ workspaceId, actorUserId: userId, draft });
        return json(201, { round });
      }

      const value = await jsonBody(request);
      if (request.method === "DELETE") {
        if (!authorizeWorkspaceAction({ role, action: "round:delete" })) {
          return json(403, { error: "Only workspace administrators can delete a draft." });
        }
        if (
          !value
          || typeof value !== "object"
          || Object.keys(value).join(",") !== "roundId"
        ) {
          throw new RoundInputError("Choose one draft collection round to delete.");
        }
        return json(200, {
          deleted: await deleteRound({
            workspaceId,
            actorUserId: userId,
            roundId: value.roundId
          })
        });
      }

      if (!value || typeof value !== "object" || typeof value.action !== "string") {
        throw new RoundInputError("Choose a valid collection-round action.");
      }
      if (value.action === "open") {
        if (!authorizeWorkspaceAction({ role, action: "round:open" })) {
          return json(403, { error: "Only workspace administrators can open a round." });
        }
        if (Object.keys(value).sort().join(",") !== "action,roundId") {
          throw new RoundInputError("Choose one draft collection round to open.");
        }
        return json(200, {
          round: await openRound({
            workspaceId,
            actorUserId: userId,
            roundId: value.roundId
          })
        });
      }
      if (value.action === "update") {
        if (!authorizeWorkspaceAction({ role, action: "round:update" })) {
          return json(403, { error: "Only workspace administrators can change a draft." });
        }
        const expected = "action,closesAt,label,opensAt,roundId";
        if (Object.keys(value).sort().join(",") !== expected) {
          throw new RoundInputError("Enter the complete draft details.");
        }
        const draft = validateRoundDraft({
          label: value.label,
          opensAt: value.opensAt,
          closesAt: value.closesAt
        }, now());
        return json(200, {
          round: await updateRound({
            workspaceId,
            actorUserId: userId,
            roundId: value.roundId,
            draft
          })
        });
      }
      throw new RoundInputError("Choose a valid collection-round action.");
    } catch (error) {
      if (error instanceof RoundInputError) return json(400, { error: error.message });
      if (error instanceof RoundStateError) return json(409, { error: error.message });
      if (error instanceof TypeError) return json(400, { error: "Choose a valid collection round." });
      console.error(
        "Workspace round operation failed",
        error instanceof Error ? error.message : "Unknown error"
      );
      return json(503, { error: "Collection setup is temporarily unavailable." });
    }
  };
}

export default createWorkspaceRoundsHandler();

export const config = {
  path: "/api/workspace/rounds",
  rateLimit: {
    windowLimit: 60,
    windowSize: 60,
    aggregateBy: ["ip", "domain"]
  }
};
