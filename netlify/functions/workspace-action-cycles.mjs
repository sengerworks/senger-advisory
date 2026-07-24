import { authorizeWorkspaceAction } from "../../workspace-authorization.js";
import { authenticateWorkspaceRequest } from "../lib/clerk-workspace-auth.mjs";
import {
  ActionCycleInputError,
  ActionCycleStateError,
  createWorkspaceActionCycle,
  listWorkspaceActionCycles,
  reviewWorkspaceActionCycle,
  validateActionCycleInput,
  validateActionCycleReview
} from "../lib/workspace-action-cycles.mjs";

const headers = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff"
};

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers });
}

async function jsonBody(request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new ActionCycleInputError("Use application/json.");
  }
  const text = await request.text();
  if (text.length > 8192) throw new ActionCycleInputError("Request too large.");
  try {
    return JSON.parse(text);
  } catch {
    throw new ActionCycleInputError("Enter valid action-cycle details.");
  }
}

export function createWorkspaceActionCyclesHandler({
  authenticate = authenticateWorkspaceRequest,
  listCycles = listWorkspaceActionCycles,
  createCycle = createWorkspaceActionCycle,
  reviewCycle = reviewWorkspaceActionCycle,
  now = () => new Date()
} = {}) {
  return async request => {
    if (!["GET", "POST", "PATCH"].includes(request.method)) {
      return json(405, { error: "Method not allowed." });
    }
    const url = new URL(request.url);
    const origin = request.headers.get("origin");
    if (origin && origin !== url.origin) return json(403, { error: "Origin not allowed." });
    try {
      const auth = await authenticate(request);
      if (!auth.ok) return json(auth.status, { error: "Workspace access unavailable." });
      const action = request.method === "GET"
        ? "action-cycle:read"
        : request.method === "POST"
          ? "action-cycle:create"
          : "action-cycle:update";
      if (!authorizeWorkspaceAction({ role: auth.value.role, action })) {
        return json(403, { error: "Only workspace administrators can manage action cycles." });
      }
      if (request.method === "GET") {
        return json(200, {
          actionCycles: await listCycles(
            auth.value.workspaceId,
            url.searchParams.get("roundId")
          )
        });
      }
      if (request.method === "POST") {
        const input = validateActionCycleInput(await jsonBody(request), { now: now() });
        return json(201, {
          actionCycle: await createCycle({
            workspaceId: auth.value.workspaceId,
            actorUserId: auth.value.userId,
            input
          })
        });
      }
      const review = validateActionCycleReview(await jsonBody(request), { now: now() });
      return json(200, {
        actionCycle: await reviewCycle({
          workspaceId: auth.value.workspaceId,
          actorUserId: auth.value.userId,
          review
        })
      });
    } catch (error) {
      if (error instanceof ActionCycleInputError || error instanceof TypeError) {
        return json(400, { error: error.message || "Enter valid action-cycle details." });
      }
      if (error instanceof ActionCycleStateError) return json(409, { error: error.message });
      console.error(
        "Workspace action-cycle operation failed",
        error instanceof Error ? error.message : "Unknown error"
      );
      return json(503, { error: "Action-cycle service is temporarily unavailable." });
    }
  };
}

export default createWorkspaceActionCyclesHandler();

export const config = {
  path: "/api/workspace/action-cycles",
  rateLimit: {
    windowLimit: 60,
    windowSize: 60,
    aggregateBy: ["ip", "domain"]
  }
};
