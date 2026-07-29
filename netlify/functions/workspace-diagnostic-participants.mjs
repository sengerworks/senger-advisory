import { authorizeWorkspaceAction } from "../../workspace-authorization.js";
import { authenticateWorkspaceRequest } from "../lib/clerk-workspace-auth.mjs";
import { DiagnosticContextInputError, validateDiagnosticContextId } from "../lib/workspace-diagnostic-context.mjs";
import {
  approveWorkspaceDiagnosticParticipantPlan,
  DiagnosticParticipantInputError,
  DiagnosticParticipantStateError,
  getWorkspaceDiagnosticParticipantPlan,
  validateDiagnosticParticipantPlan,
  workspaceDiagnosticParticipantPolicy
} from "../lib/workspace-diagnostic-participants.mjs";

const headers = { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8", "X-Content-Type-Options": "nosniff" };
function json(status, body) { return new Response(JSON.stringify(body), { status, headers }); }
async function jsonBody(request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new DiagnosticParticipantInputError("Use application/json.");
  const text = await request.text();
  if (text.length > 16384) throw new DiagnosticParticipantInputError("Request too large.");
  try { return JSON.parse(text); } catch { throw new DiagnosticParticipantInputError("Enter valid participant-design details."); }
}

export function createWorkspaceDiagnosticParticipantsHandler({
  authenticate = authenticateWorkspaceRequest,
  getPlan = getWorkspaceDiagnosticParticipantPlan,
  approvePlan = approveWorkspaceDiagnosticParticipantPlan
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
        return json(403, { error: "Only workspace administrators can manage participant design." });
      }
      if (request.method === "GET") {
        const diagnosticId = validateDiagnosticContextId(url.searchParams.get("diagnosticId"));
        return json(200, {
          participantPlan: await getPlan(auth.value.workspaceId, diagnosticId),
          policy: workspaceDiagnosticParticipantPolicy
        });
      }
      const input = validateDiagnosticParticipantPlan(await jsonBody(request));
      return json(201, {
        participantPlan: await approvePlan({
          workspaceId: auth.value.workspaceId,
          actorUserId: auth.value.userId,
          input
        })
      });
    } catch (error) {
      if (error instanceof DiagnosticParticipantInputError || error instanceof DiagnosticContextInputError) return json(400, { error: error.message });
      if (error instanceof DiagnosticParticipantStateError) return json(409, { error: error.message });
      console.error("Workspace participant-design operation failed", error instanceof Error ? error.message : "Unknown error");
      return json(503, { error: "Participant design is temporarily unavailable." });
    }
  };
}

export default createWorkspaceDiagnosticParticipantsHandler();
export const config = { path: "/api/workspace/diagnostic-participants", rateLimit: { windowLimit: 30, windowSize: 60, aggregateBy: ["ip", "domain"] } };
