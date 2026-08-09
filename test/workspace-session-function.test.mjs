import test from "node:test";
import assert from "node:assert/strict";
import { createWorkspaceSessionHandler } from "../netlify/functions/workspace-session.mjs";
import {
  authenticateWorkspaceRequest,
  authorizedPartiesForRequest,
  configuredAuthorizedParties
} from "../netlify/lib/clerk-workspace-auth.mjs";
import { WORKSPACE_ROLES } from "../workspace-authorization.js";

function request(method = "GET", origin = "https://example.com") {
  return new Request("https://example.com/api/workspace/session", {
    method,
    headers: origin ? { origin } : {}
  });
}

function clerkState(auth) {
  return {
    isAuthenticated: Boolean(auth),
    toAuth: () => auth
  };
}

test("requires explicit valid Clerk authorized parties", () => {
  assert.deepEqual(
    configuredAuthorizedParties("http://localhost:8888,https://sengeradvisory.com"),
    ["http://localhost:8888", "https://sengeradvisory.com"]
  );
  assert.throws(() => configuredAuthorizedParties(""), /explicit comma-separated origins/);
  assert.throws(() => configuredAuthorizedParties("sengeradvisory.com"), /explicit comma-separated origins/);
  assert.deepEqual(
    configuredAuthorizedParties(
      "https://sengeradvisory.com",
      ["https://deploy-preview-2--senger-advisory.netlify.app", "https://sengeradvisory.com"]
    ),
    ["https://sengeradvisory.com", "https://deploy-preview-2--senger-advisory.netlify.app"]
  );
});

test("authorizes only the exact Senger Advisory Netlify preview origin", () => {
  const configured = ["http://localhost:8888", "https://sengeradvisory.com"];
  assert.deepEqual(
    authorizedPartiesForRequest(
      new Request("https://deploy-preview-2--senger-advisory.netlify.app/api/workspace/session"),
      configured
    ),
    [...configured, "https://deploy-preview-2--senger-advisory.netlify.app"]
  );
  assert.deepEqual(
    authorizedPartiesForRequest(
      new Request("https://deploy-preview-2--other-site.netlify.app/api/workspace/session"),
      configured
    ),
    configured
  );
});

test("rejects signed-out, personal-account, unknown-role, and unmapped sessions", async () => {
  const baseOptions = {
    authorizedParties: ["https://example.com"],
    resolveWorkspaceId: async () => "11111111-1111-4111-8111-111111111111"
  };

  for (const auth of [
    null,
    { userId: "user_1", orgId: null, orgRole: null },
    { userId: "user_1", orgId: "org_alpha", orgRole: "org:member" }
  ]) {
    const result = await authenticateWorkspaceRequest(request(), {
      ...baseOptions,
      clerkClient: { authenticateRequest: async () => clerkState(auth) }
    });
    assert.equal(result.ok, false);
  }

  const unmapped = await authenticateWorkspaceRequest(request(), {
    ...baseOptions,
    clerkClient: {
      authenticateRequest: async () => clerkState({
        userId: "user_1",
        orgId: "org_alpha",
        orgRole: WORKSPACE_ROLES.participant
      })
    },
    resolveWorkspaceId: async () => null
  });
  assert.deepEqual(unmapped, { ok: false, status: 403, reason: "workspace-mapping" });

  const signedOut = await authenticateWorkspaceRequest(request(), {
    ...baseOptions,
    clerkClient: {
      authenticateRequest: async () => ({
        isAuthenticated: false,
        reason: "token-invalid"
      })
    }
  });
  assert.deepEqual(signedOut, { ok: false, status: 401, reason: "clerk-token-invalid" });
});

test("returns minimized session state for an authorized mapped workspace", async () => {
  const handler = createWorkspaceSessionHandler({
    authenticate: async () => ({
      ok: true,
      value: {
        role: WORKSPACE_ROLES.facilitator,
        workspaceId: "11111111-1111-4111-8111-111111111111"
      }
    })
  });
  const response = await handler(request());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    authenticated: true,
    workspaceReady: true,
    role: WORKSPACE_ROLES.facilitator
  });
});

test("workspace session endpoint rejects methods, cross-origin requests, and auth failures", async () => {
  const handler = createWorkspaceSessionHandler({
    authenticate: async () => ({ ok: false, status: 401, reason: "sign-in" })
  });
  assert.equal((await handler(request("POST"))).status, 405);
  assert.equal((await handler(request("GET", "https://attacker.example"))).status, 403);
  assert.equal((await handler(request())).status, 401);
});
