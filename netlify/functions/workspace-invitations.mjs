import { authorizeWorkspaceAction } from "../../workspace-authorization.js";
import { authenticateWorkspaceRequest } from "../lib/clerk-workspace-auth.mjs";
import {
  createClerkInvitationGateway,
  InvitationInputError,
  InvitationStateError,
  recordInvitationEvent,
  validateInvitationInput,
  validateInvitationReference
} from "../lib/workspace-invitations.mjs";
import { getWorkspaceRound } from "../lib/workspace-rounds.mjs";

const headers = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff"
};

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers });
}

async function jsonBody(request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new InvitationInputError("Use application/json.");
  }
  const text = await request.text();
  if (text.length > 2048) throw new InvitationInputError("Request too large.");
  try {
    return JSON.parse(text);
  } catch {
    throw new InvitationInputError("Enter valid invitation details.");
  }
}

export function createWorkspaceInvitationsHandler({
  authenticate = authenticateWorkspaceRequest,
  gateway = createClerkInvitationGateway(),
  getRound = getWorkspaceRound,
  recordEvent = recordInvitationEvent
} = {}) {
  return async request => {
    if (!["GET", "POST", "DELETE"].includes(request.method)) {
      return json(405, { error: "Method not allowed." });
    }
    const url = new URL(request.url);
    const origin = request.headers.get("origin");
    if (origin && origin !== url.origin) return json(403, { error: "Origin not allowed." });

    try {
      const auth = await authenticate(request);
      if (!auth.ok) return json(auth.status, { error: "Workspace access unavailable." });
      const { role, workspaceId, userId, organizationId } = auth.value;
      const action = request.method === "GET"
        ? "invitation:list"
        : request.method === "POST"
          ? "invitation:create"
          : "invitation:revoke";
      if (!authorizeWorkspaceAction({ role, action })) {
        return json(403, { error: "Only workspace administrators can manage invitations." });
      }

      if (request.method === "GET") {
        const roundId = url.searchParams.get("roundId");
        const round = await getRound(workspaceId, roundId);
        if (!round) return json(404, { error: "Collection round not found." });
        const invitations = await gateway.list({ organizationId, roundId });
        return json(200, {
          invitations,
          counts: {
            invited: invitations.length,
            accepted: invitations.filter(value => value.status === "accepted").length,
            pending: invitations.filter(value => value.status === "pending").length
          }
        });
      }

      if (request.method === "POST") {
        const input = validateInvitationInput(await jsonBody(request));
        const round = await getRound(workspaceId, input.roundId);
        if (!round) return json(404, { error: "Collection round not found." });
        if (round.status !== "open") {
          return json(409, { error: "Open the collection round before inviting participants." });
        }
        const invitation = await gateway.create({
          organizationId,
          inviterUserId: userId,
          round,
          emailAddress: input.emailAddress,
          redirectOrigin: url.origin
        });
        await recordEvent({
          workspaceId,
          actorUserId: userId,
          roundId: round.id,
          action: "invitation.created",
          status: invitation.status
        });
        return json(201, { invitation });
      }

      const input = validateInvitationReference(await jsonBody(request));
      const round = await getRound(workspaceId, input.roundId);
      if (!round) return json(404, { error: "Collection round not found." });
      const invitation = await gateway.revoke({
        organizationId,
        invitationId: input.invitationId,
        roundId: round.id,
        requestingUserId: userId
      });
      await recordEvent({
        workspaceId,
        actorUserId: userId,
        roundId: round.id,
        action: "invitation.revoked",
        status: invitation.status
      });
      return json(200, { invitation });
    } catch (error) {
      if (error instanceof InvitationInputError || error instanceof TypeError) {
        return json(400, { error: error.message || "Enter valid invitation details." });
      }
      if (error instanceof InvitationStateError) return json(409, { error: error.message });
      console.error(
        "Workspace invitation operation failed",
        error instanceof Error ? error.message : "Unknown error"
      );
      return json(503, { error: "Invitation service is temporarily unavailable." });
    }
  };
}

export default createWorkspaceInvitationsHandler();

export const config = {
  path: "/api/workspace/invitations",
  rateLimit: {
    windowLimit: 60,
    windowSize: 60,
    aggregateBy: ["ip", "domain"]
  }
};
