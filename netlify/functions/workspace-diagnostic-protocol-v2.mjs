import { WORKSPACE_ROLES } from "../../workspace-authorization.js";
import { authenticateWorkspaceRequest } from "../lib/clerk-workspace-auth.mjs";
import { DiagnosticContextInputError, validateDiagnosticContextId } from "../lib/workspace-diagnostic-context.mjs";
import { DiagnosticEvidenceReviewAccessError } from "../lib/workspace-diagnostic-evidence-review.mjs";
import { approveWorkspaceDiagnosticProtocolV2, DiagnosticProtocolV2InputError, DiagnosticProtocolV2StateError, getDiagnosticProtocolV2 } from "../lib/workspace-diagnostic-protocol-v2.mjs";
import { DiagnosticProtocolGovernanceV2InputError, DiagnosticProtocolGovernanceV2StateError, finalizeStewardProtocolV2, validateStewardProtocolFinalizationV2 } from "../lib/workspace-diagnostic-protocol-governance-v2.mjs";

const headers = { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8", "X-Content-Type-Options": "nosniff" };
const json = (status, body) => new Response(JSON.stringify(body), { status, headers });
async function jsonBody(request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new DiagnosticProtocolV2InputError("Use application/json.");
  const body = await request.text();
  if (body.length > 65536) throw new DiagnosticProtocolV2InputError("Request too large.");
  try { return JSON.parse(body); } catch { throw new DiagnosticProtocolV2InputError("Enter a valid v2 protocol."); }
}

export function createWorkspaceDiagnosticProtocolV2Handler({ authenticate = authenticateWorkspaceRequest, getProtocol = getDiagnosticProtocolV2, approveProtocol = approveWorkspaceDiagnosticProtocolV2, finalizeProtocol = finalizeStewardProtocolV2 } = {}) {
  return async request => {
    if (!["GET", "POST", "PATCH"].includes(request.method)) return json(405, { error: "Method not allowed." });
    const url = new URL(request.url), origin = request.headers.get("origin");
    if (origin && origin !== url.origin) return json(403, { error: "Origin not allowed." });
    try {
      const auth = await authenticate(request);
      if (!auth.ok) return json(auth.status, { error: "Workspace access unavailable." });
      if (auth.value.role === WORKSPACE_ROLES.participant) return json(403, { error: "Participants cannot access protocol development." });
      if (request.method === "GET") {
        const diagnosticId = validateDiagnosticContextId(url.searchParams.get("diagnosticId"));
        return json(200, await getProtocol({ workspaceId: auth.value.workspaceId, userId: auth.value.userId, diagnosticId }));
      }
      const raw = await jsonBody(request);
      if (request.method === "PATCH") {
        const input = validateStewardProtocolFinalizationV2(raw);
        return json(200, { governance: await finalizeProtocol({ workspaceId: auth.value.workspaceId, userId: auth.value.userId, input }) });
      }
      const input = { ...raw, diagnosticId: validateDiagnosticContextId(raw.diagnosticId) };
      return json(201, { protocol: await approveProtocol({ workspaceId: auth.value.workspaceId, userId: auth.value.userId, input }) });
    } catch (error) {
      if (error instanceof DiagnosticProtocolV2InputError || error instanceof DiagnosticContextInputError) return json(400, { error: error.message });
      if (error instanceof DiagnosticProtocolGovernanceV2InputError) return json(400, { error: error.message });
      if (error instanceof DiagnosticEvidenceReviewAccessError) return json(403, { error: "An active advisor assignment is required for protocol development." });
      if (error instanceof DiagnosticProtocolV2StateError) return json(409, { error: error.message });
      if (error instanceof DiagnosticProtocolGovernanceV2StateError) return json(409, { error: error.message });
      console.error("Diagnostic Protocol v2 operation failed", error instanceof Error ? error.message : "Unknown error");
      return json(503, { error: "Diagnostic Protocol development is temporarily unavailable." });
    }
  };
}

export default createWorkspaceDiagnosticProtocolV2Handler();
export const config = { path: "/api/workspace/diagnostic-protocol-v2", rateLimit: { windowLimit: 30, windowSize: 60, aggregateBy: ["ip", "domain"] } };
