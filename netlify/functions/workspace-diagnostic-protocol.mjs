import { authorizeWorkspaceAction } from "../../workspace-authorization.js";
import { authenticateWorkspaceRequest } from "../lib/clerk-workspace-auth.mjs";
import { DiagnosticContextInputError, validateDiagnosticContextId } from "../lib/workspace-diagnostic-context.mjs";
import {
  approveWorkspaceDiagnosticProtocol,
  DiagnosticProtocolInputError,
  DiagnosticProtocolStateError,
  getWorkspaceDiagnosticProtocol,
  workspaceDiagnosticProtocolPolicy
} from "../lib/workspace-diagnostic-protocol.mjs";

const headers = { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8", "X-Content-Type-Options": "nosniff" };
function json(status, body) { return new Response(JSON.stringify(body), { status, headers }); }
async function jsonBody(request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new DiagnosticProtocolInputError("Use application/json.");
  const text = await request.text();
  if (text.length > 32768) throw new DiagnosticProtocolInputError("Request too large.");
  try { return JSON.parse(text); } catch { throw new DiagnosticProtocolInputError("Enter valid protocol details."); }
}

export function createWorkspaceDiagnosticProtocolHandler({
  authenticate = authenticateWorkspaceRequest,
  getProtocol = getWorkspaceDiagnosticProtocol,
  approveProtocol = approveWorkspaceDiagnosticProtocol
} = {}) {
  return async request => {
    if (!["GET", "POST"].includes(request.method)) return json(405, { error: "Method not allowed." });
    const url = new URL(request.url);
    const origin = request.headers.get("origin");
    if (origin && origin !== url.origin) return json(403, { error: "Origin not allowed." });
    try {
      const auth = await authenticate(request);
      if (!auth.ok) return json(auth.status, { error: "Workspace access unavailable." });
      const action = request.method === "GET" ? "diagnostic:read" : "diagnostic:update";
      if (!authorizeWorkspaceAction({ role: auth.value.role, action })) {
        return json(403, { error: "Only workspace administrators can review the diagnostic protocol." });
      }
      if (request.method === "GET") {
        const diagnosticId = validateDiagnosticContextId(url.searchParams.get("diagnosticId"));
        const result = await getProtocol(auth.value.workspaceId, diagnosticId);
        return json(200, { ...result, policy: workspaceDiagnosticProtocolPolicy });
      }
      const input = await jsonBody(request);
      return json(201, {
        protocol: await approveProtocol({
          workspaceId: auth.value.workspaceId,
          actorUserId: auth.value.userId,
          input
        })
      });
    } catch (error) {
      if (error instanceof DiagnosticProtocolInputError || error instanceof DiagnosticContextInputError) return json(400, { error: error.message });
      if (error instanceof DiagnosticProtocolStateError) return json(409, { error: error.message });
      console.error("Workspace diagnostic protocol operation failed", error instanceof Error ? error.message : "Unknown error");
      return json(503, { error: "Protocol review is temporarily unavailable." });
    }
  };
}

export default createWorkspaceDiagnosticProtocolHandler();
export const config = { path: "/api/workspace/diagnostic-protocol", rateLimit: { windowLimit: 30, windowSize: 60, aggregateBy: ["ip", "domain"] } };
