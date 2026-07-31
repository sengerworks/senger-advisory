import { authenticateWorkspaceRequest } from "../lib/clerk-workspace-auth.mjs";
import {
  listActiveDiagnosticAdvisorAssignments
} from "../lib/workspace-diagnostic-advisor-assignments.mjs";

const headers = { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8", "X-Content-Type-Options": "nosniff" };
function json(status, body) { return new Response(JSON.stringify(body), { status, headers }); }

export function createWorkspaceDiagnosticAdvisorAssignmentsHandler({
  authenticate = authenticateWorkspaceRequest,
  listAssignments = listActiveDiagnosticAdvisorAssignments,
} = {}) {
  return async request => {
    if (request.method !== "GET") return json(405, { error: "Advisor assignments are managed in Platform Operations." });
    const url = new URL(request.url);
    const origin = request.headers.get("origin");
    if (origin && origin !== url.origin) return json(403, { error: "Origin not allowed." });
    try {
      const auth = await authenticate(request);
      if (!auth.ok) return json(auth.status, { error: "Workspace access unavailable." });
      return json(200, { assignments: await listAssignments({ workspaceId: auth.value.workspaceId, userId: auth.value.userId }) });
    } catch (error) {
      console.error("Workspace diagnostic advisor assignment failed", error instanceof Error ? error.message : "Unknown error");
      return json(503, { error: "Advisor assignments are temporarily unavailable." });
    }
  };
}

export default createWorkspaceDiagnosticAdvisorAssignmentsHandler();
export const config = { path: "/api/workspace/diagnostic-advisor-assignments", rateLimit: { windowLimit: 20, windowSize: 60, aggregateBy: ["ip", "domain"] } };
