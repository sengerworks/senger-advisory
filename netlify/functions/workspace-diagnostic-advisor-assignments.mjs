import { WORKSPACE_ROLES } from "../../workspace-authorization.js";
import { authenticateWorkspaceRequest } from "../lib/clerk-workspace-auth.mjs";
import {
  createDevelopmentAdvisorAssignment,
  DiagnosticAdvisorAssignmentInputError,
  DiagnosticAdvisorAssignmentStateError,
  listActiveDiagnosticAdvisorAssignments,
  validateDevelopmentAdvisorAssignment
} from "../lib/workspace-diagnostic-advisor-assignments.mjs";

const headers = { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8", "X-Content-Type-Options": "nosniff" };
function json(status, body) { return new Response(JSON.stringify(body), { status, headers }); }

export function createWorkspaceDiagnosticAdvisorAssignmentsHandler({
  authenticate = authenticateWorkspaceRequest,
  listAssignments = listActiveDiagnosticAdvisorAssignments,
  createAssignment = createDevelopmentAdvisorAssignment
} = {}) {
  return async request => {
    if (!["GET", "POST"].includes(request.method)) return json(405, { error: "Method not allowed." });
    const url = new URL(request.url);
    const origin = request.headers.get("origin");
    if (origin && origin !== url.origin) return json(403, { error: "Origin not allowed." });
    try {
      const auth = await authenticate(request);
      if (!auth.ok) return json(auth.status, { error: "Workspace access unavailable." });
      if (auth.value.role === WORKSPACE_ROLES.participant) return json(403, { error: "Participants cannot access advisor assignments." });
      if (request.method === "GET") return json(200, { assignments: await listAssignments({ workspaceId: auth.value.workspaceId, userId: auth.value.userId }) });
      if (auth.value.role !== WORKSPACE_ROLES.owner) return json(403, { error: "Only the POC workspace administrator can create the development assignment bridge." });
      if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new DiagnosticAdvisorAssignmentInputError("Use application/json.");
      const text = await request.text();
      if (text.length > 2048) throw new DiagnosticAdvisorAssignmentInputError("Request too large.");
      let body;
      try { body = JSON.parse(text); } catch { throw new DiagnosticAdvisorAssignmentInputError("Enter a valid advisor assignment."); }
      const input = validateDevelopmentAdvisorAssignment(body);
      return json(201, { assignment: await createAssignment({ workspaceId: auth.value.workspaceId, userId: auth.value.userId, input }) });
    } catch (error) {
      if (error instanceof DiagnosticAdvisorAssignmentInputError) return json(400, { error: error.message });
      if (error instanceof DiagnosticAdvisorAssignmentStateError) return json(409, { error: error.message });
      console.error("Workspace diagnostic advisor assignment failed", error instanceof Error ? error.message : "Unknown error");
      return json(503, { error: "Advisor assignments are temporarily unavailable." });
    }
  };
}

export default createWorkspaceDiagnosticAdvisorAssignmentsHandler();
export const config = { path: "/api/workspace/diagnostic-advisor-assignments", rateLimit: { windowLimit: 20, windowSize: 60, aggregateBy: ["ip", "domain"] } };
