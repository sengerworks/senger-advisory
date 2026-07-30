import { WORKSPACE_ROLES } from "../../workspace-authorization.js";
import { authenticateWorkspaceRequest } from "../lib/clerk-workspace-auth.mjs";
import { createOpenAIDiagnosticDeidentifier, DEFAULT_DIAGNOSTIC_DEIDENTIFICATION_MODEL, DiagnosticDeidentificationProviderError } from "../lib/openai-diagnostic-deidentification.mjs";
import { validateDiagnosticContextId } from "../lib/workspace-diagnostic-context.mjs";
import { DiagnosticEvidenceReviewAccessError } from "../lib/workspace-diagnostic-evidence-review.mjs";
import { DiagnosticEvidencePreparationStateError, prepareNextDiagnosticInterviewEvidence } from "../lib/workspace-diagnostic-evidence-preparation.mjs";

const headers = { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8", "X-Content-Type-Options": "nosniff" };
function json(status, body) { return new Response(JSON.stringify(body), { status, headers }); }

export function createWorkspaceDiagnosticEvidencePreparationHandler({
  authenticate = authenticateWorkspaceRequest,
  deidentify = null,
  prepare = prepareNextDiagnosticInterviewEvidence,
  model = process.env.OPENAI_DIAGNOSTIC_MODEL || DEFAULT_DIAGNOSTIC_DEIDENTIFICATION_MODEL
} = {}) {
  return async request => {
    if (request.method !== "POST") return json(405, { error: "Method not allowed." });
    const url = new URL(request.url);
    const origin = request.headers.get("origin");
    if (origin && origin !== url.origin) return json(403, { error: "Origin not allowed." });
    try {
      const auth = await authenticate(request);
      if (!auth.ok) return json(auth.status, { error: "Workspace access unavailable." });
      if (auth.value.role === WORKSPACE_ROLES.participant) return json(403, { error: "Participants cannot prepare diagnostic evidence." });
      if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return json(400, { error: "Use application/json." });
      const text = await request.text();
      if (text.length > 1024) return json(400, { error: "Request too large." });
      let body;
      try { body = JSON.parse(text); } catch { return json(400, { error: "Choose a valid diagnostic." }); }
      if (!body || Object.keys(body).join(",") !== "diagnosticId") return json(400, { error: "Choose one diagnostic to prepare." });
      const diagnosticId = validateDiagnosticContextId(body.diagnosticId);
      const provider = deidentify || createOpenAIDiagnosticDeidentifier({ model });
      return json(200, await prepare({ workspaceId: auth.value.workspaceId, userId: auth.value.userId, diagnosticId, deidentify: provider, model }));
    } catch (error) {
      if (error instanceof DiagnosticEvidenceReviewAccessError) return json(403, { error: error.message });
      if (error instanceof DiagnosticEvidencePreparationStateError) return json(409, { error: error.message });
      if (error instanceof DiagnosticDeidentificationProviderError) return json(503, { error: "Protected de-identification is temporarily unavailable." });
      console.error("Workspace diagnostic evidence preparation failed", error instanceof Error ? error.message : "Unknown error");
      return json(503, { error: "Diagnostic evidence preparation is temporarily unavailable." });
    }
  };
}

export default createWorkspaceDiagnosticEvidencePreparationHandler();
export const config = { path: "/api/workspace/diagnostic-evidence-preparation", rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ["ip", "domain"] } };
