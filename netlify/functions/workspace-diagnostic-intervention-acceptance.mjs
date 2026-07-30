import { WORKSPACE_ROLES } from "../../workspace-authorization.js";
import { authenticateWorkspaceRequest } from "../lib/clerk-workspace-auth.mjs";
import { validateDiagnosticContextId } from "../lib/workspace-diagnostic-context.mjs";
import { acceptDiagnosticIntervention, getInterventionAcceptance, InterventionAcceptanceInputError, InterventionAcceptanceStateError, validateInterventionAcceptanceInput } from "../lib/workspace-diagnostic-intervention-acceptance.mjs";

const headers = { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8", "X-Content-Type-Options": "nosniff" };
const json = (status, body) => new Response(JSON.stringify(body), { status, headers });

export function createWorkspaceDiagnosticInterventionAcceptanceHandler({ authenticate = authenticateWorkspaceRequest, get = getInterventionAcceptance, accept = acceptDiagnosticIntervention } = {}) {
  return async request => {
    if (!["GET", "POST"].includes(request.method)) return json(405, { error: "Method not allowed." });
    const url = new URL(request.url);
    const origin = request.headers.get("origin");
    if (origin && origin !== url.origin) return json(403, { error: "Origin not allowed." });
    try {
      const auth = await authenticate(request);
      if (!auth.ok) return json(auth.status, { error: "Workspace access unavailable." });
      if (auth.value.role !== WORKSPACE_ROLES.owner) return json(403, { error: "Only the client sponsor can review and accept the intervention." });
      if (request.method === "GET") {
        const diagnosticId = validateDiagnosticContextId(url.searchParams.get("diagnosticId"));
        return json(200, await get({ workspaceId: auth.value.workspaceId, diagnosticId }));
      }
      if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new InterventionAcceptanceInputError("Use application/json.");
      const text = await request.text();
      if (text.length > 2048) throw new InterventionAcceptanceInputError("Request too large.");
      let body;
      try { body = JSON.parse(text); } catch { throw new InterventionAcceptanceInputError("Enter a valid intervention acceptance."); }
      const validated = validateInterventionAcceptanceInput(body);
      const input = { ...validated, diagnosticId: validateDiagnosticContextId(validated.diagnosticId) };
      return json(201, { acceptance: await accept({ workspaceId: auth.value.workspaceId, userId: auth.value.userId, input }) });
    } catch (error) {
      if (error instanceof InterventionAcceptanceInputError) return json(400, { error: error.message });
      if (error instanceof InterventionAcceptanceStateError) return json(409, { error: error.message });
      console.error("Workspace intervention acceptance failed", error instanceof Error ? error.message : "Unknown error");
      return json(503, { error: "Intervention acceptance is temporarily unavailable." });
    }
  };
}

export default createWorkspaceDiagnosticInterventionAcceptanceHandler();
export const config = { path: "/api/workspace/diagnostic-intervention-acceptance", rateLimit: { windowLimit: 20, windowSize: 60, aggregateBy: ["ip", "domain"] } };

