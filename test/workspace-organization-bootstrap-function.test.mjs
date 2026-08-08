import test from "node:test";
import assert from "node:assert/strict";
import { createWorkspaceOrganizationBootstrapHandler } from "../netlify/functions/workspace-organization-bootstrap.mjs";

const organizationId = "org_3GvMdF930IYdXd1dKyYpZkN6FR5";
const userId = "user_3GvTwF8BjbN1GO2xIjfpbrUa2lx";

function request(method = "GET", origin = "https://example.com") {
  return new Request("https://example.com/api/workspace/organization-bootstrap", {
    method,
    headers: origin ? { origin } : {}
  });
}

function authenticated(memberships) {
  return async () => ({
    userId,
    clerkClient: {
      users: {
        getOrganizationMembershipList: async () => ({
          data: memberships,
          totalCount: memberships.length
        })
      }
    }
  });
}

test("returns only one server-verified mapped organization ID", async () => {
  const handler = createWorkspaceOrganizationBootstrapHandler({
    authenticate: authenticated([{ organization: { id: organizationId } }]),
    resolveWorkspace: async id => id === organizationId ? "11111111-1111-4111-8111-111111111111" : null
  });
  const response = await handler(request());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { organization: organizationId });
});

test("rejects signed-out, ambiguous, unmapped, cross-origin, and unsupported requests", async () => {
  const signedOut = createWorkspaceOrganizationBootstrapHandler({ authenticate: async () => null });
  assert.equal((await signedOut(request())).status, 401);

  const ambiguous = createWorkspaceOrganizationBootstrapHandler({ authenticate: authenticated([]) });
  assert.equal((await ambiguous(request())).status, 403);

  const unmapped = createWorkspaceOrganizationBootstrapHandler({
    authenticate: authenticated([{ organization: { id: organizationId } }]),
    resolveWorkspace: async () => null
  });
  assert.equal((await unmapped(request())).status, 403);
  assert.equal((await unmapped(request("GET", "https://attacker.example"))).status, 403);
  assert.equal((await unmapped(request("POST"))).status, 405);
});
