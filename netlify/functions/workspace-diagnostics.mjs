import { authorizeWorkspaceAction } from "../../workspace-authorization.js";
import { authenticateWorkspaceRequest } from "../lib/clerk-workspace-auth.mjs";
import { listWorkspaceDiagnostics, workspaceDiagnosticPolicy } from "../lib/workspace-diagnostics.mjs";

const headers = { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8", "X-Content-Type-Options": "nosniff" };
function json(status, body) { return new Response(JSON.stringify(body), { status, headers }); }
function sameOrigin(request) { const origin = request.headers.get("origin"); return !origin || origin === new URL(request.url).origin; }
export function createWorkspaceDiagnosticsHandler({
  authenticate = authenticateWorkspaceRequest,
  listDiagnostics = listWorkspaceDiagnostics
} = {}) {
  return async request => {
    if (request.method !== "GET") return json(405, { error: "Method not allowed." });
    if (!sameOrigin(request)) return json(403, { error: "Origin not allowed." });
    try {
      const result = await authenticate(request);
      if (!result.ok) return json(result.status, { error: "Workspace access unavailable." });
      const { role, workspaceId } = result.value;
      if (!authorizeWorkspaceAction({ role, action: "diagnostic:read" })) return json(403, { error: "Only workspace administrators can view diagnostics." });
      return json(200, { diagnostics: await listDiagnostics(workspaceId), policy: workspaceDiagnosticPolicy });
    } catch (error) {
      console.error("Workspace diagnostic operation failed", error instanceof Error ? error.message : "Unknown error");
      return json(503, { error: "Diagnostic setup is temporarily unavailable." });
    }
  };
}

export default createWorkspaceDiagnosticsHandler();
export const config = { path: "/api/workspace/diagnostics", rateLimit: { windowLimit: 30, windowSize: 60, aggregateBy: ["ip", "domain"] } };
