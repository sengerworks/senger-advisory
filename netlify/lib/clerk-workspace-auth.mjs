import { createClerkClient } from "@clerk/backend";
import { WORKSPACE_ROLES } from "../../workspace-authorization.js";
import { resolveNeonWorkspaceId } from "./neon-workspace-database.mjs";

const allowedRoles = new Set(Object.values(WORKSPACE_ROLES));

export function configuredAuthorizedParties(
  value = process.env.CLERK_AUTHORIZED_PARTIES,
  deploymentOrigins = [process.env.DEPLOY_PRIME_URL, process.env.URL]
) {
  const parties = [...String(value || "").split(","), ...deploymentOrigins]
    .map((party) => String(party || "").trim())
    .filter(Boolean)
    .filter((party, index, values) => values.indexOf(party) === index);
  if (parties.length === 0 || parties.some((party) => {
    try {
      return new URL(party).origin !== party;
    } catch {
      return true;
    }
  })) {
    throw new Error("CLERK_AUTHORIZED_PARTIES must contain explicit comma-separated origins.");
  }
  return parties;
}

export async function authenticateWorkspaceRequest(
  request,
  {
    clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY }),
    authorizedParties = configuredAuthorizedParties(),
    resolveWorkspaceId = resolveNeonWorkspaceId
  } = {}
) {
  const requestState = await clerkClient.authenticateRequest(request, {
    acceptsToken: "session_token",
    authorizedParties,
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY
  });
  if (!requestState.isAuthenticated) return { ok: false, status: 401 };

  const auth = requestState.toAuth();
  if (!auth.orgId || !allowedRoles.has(auth.orgRole)) {
    return { ok: false, status: 403 };
  }

  const workspaceId = await resolveWorkspaceId(auth.orgId);
  if (!workspaceId) return { ok: false, status: 403 };

  return {
    ok: true,
    value: Object.freeze({
      userId: auth.userId,
      organizationId: auth.orgId,
      role: auth.orgRole,
      workspaceId
    })
  };
}
