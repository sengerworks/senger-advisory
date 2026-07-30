import { WORKSPACE_ROLES } from "../../workspace-authorization.js";
import { authenticateWorkspaceRequest } from "../lib/clerk-workspace-auth.mjs";
import { validateDiagnosticContextId } from "../lib/workspace-diagnostic-context.mjs";
import { DiagnosticEvidenceReviewAccessError } from "../lib/workspace-diagnostic-evidence-review.mjs";
import { createDiagnosticIntervention, DiagnosticInterventionInputError, DiagnosticInterventionStateError, getDiagnosticIntervention, validateInterventionInput } from "../lib/workspace-diagnostic-intervention.mjs";

const headers = { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8", "X-Content-Type-Options": "nosniff" };
const json = (status, body) => new Response(JSON.stringify(body), { status, headers });

export function createWorkspaceDiagnosticInterventionHandler({ authenticate = authenticateWorkspaceRequest, get = getDiagnosticIntervention, create = createDiagnosticIntervention } = {}) {
  return async request => {
    if (!["GET", "POST"].includes(request.method)) return json(405, { error: "Method not allowed." });
    const url = new URL(request.url);
    const origin = request.headers.get("origin");
    if (origin && origin !== url.origin) return json(403, { error: "Origin not allowed." });
    try {
      const auth = await authenticate(request);
      if (!auth.ok) return json(auth.status, { error: "Workspace access unavailable." });
      if (auth.value.role === WORKSPACE_ROLES.participant) return json(403, { error: "Participants cannot access intervention design." });
      if (request.method === "GET") {
        const diagnosticId = validateDiagnosticContextId(url.searchParams.get("diagnosticId"));
        return json(200, await get({ workspaceId: auth.value.workspaceId, userId: auth.value.userId, diagnosticId }));
      }
      if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new DiagnosticInterventionInputError("Use application/json.");
      const text = await request.text();
      if (text.length > 32768) throw new DiagnosticInterventionInputError("Request too large.");
      let body;
      try { body = JSON.parse(text); } catch { throw new DiagnosticInterventionInputError("Enter a valid intervention proposal."); }
      const validated = validateInterventionInput(body);
      const input = { ...validated, diagnosticId: validateDiagnosticContextId(validated.diagnosticId) };
      return json(201, { intervention: await create({ workspaceId: auth.value.workspaceId, userId: auth.value.userId, input }) });
    } catch (error) {
      if (error instanceof DiagnosticInterventionInputError) return json(400, { error: error.message });
      if (error instanceof DiagnosticInterventionStateError) return json(409, { error: error.message });
      if (error instanceof DiagnosticEvidenceReviewAccessError) return json(403, { error: error.message });
      console.error("Workspace intervention design failed", error instanceof Error ? error.message : "Unknown error");
      return json(503, { error: "Intervention design is temporarily unavailable." });
    }
  };
}

export default createWorkspaceDiagnosticInterventionHandler();
export const config = { path: "/api/workspace/diagnostic-intervention", rateLimit: { windowLimit: 20, windowSize: 60, aggregateBy: ["ip", "domain"] } };

