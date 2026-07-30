import { WORKSPACE_ROLES } from "../../workspace-authorization.js";
import { authenticateWorkspaceRequest } from "../lib/clerk-workspace-auth.mjs";
import { validateDiagnosticContextId } from "../lib/workspace-diagnostic-context.mjs";
import { getLeadershipValidationView, LeadershipValidationInputError, LeadershipValidationStateError, recordLeadershipValidation, validateLeadershipValidationInput } from "../lib/workspace-diagnostic-leadership-validation.mjs";

const headers = { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8", "X-Content-Type-Options": "nosniff" };
const json = (status, body) => new Response(JSON.stringify(body), { status, headers });

export function createWorkspaceDiagnosticLeadershipValidationHandler({
  authenticate = authenticateWorkspaceRequest,
  getView = getLeadershipValidationView,
  record = recordLeadershipValidation
} = {}) {
  return async request => {
    if (!["GET", "POST"].includes(request.method)) return json(405, { error: "Method not allowed." });
    const url = new URL(request.url);
    const origin = request.headers.get("origin");
    if (origin && origin !== url.origin) return json(403, { error: "Origin not allowed." });
    try {
      const auth = await authenticate(request);
      if (!auth.ok) return json(auth.status, { error: "Workspace access unavailable." });
      if (auth.value.role !== WORKSPACE_ROLES.owner) return json(403, { error: "Only the client sponsor can access leadership validation." });
      if (request.method === "GET") {
        const diagnosticId = validateDiagnosticContextId(url.searchParams.get("diagnosticId"));
        return json(200, await getView({ workspaceId: auth.value.workspaceId, diagnosticId }));
      }
      if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new LeadershipValidationInputError("Use application/json.");
      const text = await request.text();
      if (text.length > 8192) throw new LeadershipValidationInputError("Request too large.");
      let body;
      try { body = JSON.parse(text); } catch { throw new LeadershipValidationInputError("Enter a valid leadership validation response."); }
      const validated = validateLeadershipValidationInput(body);
      const input = { ...validated, diagnosticId: validateDiagnosticContextId(validated.diagnosticId) };
      return json(201, { validation: await record({ workspaceId: auth.value.workspaceId, userId: auth.value.userId, input }) });
    } catch (error) {
      if (error instanceof LeadershipValidationInputError) return json(400, { error: error.message });
      if (error instanceof LeadershipValidationStateError) return json(409, { error: error.message });
      console.error("Workspace leadership validation failed", error instanceof Error ? error.message : "Unknown error");
      return json(503, { error: "Leadership validation is temporarily unavailable." });
    }
  };
}

export default createWorkspaceDiagnosticLeadershipValidationHandler();
export const config = { path: "/api/workspace/diagnostic-leadership-validation", rateLimit: { windowLimit: 30, windowSize: 60, aggregateBy: ["ip", "domain"] } };
