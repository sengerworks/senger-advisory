import { createHash, randomUUID } from "node:crypto";
import { createClerkClient } from "@clerk/backend";
import { resolveNeonWorkspaceId, withNeonWorkspaceTransaction } from "./neon-workspace-database.mjs";
import { createWorkspaceDiagnostic } from "./workspace-diagnostics.mjs";

export class ClientProvisioningInputError extends Error {}

export function validateClientProvisioning(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).sort().join(",") !== "organizationName,privacyBriefConfirmed,provisioningRequestId,route,scopeConfirmed,sponsorEmail") throw new ClientProvisioningInputError("Submit the complete POC enrollment confirmation.");
  const organizationName = String(value.organizationName || "").trim();
  const sponsorEmail = String(value.sponsorEmail || "").trim().toLowerCase();
  if (organizationName.length < 2 || organizationName.length > 120) throw new ClientProvisioningInputError("Organization name must be 2 to 120 characters.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sponsorEmail) || sponsorEmail.length > 254) throw new ClientProvisioningInputError("Enter a valid sponsor email address.");
  if (!["automated", "advisor-led"].includes(value.route)) throw new ClientProvisioningInputError("Choose a valid diagnostic route.");
  if (value.scopeConfirmed !== true) throw new ClientProvisioningInputError("Confirm the POC scope, participant range, target window, and final debrief before enrollment.");
  if (value.privacyBriefConfirmed !== true) throw new ClientProvisioningInputError("Confirm the sponsor received the confidentiality brief and paid-boundary explanation.");
  const provisioningRequestId = String(value.provisioningRequestId || "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(provisioningRequestId)) throw new ClientProvisioningInputError("Start a valid client provisioning request.");
  return Object.freeze({ organizationName, sponsorEmail, route: value.route, scopeConfirmed: true, privacyBriefConfirmed: true, provisioningRequestId });
}

function inputDigest(input) {
  return createHash("sha256").update(JSON.stringify([input.organizationName, input.sponsorEmail, input.route, input.scopeConfirmed, input.privacyBriefConfirmed])).digest("hex");
}

async function beginReceipt(sourceWorkspaceId, operatorUserId, input, connectionString) {
  return withNeonWorkspaceTransaction(sourceWorkspaceId, async ({ query }) => {
    const digest = inputDigest(input);
    await query(`INSERT INTO app_operations.poc_client_provisioning_receipts (workspace_id,request_id,input_digest,status,created_by_clerk_user_id) VALUES ($1,$2,$3,'pending',$4) ON CONFLICT (workspace_id,request_id) DO NOTHING`, [sourceWorkspaceId, input.provisioningRequestId, digest, operatorUserId]);
    const result = await query(`SELECT request_id,input_digest,status,clerk_organization_id,client_workspace_id,diagnostic_id,clerk_invitation_id FROM app_operations.poc_client_provisioning_receipts WHERE request_id=$1`, [input.provisioningRequestId]);
    if (!result.rows[0] || result.rows[0].input_digest !== digest) throw new ClientProvisioningInputError("This provisioning request belongs to different enrollment details. Reload Platform Operations to begin a new enrollment.");
    return result.rows[0];
  }, connectionString);
}

async function saveReceipt(sourceWorkspaceId, requestId, values, connectionString) {
  return withNeonWorkspaceTransaction(sourceWorkspaceId, ({ query }) => query(`UPDATE app_operations.poc_client_provisioning_receipts SET status=$2,clerk_organization_id=COALESCE($3,clerk_organization_id),client_workspace_id=COALESCE($4,client_workspace_id),diagnostic_id=COALESCE($5,diagnostic_id),clerk_invitation_id=COALESCE($6,clerk_invitation_id),updated_at=now(),completed_at=CASE WHEN $2='completed' THEN now() ELSE NULL END WHERE request_id=$1`, [requestId, values.status, values.organizationId || null, values.workspaceId || null, values.diagnosticId || null, values.invitationId || null]), connectionString);
}

async function findProvisionedOrganization(clerkClient, requestId) {
  const response = await clerkClient.organizations.getOrganizationList({ limit: 100 });
  return (response.data || []).find(value => value.privateMetadata?.provisioningRequestId === requestId) || null;
}

async function findProvisionedDiagnostic(workspaceId, connectionString) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => (await query(`SELECT id,delivery_route AS "route",entitlement_type AS "entitlementType",state FROM app_shared.diagnostics WHERE entitlement_type='poc' ORDER BY created_at LIMIT 1`)).rows[0] || null, connectionString);
}

export async function provisionPocClient({ sourceWorkspaceId, operatorUserId, input, redirectOrigin }, {
  clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY }),
  createDiagnostic = createWorkspaceDiagnostic,
  connectionString
} = {}) {
  const receipt = await beginReceipt(sourceWorkspaceId, operatorUserId, input, connectionString);
  let organization = receipt.clerk_organization_id ? await clerkClient.organizations.getOrganization({ organizationId: receipt.clerk_organization_id }) : await findProvisionedOrganization(clerkClient, input.provisioningRequestId);
  if (!organization) organization = await clerkClient.organizations.createOrganization({ name: input.organizationName, createdBy: operatorUserId, maxAllowedMemberships: 12, privateMetadata: { product: "organizational-capacity", access: "poc", provisioningRequestId: input.provisioningRequestId } });
  await saveReceipt(sourceWorkspaceId, input.provisioningRequestId, { status: "organization-created", organizationId: organization.id }, connectionString);
  let workspaceId = receipt.client_workspace_id || await resolveNeonWorkspaceId(organization.id, connectionString);
  if (!workspaceId) {
    workspaceId = randomUUID();
    await withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
      await query(`INSERT INTO app_identity.workspaces (id,clerk_organization_id,display_label,created_by_clerk_user_id) VALUES ($1,$2,$3,$4)`, [workspaceId, organization.id, input.organizationName, operatorUserId]);
      await query(`INSERT INTO app_operations.audit_events (workspace_id,actor_clerk_user_id,action,target_type,target_id,metadata) VALUES ($1,$2,'workspace.poc-client-provisioned','workspace',$1,$3::jsonb)`, [workspaceId, operatorUserId, JSON.stringify({ organizationId: organization.id, sponsorRole: "org:admin", route: input.route })]);
    }, connectionString);
  }
  await saveReceipt(sourceWorkspaceId, input.provisioningRequestId, { status: "workspace-created", organizationId: organization.id, workspaceId }, connectionString);
  let diagnostic = await findProvisionedDiagnostic(workspaceId, connectionString);
  if (!diagnostic) diagnostic = await createDiagnostic({ workspaceId, actorUserId: operatorUserId, draft: { route: input.route, entitlementType: "poc" } }, connectionString);
  await saveReceipt(sourceWorkspaceId, input.provisioningRequestId, { status: "diagnostic-created", organizationId: organization.id, workspaceId, diagnosticId: diagnostic.id }, connectionString);
  const invitations = await clerkClient.organizations.getOrganizationInvitationList({ organizationId: organization.id, status: ["pending", "accepted"], limit: 100 });
  let invitation = (invitations.data || []).find(value => value.privateMetadata?.provisioningRequestId === input.provisioningRequestId);
  if (!invitation) invitation = await clerkClient.organizations.createOrganizationInvitation({ organizationId: organization.id, inviterUserId: operatorUserId, emailAddress: input.sponsorEmail, role: "org:admin", expiresInDays: 30, redirectUrl: `${redirectOrigin}/workspace/`, privateMetadata: { product: "organizational-capacity", responsibility: "executive-sponsor", provisioningRequestId: input.provisioningRequestId } });
  await saveReceipt(sourceWorkspaceId, input.provisioningRequestId, { status: "completed", organizationId: organization.id, workspaceId, diagnosticId: diagnostic.id, invitationId: invitation.id }, connectionString);
  return Object.freeze({
    organization: Object.freeze({ id: organization.id, name: organization.name }),
    diagnostic,
    sponsorInvitation: Object.freeze({ status: invitation.status || "pending", expiresAt: new Date(invitation.expiresAt).toISOString() }),
    provisioning: Object.freeze({ requestId: input.provisioningRequestId, status: "completed" })
  });
}
