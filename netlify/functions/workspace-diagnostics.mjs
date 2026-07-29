import { authorizeWorkspaceAction } from "../../workspace-authorization.js";
import { authenticateWorkspaceRequest } from "../lib/clerk-workspace-auth.mjs";
import {
  createWorkspaceDiagnostic,
  DiagnosticInputError,
  listWorkspaceDiagnostics,
  validateDiagnosticDraft,
  workspaceDiagnosticPolicy
} from "../lib/workspace-diagnostics.mjs";

const headers = { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8", "X-Content-Type-Options": "nosniff" };
function json(status, body) { return new Response(JSON.stringify(body), { status, headers }); }
function sameOrigin(request) { const origin = request.headers.get("origin"); return !origin || origin === new URL(request.url).origin; }
async function jsonBody(request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new DiagnosticInputError("Use application/json.");
  const text = await request.text();
  if (text.length > 1024) throw new DiagnosticInputError("Request too large.");
  try { return JSON.parse(text); } catch { throw new DiagnosticInputError("Enter valid diagnostic details."); }
}

export function createWorkspaceDiagnosticsHandler({
  authenticate = authenticateWorkspaceRequest,
  listDiagnostics = listWorkspaceDiagnostics,
  createDiagnostic = createWorkspaceDiagnostic
} = {}) {
  return async request => {
    if (!["GET", "POST"].includes(request.method)) return json(405, { error: "Method not allowed." });
    if (!sameOrigin(request)) return json(403, { error: "Origin not allowed." });
    try {
      const result = await authenticate(request);
      if (!result.ok) return json(result.status, { error: "Workspace access unavailable." });
      const { role, workspaceId, userId } = result.value;
      if (request.method === "GET") {
        if (!authorizeWorkspaceAction({ role, action: "diagnostic:read" })) return json(403, { error: "Only workspace administrators can view diagnostics." });
        return json(200, { diagnostics: await listDiagnostics(workspaceId), policy: workspaceDiagnosticPolicy });
      }
      if (!authorizeWorkspaceAction({ role, action: "diagnostic:create" })) return json(403, { error: "Only workspace administrators can start a diagnostic." });
      const draft = validateDiagnosticDraft(await jsonBody(request));
      return json(201, { diagnostic: await createDiagnostic({ workspaceId, actorUserId: userId, draft }) });
    } catch (error) {
      if (error instanceof DiagnosticInputError) return json(400, { error: error.message });
      console.error("Workspace diagnostic operation failed", error instanceof Error ? error.message : "Unknown error");
      return json(503, { error: "Diagnostic setup is temporarily unavailable." });
    }
  };
}

export default createWorkspaceDiagnosticsHandler();
export const config = { path: "/api/workspace/diagnostics", rateLimit: { windowLimit: 30, windowSize: 60, aggregateBy: ["ip", "domain"] } };
