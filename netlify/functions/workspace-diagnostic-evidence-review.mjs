import { WORKSPACE_ROLES } from "../../workspace-authorization.js";
import { authenticateWorkspaceRequest } from "../lib/clerk-workspace-auth.mjs";
import { validateDiagnosticContextId } from "../lib/workspace-diagnostic-context.mjs";
import {
  DiagnosticEvidenceReviewAccessError,
  DiagnosticEvidenceReviewInputError,
  DiagnosticEvidenceReviewStateError,
  getDiagnosticEvidenceReviewQueue,
  reviewDiagnosticEvidence,
  validateEvidenceReviewInput
} from "../lib/workspace-diagnostic-evidence-review.mjs";

const headers = { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8", "X-Content-Type-Options": "nosniff" };
function json(status, body) { return new Response(JSON.stringify(body), { status, headers }); }
async function jsonBody(request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new DiagnosticEvidenceReviewInputError("Use application/json.");
  const text = await request.text();
  if (text.length > 4096) throw new DiagnosticEvidenceReviewInputError("Request too large.");
  try { return JSON.parse(text); } catch { throw new DiagnosticEvidenceReviewInputError("Enter a valid evidence-review decision."); }
}

export function createWorkspaceDiagnosticEvidenceReviewHandler({
  authenticate = authenticateWorkspaceRequest,
  getQueue = getDiagnosticEvidenceReviewQueue,
  reviewEvidence = reviewDiagnosticEvidence
} = {}) {
  return async request => {
    if (!["GET", "POST"].includes(request.method)) return json(405, { error: "Method not allowed." });
    const url = new URL(request.url);
    const origin = request.headers.get("origin");
    if (origin && origin !== url.origin) return json(403, { error: "Origin not allowed." });
    try {
      const auth = await authenticate(request);
      if (!auth.ok) return json(auth.status, { error: "Workspace access unavailable." });
      if (auth.value.role === WORKSPACE_ROLES.participant) return json(403, { error: "Participants cannot access evidence review." });
      if (request.method === "GET") {
        const diagnosticId = validateDiagnosticContextId(url.searchParams.get("diagnosticId"));
        return json(200, await getQueue({ workspaceId: auth.value.workspaceId, userId: auth.value.userId, diagnosticId }));
      }
      const input = validateEvidenceReviewInput(await jsonBody(request));
      return json(200, { evidence: await reviewEvidence({ workspaceId: auth.value.workspaceId, userId: auth.value.userId, input }) });
    } catch (error) {
      if (error instanceof DiagnosticEvidenceReviewInputError) return json(400, { error: error.message });
      if (error instanceof DiagnosticEvidenceReviewAccessError) return json(403, { error: error.message });
      if (error instanceof DiagnosticEvidenceReviewStateError) return json(409, { error: error.message });
      console.error("Workspace diagnostic evidence review failed", error instanceof Error ? error.message : "Unknown error");
      return json(503, { error: "Diagnostic evidence review is temporarily unavailable." });
    }
  };
}

export default createWorkspaceDiagnosticEvidenceReviewHandler();
export const config = { path: "/api/workspace/diagnostic-evidence-review", rateLimit: { windowLimit: 60, windowSize: 60, aggregateBy: ["ip", "domain"] } };
