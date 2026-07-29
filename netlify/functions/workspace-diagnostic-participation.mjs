import { WORKSPACE_ROLES } from "../../workspace-authorization.js";
import { authenticateWorkspaceRequest } from "../lib/clerk-workspace-auth.mjs";
import { createDiagnosticInvitationGateway } from "../lib/workspace-diagnostic-invitations.mjs";
import {
  acceptDiagnosticNotice,
  DiagnosticParticipationInputError,
  DiagnosticParticipationStateError,
  getDiagnosticParticipation
} from "../lib/workspace-diagnostic-participation.mjs";

const headers = { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8", "X-Content-Type-Options": "nosniff" };
function json(status, body) { return new Response(JSON.stringify(body), { status, headers }); }

export function createWorkspaceDiagnosticParticipationHandler({
  authenticate = authenticateWorkspaceRequest,
  gateway = createDiagnosticInvitationGateway(),
  getParticipation = getDiagnosticParticipation,
  acceptNotice = acceptDiagnosticNotice
} = {}) {
  return async request => {
    if (!["GET", "POST"].includes(request.method)) return json(405, { error: "Method not allowed." });
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) return json(403, { error: "Origin not allowed." });
    try {
      const auth = await authenticate(request);
      if (!auth.ok) return json(auth.status, { error: "Workspace access unavailable." });
      if (auth.value.role !== WORKSPACE_ROLES.participant) return json(403, { error: "Participant access is required." });
      if (request.method === "GET") {
        const accepted = await gateway.resolveAccepted({ organizationId: auth.value.organizationId, userId: auth.value.userId });
        if (!accepted) return json(200, { state: "unavailable" });
        return json(200, await getParticipation({ workspaceId: auth.value.workspaceId, userId: auth.value.userId, ...accepted }));
      }
      if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new DiagnosticParticipationInputError("Use application/json.");
      const value = await request.json();
      if (!value || Object.keys(value).sort().join(",") !== "diagnosticId,noticeVersion") throw new DiagnosticParticipationInputError("Accept the current diagnostic privacy notice.");
      return json(200, await acceptNotice({ workspaceId: auth.value.workspaceId, userId: auth.value.userId, diagnosticId: value.diagnosticId, noticeVersion: value.noticeVersion }));
    } catch (error) {
      if (error instanceof DiagnosticParticipationInputError || error instanceof TypeError) return json(400, { error: error.message });
      if (error instanceof DiagnosticParticipationStateError) return json(409, { error: error.message });
      console.error("Workspace diagnostic participation failed", error instanceof Error ? error.message : "Unknown error");
      return json(503, { error: "Diagnostic participation is temporarily unavailable." });
    }
  };
}

export default createWorkspaceDiagnosticParticipationHandler();
export const config = { path: "/api/workspace/diagnostic-participation", rateLimit: { windowLimit: 120, windowSize: 60, aggregateBy: ["ip", "domain"] } };
