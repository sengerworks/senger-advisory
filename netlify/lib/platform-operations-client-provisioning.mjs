import { randomUUID } from "node:crypto";
import { createClerkClient } from "@clerk/backend";
import { withNeonWorkspaceTransaction } from "./neon-workspace-database.mjs";
import { createWorkspaceDiagnostic } from "./workspace-diagnostics.mjs";

export class ClientProvisioningInputError extends Error {}

export function validateClientProvisioning(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).sort().join(",") !== "organizationName,route,sponsorEmail") throw new ClientProvisioningInputError("Submit the organization, sponsor, and diagnostic route.");
  const organizationName = String(value.organizationName || "").trim();
  const sponsorEmail = String(value.sponsorEmail || "").trim().toLowerCase();
  if (organizationName.length < 2 || organizationName.length > 120) throw new ClientProvisioningInputError("Organization name must be 2 to 120 characters.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sponsorEmail) || sponsorEmail.length > 254) throw new ClientProvisioningInputError("Enter a valid sponsor email address.");
  if (!["automated", "advisor-led"].includes(value.route)) throw new ClientProvisioningInputError("Choose a valid diagnostic route.");
  return Object.freeze({ organizationName, sponsorEmail, route: value.route });
}

export async function provisionPocClient({ operatorUserId, input, redirectOrigin }, {
  clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY }),
  createDiagnostic = createWorkspaceDiagnostic,
  connectionString
} = {}) {
  const organization = await clerkClient.organizations.createOrganization({
    name: input.organizationName,
    createdBy: operatorUserId,
    // Operator + sponsor + ten POC participants. Full-diagnostic activation expands this limit.
    maxAllowedMemberships: 12,
    privateMetadata: { product: "organizational-capacity", access: "poc" }
  });
  const workspaceId = randomUUID();
  await withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    await query(`INSERT INTO app_identity.workspaces (id,clerk_organization_id,display_label,created_by_clerk_user_id) VALUES ($1,$2,$3,$4)`, [workspaceId, organization.id, input.organizationName, operatorUserId]);
    await query(`INSERT INTO app_operations.audit_events (workspace_id,actor_clerk_user_id,action,target_type,target_id,metadata) VALUES ($1,$2,'workspace.poc-client-provisioned','workspace',$1,$3::jsonb)`, [workspaceId, operatorUserId, JSON.stringify({ organizationId: organization.id, sponsorRole: "org:admin", route: input.route })]);
  }, connectionString);
  const diagnostic = await createDiagnostic({ workspaceId, actorUserId: operatorUserId, draft: { route: input.route, entitlementType: "poc" } }, connectionString);
  const invitation = await clerkClient.organizations.createOrganizationInvitation({
    organizationId: organization.id,
    inviterUserId: operatorUserId,
    emailAddress: input.sponsorEmail,
    role: "org:admin",
    expiresInDays: 30,
    redirectUrl: `${redirectOrigin}/workspace/`,
    privateMetadata: { product: "organizational-capacity", responsibility: "executive-sponsor" }
  });
  return Object.freeze({
    organization: Object.freeze({ id: organization.id, name: organization.name }),
    diagnostic,
    sponsorInvitation: Object.freeze({ status: invitation.status || "pending", expiresAt: new Date(invitation.expiresAt).toISOString() })
  });
}
