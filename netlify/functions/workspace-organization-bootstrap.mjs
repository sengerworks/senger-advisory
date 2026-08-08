import { createClerkClient } from "@clerk/backend";
import { configuredAuthorizedParties } from "../lib/clerk-workspace-auth.mjs";
import { resolveNeonWorkspaceId } from "../lib/neon-workspace-database.mjs";

const headers = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff"
};

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers });
}

async function authenticateUser(request) {
  const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  const requestState = await clerkClient.authenticateRequest(request, {
    acceptsToken: "session_token",
    authorizedParties: configuredAuthorizedParties(),
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY
  });
  if (!requestState.isAuthenticated) return null;
  const auth = requestState.toAuth();
  return { userId: auth.userId, clerkClient };
}

export function createWorkspaceOrganizationBootstrapHandler({
  authenticate = authenticateUser,
  resolveWorkspace = resolveNeonWorkspaceId
} = {}) {
  return async request => {
    if (request.method !== "GET") return json(405, { error: "Method not allowed." });
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return json(403, { error: "Origin not allowed." });
    }

    try {
      const authenticated = await authenticate(request);
      if (!authenticated) {
        console.info("Workspace organization bootstrap stage: unauthenticated");
        return json(401, { error: "Workspace access unavailable." });
      }
      const response = await authenticated.clerkClient.users.getOrganizationMembershipList({
        userId: authenticated.userId,
        limit: 2
      });
      const memberships = response?.data || [];
      if (response?.totalCount !== 1 || memberships.length !== 1) {
        console.info("Workspace organization bootstrap stage: membership-count-unavailable");
        return json(403, { error: "One active organization membership is required." });
      }
      const organizationId = memberships[0].organization?.id;
      if (!organizationId) {
        console.info("Workspace organization bootstrap stage: membership-organization-unavailable");
        return json(403, { error: "Workspace access unavailable." });
      }
      if (!(await resolveWorkspace(organizationId))) {
        console.info("Workspace organization bootstrap stage: workspace-unmapped");
        return json(403, { error: "Workspace access unavailable." });
      }
      console.info("Workspace organization bootstrap stage: ready");
      return json(200, { organization: organizationId });
    } catch (error) {
      console.error("Workspace organization bootstrap failed", error instanceof Error ? error.message : "Unknown error");
      return json(503, { error: "Workspace organization activation is temporarily unavailable." });
    }
  };
}

export default createWorkspaceOrganizationBootstrapHandler();

export const config = {
  path: "/api/workspace/organization-bootstrap",
  rateLimit: {
    windowLimit: 30,
    windowSize: 60,
    aggregateBy: ["ip", "domain"]
  }
};
