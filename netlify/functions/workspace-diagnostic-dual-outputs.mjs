import { WORKSPACE_ROLES } from "../../workspace-authorization.js";
import { authenticateWorkspaceRequest } from "../lib/clerk-workspace-auth.mjs";
import { validateDiagnosticContextId } from "../lib/workspace-diagnostic-context.mjs";
import { DiagnosticEvidenceReviewAccessError } from "../lib/workspace-diagnostic-evidence-review.mjs";
import { createDiagnosticDualOutputs, DiagnosticDualOutputStateError, diagnosticDualOutputPolicy, getDiagnosticDualOutputs, reviewDiagnosticDualOutput } from "../lib/workspace-diagnostic-dual-outputs.mjs";

const headers = { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8", "X-Content-Type-Options": "nosniff" };
const json = (status, body) => new Response(JSON.stringify(body), { status, headers });

export function createWorkspaceDiagnosticDualOutputsHandler({ authenticate = authenticateWorkspaceRequest, get = getDiagnosticDualOutputs, create = createDiagnosticDualOutputs, review = reviewDiagnosticDualOutput } = {}) {
  return async request => {
    if (!["GET", "POST", "PATCH"].includes(request.method)) return json(405, { error: "Method not allowed." });
    const url = new URL(request.url);
    const origin = request.headers.get("origin");
    if (origin && origin !== url.origin) return json(403, { error: "Origin not allowed." });
    try {
      const auth = await authenticate(request);
      if (!auth.ok) return json(auth.status, { error: "Workspace access unavailable." });
      if (auth.value.role === WORKSPACE_ROLES.participant) return json(403, { error: "Participants cannot access synthesis outputs." });
      let diagnosticId;
      if (request.method === "GET") diagnosticId = validateDiagnosticContextId(url.searchParams.get("diagnosticId"));
      else {
        if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return json(400, { error: "Use application/json." });
        const text = await request.text();
        if (text.length > 1800) return json(400, { error: "Request too large." });
        let body;
        try { body = JSON.parse(text); } catch { return json(400, { error: "Submit a valid output decision." }); }
        const keys = Object.keys(body || {}).sort().join(",");
        if (request.method === "POST" && keys !== "diagnosticId") return json(400, { error: "Choose one diagnostic." });
        if (request.method === "PATCH" && keys !== "artifact,decision,diagnosticId,reviewNote") return json(400, { error: "Submit one complete output review." });
        diagnosticId = validateDiagnosticContextId(body.diagnosticId);
        if (request.method === "PATCH") {
          const outputs = await review({ workspaceId: auth.value.workspaceId, userId: auth.value.userId, input: { diagnosticId, artifact: body.artifact, decision: body.decision, reviewNote: body.reviewNote } });
          return json(200, { outputs, policy: diagnosticDualOutputPolicy });
        }
      }
      const outputs = request.method === "GET"
        ? await get({ workspaceId: auth.value.workspaceId, userId: auth.value.userId, diagnosticId })
        : await create({ workspaceId: auth.value.workspaceId, userId: auth.value.userId, diagnosticId });
      return json(200, { outputs, policy: diagnosticDualOutputPolicy });
    } catch (error) {
      if (error instanceof DiagnosticEvidenceReviewAccessError) return json(403, { error: "An active steward assignment is required." });
      if (error instanceof DiagnosticDualOutputStateError) return json(409, { error: error.message });
      console.error("Diagnostic dual outputs failed", error instanceof Error ? error.message : "Unknown error");
      return json(503, { error: "Diagnostic outputs are temporarily unavailable." });
    }
  };
}

export default createWorkspaceDiagnosticDualOutputsHandler();
export const config = { path: "/api/workspace/diagnostic-dual-outputs", rateLimit: { windowLimit: 20, windowSize: 60, aggregateBy: ["ip", "domain"] } };
