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

export function authorizedPartiesForRequest(request, configured = configuredAuthorizedParties()) {
  const candidates = [
    new URL(request.url).origin,
    request.headers.get("origin"),
    request.headers.get("referer")
  ].flatMap(value => {
    try {
      return value ? [new URL(value).origin] : [];
    } catch {
      return [];
    }
  });
  return candidates.reduce((parties, origin) => {
    const hostname = new URL(origin).hostname;
    const isSengerAdvisoryPreview = /^(?:deploy-preview-\d+|[a-f0-9]+)--senger-advisory\.netlify\.app$/.test(hostname);
    return isSengerAdvisoryPreview && !parties.includes(origin) ? [...parties, origin] : parties;
  }, configured);
}

export async function authenticateWorkspaceRequest(
  request,
  {
    clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY }),
    authorizedParties = null,
    resolveWorkspaceId = resolveNeonWorkspaceId
  } = {}
) {
  const requestState = await clerkClient.authenticateRequest(request, {
    acceptsToken: "session_token",
    authorizedParties: authorizedParties || authorizedPartiesForRequest(request),
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY
  });
  if (!requestState.isAuthenticated) {
    const clerkReason = String(requestState.reason || "sign-in")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .slice(0, 80);
    console.info(`Workspace authentication stage: ${clerkReason}`);
    return { ok: false, status: 401, reason: `clerk-${clerkReason}` };
  }

  const auth = requestState.toAuth();
  if (!auth.orgId) return { ok: false, status: 403, reason: "organization-context" };
  if (!allowedRoles.has(auth.orgRole)) return { ok: false, status: 403, reason: "organization-role" };

  const workspaceId = await resolveWorkspaceId(auth.orgId);
  if (!workspaceId) return { ok: false, status: 403, reason: "workspace-mapping" };

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
