import { WORKSPACE_ROLES } from "../../workspace-authorization.js";
import { authenticateWorkspaceRequest } from "../lib/clerk-workspace-auth.mjs";
import {
  acceptWorkspaceNotice,
  getWorkspaceParticipation,
  ParticipationInputError,
  ParticipationStateError
} from "../lib/workspace-participation.mjs";

const headers = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff"
};

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers });
}

export function createWorkspaceParticipationHandler({
  authenticate = authenticateWorkspaceRequest,
  getParticipation = getWorkspaceParticipation,
  acceptNotice = acceptWorkspaceNotice
} = {}) {
  return async request => {
    if (!["GET", "POST"].includes(request.method)) {
      return json(405, { error: "Method not allowed." });
    }
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return json(403, { error: "Origin not allowed." });
    }
    try {
      const auth = await authenticate(request);
      if (!auth.ok) return json(auth.status, { error: "Workspace access unavailable." });
      if (auth.value.role !== WORKSPACE_ROLES.participant) {
        return json(403, { error: "Participant access is required." });
      }
      const identity = {
        workspaceId: auth.value.workspaceId,
        userId: auth.value.userId
      };
      if (request.method === "GET") {
        return json(200, await getParticipation(identity));
      }
      if (!request.headers.get("content-type")?.startsWith("application/json")) {
        return json(415, { error: "Use application/json." });
      }
      const text = await request.text();
      if (text.length > 1024) return json(413, { error: "Request too large." });
      let value;
      try {
        value = JSON.parse(text);
      } catch {
        return json(400, { error: "Enter valid participation details." });
      }
      if (
        !value
        || typeof value !== "object"
        || Object.keys(value).sort().join(",") !== "noticeVersion,roundId"
      ) {
        throw new ParticipationInputError("Accept the current workspace privacy notice.");
      }
      return json(200, await acceptNotice({
        ...identity,
        roundId: value.roundId,
        noticeVersion: value.noticeVersion
      }));
    } catch (error) {
      if (error instanceof ParticipationInputError || error instanceof TypeError) {
        return json(400, { error: error.message });
      }
      if (error instanceof ParticipationStateError) return json(409, { error: error.message });
      console.error(
        "Workspace participation operation failed",
        error instanceof Error ? error.message : "Unknown error"
      );
      return json(503, { error: "Participation is temporarily unavailable." });
    }
  };
}

export default createWorkspaceParticipationHandler();

export const config = {
  path: "/api/workspace/participation",
  rateLimit: {
    windowLimit: 120,
    windowSize: 60,
    aggregateBy: ["ip", "domain"]
  }
};
