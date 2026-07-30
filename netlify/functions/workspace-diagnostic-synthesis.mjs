import { WORKSPACE_ROLES } from "../../workspace-authorization.js";
import { authenticateWorkspaceRequest } from "../lib/clerk-workspace-auth.mjs";
import { createOpenAIDiagnosticSynthesizer, DEFAULT_DIAGNOSTIC_SYNTHESIS_MODEL, DiagnosticSynthesisProviderError } from "../lib/openai-diagnostic-synthesis.mjs";
import { validateDiagnosticContextId } from "../lib/workspace-diagnostic-context.mjs";
import { DiagnosticEvidenceReviewAccessError } from "../lib/workspace-diagnostic-evidence-review.mjs";
import { createDiagnosticSynthesis, DiagnosticSynthesisStateError, getDiagnosticSynthesis, reviewDiagnosticSynthesis } from "../lib/workspace-diagnostic-synthesis.mjs";

const headers = { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8", "X-Content-Type-Options": "nosniff" };
const json = (status, body) => new Response(JSON.stringify(body), { status, headers });

export function createWorkspaceDiagnosticSynthesisHandler({
  authenticate = authenticateWorkspaceRequest,
  create = createDiagnosticSynthesis,
  get = getDiagnosticSynthesis,
  synthesize = null,
  review = reviewDiagnosticSynthesis,
  model = process.env.OPENAI_DIAGNOSTIC_MODEL || DEFAULT_DIAGNOSTIC_SYNTHESIS_MODEL
} = {}) {
  return async request => {
    if (!["GET", "POST", "PATCH"].includes(request.method)) return json(405, { error: "Method not allowed." });
    const url = new URL(request.url);
    const origin = request.headers.get("origin");
    if (origin && origin !== url.origin) return json(403, { error: "Origin not allowed." });
    try {
      const auth = await authenticate(request);
      if (!auth.ok) return json(auth.status, { error: "Workspace access unavailable." });
      if (auth.value.role === WORKSPACE_ROLES.participant) return json(403, { error: "Participants cannot access diagnostic synthesis." });
      let diagnosticId;
      if (request.method === "GET") diagnosticId = validateDiagnosticContextId(url.searchParams.get("diagnosticId"));
      else {
        if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return json(400, { error: "Use application/json." });
        const text = await request.text();
        if (text.length > 1024) return json(400, { error: "Request too large." });
        let body;
        try { body = JSON.parse(text); } catch { return json(400, { error: "Choose a valid diagnostic." }); }
        const keys = Object.keys(body || {}).sort().join(",");
        if (request.method === "POST" && keys !== "diagnosticId") return json(400, { error: "Choose one diagnostic to synthesize." });
        if (request.method === "PATCH" && keys !== "decision,diagnosticId,reviewNote") return json(400, { error: "Submit one advisor synthesis decision." });
        diagnosticId = validateDiagnosticContextId(body.diagnosticId);
        if (request.method === "PATCH") return json(200, { finding: await review({ workspaceId: auth.value.workspaceId, userId: auth.value.userId, diagnosticId, decision: body.decision, reviewNote: body.reviewNote }) });
      }
      if (request.method === "GET") return json(200, { finding: await get({ workspaceId: auth.value.workspaceId, userId: auth.value.userId, diagnosticId }) });
      const provider = synthesize || createOpenAIDiagnosticSynthesizer({ model });
      return json(200, { finding: await create({ workspaceId: auth.value.workspaceId, userId: auth.value.userId, diagnosticId, synthesize: provider, model }) });
    } catch (error) {
      if (error instanceof DiagnosticEvidenceReviewAccessError) return json(403, { error: error.message });
      if (error instanceof DiagnosticSynthesisStateError) return json(409, { error: error.message });
      if (error instanceof DiagnosticSynthesisProviderError) return json(503, { error: "Protected diagnostic synthesis is temporarily unavailable." });
      console.error("Workspace diagnostic synthesis failed", error instanceof Error ? error.message : "Unknown error");
      return json(503, { error: "Diagnostic synthesis is temporarily unavailable." });
    }
  };
}

export default createWorkspaceDiagnosticSynthesisHandler();
export const config = { path: "/api/workspace/diagnostic-synthesis", rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ["ip", "domain"] } };
