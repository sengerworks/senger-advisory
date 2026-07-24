import { WORKSPACE_ROLES } from "../../workspace-authorization.js";
import { authenticateWorkspaceRequest } from "../lib/clerk-workspace-auth.mjs";
import {
  ParticipationInputError,
  ParticipationStateError,
  submitWorkspaceAssessment,
  validateWorkspaceSubmissionEnvelope
} from "../lib/workspace-participation.mjs";

const headers = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff"
};

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers });
}

export function createWorkspaceSubmissionHandler({
  authenticate = authenticateWorkspaceRequest,
  submitAssessment = submitWorkspaceAssessment
} = {}) {
  return async request => {
    if (request.method !== "POST") return json(405, { error: "Method not allowed." });
    const origin = request.headers.get("origin");
    if (!origin || origin !== new URL(request.url).origin) {
      return json(403, { error: "Origin not allowed." });
    }
    if (!request.headers.get("content-type")?.startsWith("application/json")) {
      return json(415, { error: "Use application/json." });
    }
    try {
      const auth = await authenticate(request);
      if (!auth.ok) return json(auth.status, { error: "Workspace access unavailable." });
      if (auth.value.role !== WORKSPACE_ROLES.participant) {
        return json(403, { error: "Participant access is required." });
      }
      const text = await request.text();
      if (text.length > 8192) return json(413, { error: "Request too large." });
      let value;
      try {
        value = JSON.parse(text);
      } catch {
        return json(400, { error: "Enter a valid completed assessment." });
      }
      const input = validateWorkspaceSubmissionEnvelope(value);
      return json(201, await submitAssessment({
        workspaceId: auth.value.workspaceId,
        userId: auth.value.userId,
        roundId: input.roundId,
        submission: input.submission
      }));
    } catch (error) {
      if (error instanceof ParticipationInputError || error instanceof TypeError) {
        return json(400, { error: error.message });
      }
      if (error instanceof ParticipationStateError) return json(409, { error: error.message });
      console.error(
        "Workspace submission failed",
        error instanceof Error ? error.message : "Unknown error"
      );
      return json(503, { error: "Your workspace submission could not be saved." });
    }
  };
}

export default createWorkspaceSubmissionHandler();

export const config = {
  path: "/api/workspace/submission",
  rateLimit: {
    windowLimit: 30,
    windowSize: 60,
    aggregateBy: ["ip", "domain"]
  }
};
