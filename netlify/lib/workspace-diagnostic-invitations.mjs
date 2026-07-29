import { createClerkClient } from "@clerk/backend";
import { createHash } from "node:crypto";
import { withNeonWorkspaceTransaction } from "./neon-workspace-database.mjs";
import { validateDiagnosticContextId } from "./workspace-diagnostic-context.mjs";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PARTICIPANT_ROLE = "org:participant";

export class DiagnosticInvitationInputError extends Error {}
export class DiagnosticInvitationStateError extends Error {}

export function diagnosticInvitationProviderError(error) {
  const codes = Array.isArray(error?.errors)
    ? error.errors.map(item => String(item?.code || "").toLowerCase())
    : [];
  const detail = `${error?.message || ""} ${codes.join(" ")}`.toLowerCase();
  if (/already.*member|membership.*exist|identifier.*exist/.test(detail)) {
    return new DiagnosticInvitationStateError("That email already belongs to this workspace. Use a different test address or remove the existing membership in Clerk.");
  }
  if (/already.*invit|duplicate/.test(detail)) {
    return new DiagnosticInvitationStateError("That email already has a pending diagnostic invitation. Use the existing invitation or revoke it in Clerk before trying again.");
  }
  if (/role|permission/.test(detail)) {
    return new DiagnosticInvitationStateError("Clerk rejected the participant role. Confirm that org:participant remains enabled for the development organization.");
  }
  if (/redirect|url/.test(detail)) {
    return new DiagnosticInvitationStateError("Clerk rejected the local return address. Confirm that http://localhost:8888 is allowed in the development Clerk instance.");
  }
  return null;
}

function invitationDigest(invitationId) {
  return createHash("sha256").update(invitationId).digest("hex");
}

export function validateDiagnosticInvitationInput(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).sort().join(",") !== "diagnosticId,emailAddress,planSlotId") {
    throw new DiagnosticInvitationInputError("Choose one approved perspective slot and participant email address.");
  }
  const emailAddress = String(value.emailAddress || "").trim().toLowerCase();
  const planSlotId = String(value.planSlotId || "").trim();
  if (!EMAIL_PATTERN.test(emailAddress) || emailAddress.length > 254) throw new DiagnosticInvitationInputError("Enter a valid participant email address.");
  if (!planSlotId || planSlotId.length > 100) throw new DiagnosticInvitationInputError("Choose a valid perspective slot.");
  return Object.freeze({
    diagnosticId: validateDiagnosticContextId(value.diagnosticId),
    planSlotId,
    emailAddress
  });
}

function diagnosticMetadata(invitation) {
  return invitation.privateMetadata || {};
}

function publicInvitation(invitation) {
  return Object.freeze({
    id: invitation.id,
    planSlotId: diagnosticMetadata(invitation).diagnosticPlanSlotId,
    emailAddress: invitation.emailAddress,
    status: invitation.status || "pending",
    createdAt: new Date(invitation.createdAt).toISOString(),
    expiresAt: new Date(invitation.expiresAt).toISOString()
  });
}

export function createDiagnosticInvitationGateway(
  clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })
) {
  return {
    async resolveAccepted({ organizationId, userId }) {
      const [user, response] = await Promise.all([
        clerkClient.users.getUser(userId),
        clerkClient.organizations.getOrganizationInvitationList({
          organizationId,
          status: ["accepted"],
          limit: 100
        })
      ]);
      const emails = new Set((user.emailAddresses || []).map(value => value.emailAddress.toLowerCase()));
      const matches = response.data
        .filter(invitation => emails.has(invitation.emailAddress.toLowerCase()))
        .filter(invitation => diagnosticMetadata(invitation).diagnosticId)
        .sort((a, b) => b.createdAt - a.createdAt);
      if (!matches[0]) return null;
      return {
        invitationId: matches[0].id,
        diagnosticId: diagnosticMetadata(matches[0]).diagnosticId
      };
    },
    async list({ organizationId, diagnosticId }) {
      const response = await clerkClient.organizations.getOrganizationInvitationList({
        organizationId,
        status: ["pending", "accepted", "revoked", "expired"],
        limit: 100
      });
      return response.data
        .filter(invitation => diagnosticMetadata(invitation).diagnosticId === diagnosticId)
        .map(publicInvitation);
    },
    async create({ organizationId, inviterUserId, diagnosticId, planSlotId, emailAddress, redirectOrigin }) {
      const invitation = await clerkClient.organizations.createOrganizationInvitation({
        organizationId,
        inviterUserId,
        emailAddress,
        role: PARTICIPANT_ROLE,
        expiresInDays: 30,
        redirectUrl: `${redirectOrigin}/workspace/`,
        privateMetadata: { diagnosticId, diagnosticPlanSlotId: planSlotId }
      });
      return publicInvitation(invitation);
    }
  };
}

export async function getDiagnosticInvitationReadiness(workspaceId, diagnosticId, connectionString) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    const result = await query(
      `SELECT diagnostic.state, protocol.id AS protocol_id, plan.approved_payload AS plan_payload
       FROM app_shared.diagnostics diagnostic
       LEFT JOIN app_shared.diagnostic_protocols protocol
         ON protocol.workspace_id = diagnostic.workspace_id AND protocol.diagnostic_id = diagnostic.id
       LEFT JOIN app_private.diagnostic_participant_plans plan
         ON plan.workspace_id = diagnostic.workspace_id AND plan.diagnostic_id = diagnostic.id
       WHERE diagnostic.id = $1`,
      [diagnosticId]
    );
    const row = result.rows[0];
    if (!row) throw new DiagnosticInvitationStateError("That diagnostic is not available in this workspace.");
    if (!row.protocol_id || row.state !== "protocol-review") throw new DiagnosticInvitationStateError("Approve the common protocol before inviting participants.");
    return Object.freeze({
      diagnosticId,
      planSlots: Object.freeze(row.plan_payload.participantSlots.map(slot => Object.freeze({ ...slot })))
    });
  }, connectionString);
}

export async function recordDiagnosticInvitation(
  { workspaceId, actorUserId, diagnosticId, planSlot, invitation }, connectionString
) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    const result = await query(
      `INSERT INTO app_identity.diagnostic_participant_slots
        (workspace_id, diagnostic_id, plan_slot_id, clerk_invitation_id,
         invitation_digest, perspective_objectives)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)
       RETURNING id`,
      [workspaceId, diagnosticId, planSlot.slotId, invitation.id, invitationDigest(invitation.id),
        JSON.stringify([
          `leadershipLevel:${planSlot.leadershipLevel}`,
          `executionProximity:${planSlot.executionProximity}`,
          `functionalLens:${planSlot.functionalLens}`
        ])]
    );
    await query(
      `INSERT INTO app_operations.audit_events
        (workspace_id, actor_clerk_user_id, action, target_type, target_id, metadata)
       VALUES ($1, $2, 'diagnostic.invitation-created', 'diagnostic', $3, $4::jsonb)`,
      [workspaceId, actorUserId, diagnosticId, JSON.stringify({
        participantSlotId: result.rows[0].id,
        planSlotId: planSlot.slotId,
        invitationStatus: invitation.status
      })]
    );
    return { participantSlotId: result.rows[0].id };
  }, connectionString);
}

export async function listRecordedDiagnosticSlots(workspaceId, diagnosticId, connectionString) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    const result = await query(
      `SELECT plan_slot_id, clerk_invitation_id, notice_accepted_at IS NOT NULL AS notice_accepted
       FROM app_identity.diagnostic_participant_slots
       WHERE diagnostic_id = $1 AND revoked_at IS NULL`,
      [diagnosticId]
    );
    return result.rows.map(row => ({
      planSlotId: row.plan_slot_id,
      invitationId: row.clerk_invitation_id,
      noticeAccepted: row.notice_accepted
    }));
  }, connectionString);
}
