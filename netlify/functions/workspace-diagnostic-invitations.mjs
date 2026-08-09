import { authorizeWorkspaceAction } from "../../workspace-authorization.js";
import { authenticateWorkspaceRequest } from "../lib/clerk-workspace-auth.mjs";
import { DiagnosticContextInputError, validateDiagnosticContextId } from "../lib/workspace-diagnostic-context.mjs";
import {
  createDiagnosticInvitationGateway,
  diagnosticCollectionStatus,
  diagnosticInvitationProviderError,
  DiagnosticInvitationInputError,
  DiagnosticInvitationStateError,
  getDiagnosticInvitationReadiness,
  listRecordedDiagnosticSlots,
  recordDiagnosticInvitation,
  summarizeDiagnosticCollection,
  validateDiagnosticInvitationInput
} from "../lib/workspace-diagnostic-invitations.mjs";

const headers = { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8", "X-Content-Type-Options": "nosniff" };
function json(status, body) { return new Response(JSON.stringify(body), { status, headers }); }
async function jsonBody(request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new DiagnosticInvitationInputError("Use application/json.");
  const text = await request.text();
  if (text.length > 2048) throw new DiagnosticInvitationInputError("Request too large.");
  try { return JSON.parse(text); } catch { throw new DiagnosticInvitationInputError("Enter valid invitation details."); }
}

export function createWorkspaceDiagnosticInvitationsHandler({
  authenticate = authenticateWorkspaceRequest,
  gateway = createDiagnosticInvitationGateway(),
  getReadiness = getDiagnosticInvitationReadiness,
  listSlots = listRecordedDiagnosticSlots,
  recordInvitation = recordDiagnosticInvitation
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
      if (!authorizeWorkspaceAction({ role: auth.value.role, action })) return json(403, { error: "Only workspace administrators can manage diagnostic invitations." });

      if (request.method === "GET") {
        const diagnosticId = validateDiagnosticContextId(url.searchParams.get("diagnosticId"));
        const readiness = await getReadiness(auth.value.workspaceId, diagnosticId);
        const [invitations, recordedSlots] = await Promise.all([
          gateway.list({ organizationId: auth.value.organizationId, diagnosticId }),
          listSlots(auth.value.workspaceId, diagnosticId)
        ]);
        const invitationById = new Map(invitations.map(invitation => [invitation.id, invitation]));
        const planSlots = readiness.planSlots.map(planSlot => {
            const recorded = recordedSlots.find(slot => slot.planSlotId === planSlot.slotId);
            const invitation = recorded ? invitationById.get(recorded.invitationId) || null : null;
            return {
              ...planSlot,
              invitation,
              collectionStatus: diagnosticCollectionStatus({
                invitation,
                noticeAccepted: recorded?.noticeAccepted || false,
                interviewStatus: recorded?.interviewStatus || null
              })
            };
          });
        const sponsorSlots = planSlots.map(({ collectionStatus, ...slot }) => slot);
        return json(200, {
          diagnosticState: readiness.diagnosticState,
          canInvite: readiness.canInvite,
          progress: summarizeDiagnosticCollection(planSlots),
          planSlots: sponsorSlots
        });
      }

      const input = validateDiagnosticInvitationInput(await jsonBody(request));
      const readiness = await getReadiness(auth.value.workspaceId, input.diagnosticId);
      if (!readiness.canInvite) throw new DiagnosticInvitationStateError("Participant invitations are closed for this diagnostic stage.");
      const planSlot = readiness.planSlots.find(slot => slot.slotId === input.planSlotId);
      if (!planSlot) throw new DiagnosticInvitationInputError("Choose a perspective slot from the approved plan.");
      const recorded = await listSlots(auth.value.workspaceId, input.diagnosticId);
      if (recorded.some(slot => slot.planSlotId === input.planSlotId)) throw new DiagnosticInvitationStateError("That perspective slot already has an invitation.");
      const invitation = await gateway.create({
        organizationId: auth.value.organizationId,
        inviterUserId: auth.value.userId,
        diagnosticId: input.diagnosticId,
        planSlotId: input.planSlotId,
        emailAddress: input.emailAddress,
        redirectOrigin: url.origin
      });
      await recordInvitation({
        workspaceId: auth.value.workspaceId,
        actorUserId: auth.value.userId,
        diagnosticId: input.diagnosticId,
        planSlot,
        invitation
      });
      return json(201, { invitation });
    } catch (error) {
      if (error instanceof DiagnosticInvitationInputError || error instanceof DiagnosticContextInputError) return json(400, { error: error.message });
      if (error instanceof DiagnosticInvitationStateError) return json(409, { error: error.message });
      const providerError = diagnosticInvitationProviderError(error);
      if (providerError) return json(409, { error: providerError.message });
      const providerCodes = Array.isArray(error?.errors) ? error.errors.map(item => item?.code).filter(Boolean) : [];
      console.error("Workspace diagnostic invitation operation failed", error instanceof Error ? error.message : "Unknown error", providerCodes);
      return json(503, { error: "Diagnostic invitations are temporarily unavailable." });
    }
  };
}

export default createWorkspaceDiagnosticInvitationsHandler();
export const config = { path: "/api/workspace/diagnostic-invitations", rateLimit: { windowLimit: 30, windowSize: 60, aggregateBy: ["ip", "domain"] } };
