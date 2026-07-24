import test from "node:test";
import assert from "node:assert/strict";
import {
  createWorkspaceConfigHandler,
  frontendApiFromPublishableKey
} from "../netlify/functions/workspace-config.mjs";

const frontendApi = "example.clerk.accounts.dev";
const publishableKey = `pk_test_${Buffer.from(`${frontendApi}$`).toString("base64")}`;

function request(method = "GET", origin = "https://example.com") {
  return new Request("https://example.com/api/workspace/config", {
    method,
    headers: origin ? { origin } : {}
  });
}

test("derives and validates the Clerk frontend API host", () => {
  assert.equal(frontendApiFromPublishableKey(publishableKey), frontendApi);
  assert.throws(() => frontendApiFromPublishableKey("pk_test_invalid"), /invalid/);
  assert.throws(() => frontendApiFromPublishableKey(""), /not configured/);
});

test("returns only public version-pinned browser configuration", async () => {
  const handler = createWorkspaceConfigHandler({ publishableKey });
  const response = await handler(request());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    publishableKey,
    clerkUiUrl: `https://${frontendApi}/npm/@clerk/ui@1/dist/ui.browser.js`,
    clerkJsUrl: `https://${frontendApi}/npm/@clerk/clerk-js@6.25.6/dist/clerk.browser.js`
  });
});

test("workspace configuration rejects methods, foreign origins, and missing configuration", async () => {
  const handler = createWorkspaceConfigHandler({ publishableKey });
  assert.equal((await handler(request("POST"))).status, 405);
  assert.equal((await handler(request("GET", "https://attacker.example"))).status, 403);
  assert.equal((await createWorkspaceConfigHandler({ publishableKey: "" })(request())).status, 503);
});
