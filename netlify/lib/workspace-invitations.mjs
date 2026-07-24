import { createClerkClient } from "@clerk/backend";
import { requireWorkspaceId } from "../../workspace-tenant-boundary.js";
import { withNeonWorkspaceTransaction } from "./neon-workspace-database.mjs";

const PARTICIPANT_ROLE = "org:participant";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVITATION_ID_PATTERN = /^orginv_[A-Za-z0-9]+$/;

export class InvitationInputError extends Error {}
export class InvitationStateError extends Error {}

function invitationRoundId(invitation) {
  return invitation.privateMetadata?.collectionRoundId || null;
}

function publicInvitation(invitation) {
  return Object.freeze({
    id: invitation.id,
    emailAddress: invitation.emailAddress,
    status: invitation.status || "pending",
    createdAt: new Date(invitation.createdAt).toISOString(),
    expiresAt: new Date(invitation.expiresAt).toISOString()
  });
}

export function validateInvitationInput(value) {
  if (
    !value
    || typeof value !== "object"
    || Array.isArray(value)
    || Object.keys(value).sort().join(",") !== "emailAddress,roundId"
  ) {
    throw new InvitationInputError("Enter one participant email address.");
  }
  requireWorkspaceId(value.roundId);
  const emailAddress = typeof value.emailAddress === "string"
    ? value.emailAddress.trim().toLowerCase()
    : "";
  if (emailAddress.length > 254 || !EMAIL_PATTERN.test(emailAddress)) {
    throw new InvitationInputError("Enter a valid participant email address.");
  }
  return Object.freeze({ roundId: value.roundId, emailAddress });
}

export function validateInvitationReference(value) {
  if (
    !value
    || typeof value !== "object"
    || Array.isArray(value)
    || Object.keys(value).sort().join(",") !== "invitationId,roundId"
  ) {
    throw new InvitationInputError("Choose one pending invitation.");
  }
  requireWorkspaceId(value.roundId);
  if (typeof value.invitationId !== "string" || !INVITATION_ID_PATTERN.test(value.invitationId)) {
    throw new InvitationInputError("Choose a valid pending invitation.");
  }
  return Object.freeze(value);
}

export function createClerkInvitationGateway(
  clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })
) {
  return {
    async list({ organizationId, roundId }) {
      const response = await clerkClient.organizations.getOrganizationInvitationList({
        organizationId,
        status: ["pending", "accepted", "revoked", "expired"],
        limit: 100
      });
      return response.data
        .filter(invitation => invitationRoundId(invitation) === roundId)
        .map(publicInvitation);
    },

    async create({
      organizationId,
      inviterUserId,
      round,
      emailAddress,
      redirectOrigin
    }) {
      const remainingDays = Math.ceil(
        (new Date(round.closesAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
      );
      if (remainingDays < 1) throw new InvitationStateError("This collection period has ended.");
      const invitation = await clerkClient.organizations.createOrganizationInvitation({
        organizationId,
        inviterUserId,
        emailAddress,
        role: PARTICIPANT_ROLE,
        expiresInDays: Math.min(30, remainingDays),
        redirectUrl: `${redirectOrigin}/workspace/`,
        privateMetadata: { collectionRoundId: round.id }
      });
      return publicInvitation(invitation);
    },

    async revoke({ organizationId, invitationId, roundId, requestingUserId }) {
      const invitation = await clerkClient.organizations.getOrganizationInvitation({
        organizationId,
        invitationId
      });
      if (
        invitationRoundId(invitation) !== roundId
        || invitation.status !== "pending"
        || invitation.role !== PARTICIPANT_ROLE
      ) {
        throw new InvitationStateError("Only a pending invitation for this round can be revoked.");
      }
      const revoked = await clerkClient.organizations.revokeOrganizationInvitation({
        organizationId,
        invitationId,
        requestingUserId
      });
      return publicInvitation(revoked);
    }
  };
}

export async function recordInvitationEvent(
  { workspaceId, actorUserId, roundId, action, status },
  connectionString
) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    await query(
      `INSERT INTO app_operations.audit_events
        (workspace_id, actor_clerk_user_id, action, target_type, target_id, metadata)
       VALUES ($1, $2, $3, 'collection_round', $4, $5::jsonb)`,
      [
        workspaceId,
        actorUserId,
        action,
        roundId,
        JSON.stringify({ role: PARTICIPANT_ROLE, status })
      ]
    );
  }, connectionString);
}
