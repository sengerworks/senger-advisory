import { WORKSPACE_ROLES } from "../../workspace-authorization.js";
import { authenticateWorkspaceRequest } from "../lib/clerk-workspace-auth.mjs";
import { validateDiagnosticContextId } from "../lib/workspace-diagnostic-context.mjs";
import { DiagnosticEvidenceReviewAccessError } from "../lib/workspace-diagnostic-evidence-review.mjs";
import { approveDiagnosticFrameV2, DiagnosticFrameV2InputError, DiagnosticFrameV2StateError, getDiagnosticFrameV2, validateDiagnosticFrameV2Input } from "../lib/workspace-diagnostic-frame-v2.mjs";

const headers = { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8", "X-Content-Type-Options": "nosniff" };
const json = (status, body) => new Response(JSON.stringify(body), { status, headers });
async function jsonBody(request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new DiagnosticFrameV2InputError("Use application/json.");
  const body = await request.text();
  if (body.length > 65536) throw new DiagnosticFrameV2InputError("Request too large.");
  try { return JSON.parse(body); } catch { throw new DiagnosticFrameV2InputError("Enter a valid Diagnostic Frame."); }
}

export function createWorkspaceDiagnosticFrameV2Handler({ authenticate = authenticateWorkspaceRequest, getFrame = getDiagnosticFrameV2, approveFrame = approveDiagnosticFrameV2 } = {}) {
  return async request => {
    if (!["GET", "POST"].includes(request.method)) return json(405, { error: "Method not allowed." });
    const url = new URL(request.url), origin = request.headers.get("origin");
    if (origin && origin !== url.origin) return json(403, { error: "Origin not allowed." });
    try {
      const auth = await authenticate(request);
      if (!auth.ok) return json(auth.status, { error: "Workspace access unavailable." });
      if (auth.value.role === WORKSPACE_ROLES.participant) return json(403, { error: "Participants cannot access Diagnostic Frame development." });
      if (request.method === "GET") {
        const diagnosticId = validateDiagnosticContextId(url.searchParams.get("diagnosticId"));
        return json(200, await getFrame({ workspaceId: auth.value.workspaceId, userId: auth.value.userId, diagnosticId }));
      }
      const input = validateDiagnosticFrameV2Input(await jsonBody(request));
      return json(201, { frame: await approveFrame({ workspaceId: auth.value.workspaceId, userId: auth.value.userId, input }) });
    } catch (error) {
      if (error instanceof DiagnosticFrameV2InputError) return json(400, { error: error.message });
      if (error instanceof DiagnosticEvidenceReviewAccessError) return json(403, { error: "An active advisor assignment is required for Diagnostic Frame development." });
      if (error instanceof DiagnosticFrameV2StateError) return json(409, { error: error.message });
      console.error("Diagnostic Frame v2 operation failed", error instanceof Error ? error.message : "Unknown error");
      return json(503, { error: "Diagnostic Frame development is temporarily unavailable." });
    }
  };
}

export default createWorkspaceDiagnosticFrameV2Handler();
export const config = { path: "/api/workspace/diagnostic-frame-v2", rateLimit: { windowLimit: 30, windowSize: 60, aggregateBy: ["ip", "domain"] } };
