import { authorizeWorkspaceAction } from "../../workspace-authorization.js";
import { authenticateWorkspaceRequest } from "../lib/clerk-workspace-auth.mjs";
import { createOpenAIDiagnosticContextSynthesizer, DiagnosticContextSynthesisProviderError } from "../lib/openai-diagnostic-context-synthesis.mjs";
import { DiagnosticContextInputError, validateDiagnosticContextInput } from "../lib/workspace-diagnostic-context.mjs";

const headers = { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8", "X-Content-Type-Options": "nosniff" };
const json = (status, body) => new Response(JSON.stringify(body), { status, headers });

export function createWorkspaceDiagnosticContextSynthesisHandler({ authenticate = authenticateWorkspaceRequest, synthesize } = {}) {
  return async request => {
    if (request.method !== "POST") return json(405, { error: "Method not allowed." });
    const url = new URL(request.url), origin = request.headers.get("origin");
    if (origin && origin !== url.origin) return json(403, { error: "Origin not allowed." });
    try {
      const auth = await authenticate(request);
      if (!auth.ok) return json(auth.status, { error: "Workspace access unavailable." });
      if (!authorizeWorkspaceAction({ role: auth.value.role, action: "diagnostic:update" })) return json(403, { error: "Only the diagnostic sponsor can create this synthesis." });
      if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new DiagnosticContextInputError("Use application/json.");
      const text = await request.text();
      if (text.length > 24576) throw new DiagnosticContextInputError("Request too large.");
      let body; try { body = JSON.parse(text); } catch { throw new DiagnosticContextInputError("Enter valid context details."); }
      const context = validateDiagnosticContextInput(body);
      const provider = synthesize || createOpenAIDiagnosticContextSynthesizer();
      const { guidanceSessionScheduledFor: _scheduledFor, guidanceSessionAcknowledged: _acknowledged, approvalNote: _approvalNote, ...synthesisContext } = context;
      return json(200, { synthesis: await provider(synthesisContext), boundary: "Sponsor perspective—working articulation, not a diagnostic finding." });
    } catch (error) {
      if (error instanceof DiagnosticContextInputError) return json(400, { error: error.message });
      if (error instanceof DiagnosticContextSynthesisProviderError) return json(503, { error: "The context synthesis is temporarily unavailable. Your answers remain intact." });
      console.error("Workspace context synthesis failed", error instanceof Error ? error.message : "Unknown error");
      return json(503, { error: "The context synthesis is temporarily unavailable. Your answers remain intact." });
    }
  };
}

export default createWorkspaceDiagnosticContextSynthesisHandler();
export const config = { path: "/api/workspace/diagnostic-context-synthesis", rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ["ip", "domain"] } };
