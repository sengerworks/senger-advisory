import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("workspace is private-indexed and presents the threshold privacy contract", async () => {
  const html = await source("workspace/index.html");
  assert.match(html, /name="robots" content="noindex, nofollow"/);
  assert.match(html, /Individual scores are never shown to workspace roles/);
  assert.match(html, /Results remain suppressed below five valid submissions/);
  assert.match(html, /Workspace participation is separate from research consent/);
});

test("workspace browser uses server configuration and minimized session endpoints", async () => {
  const script = await source("workspace/workspace.js");
  assert.match(script, /fetch\("\/api\/workspace\/config"/);
  assert.match(script, /fetch\("\/api\/workspace\/session"/);
  assert.doesNotMatch(script, /CLERK_SECRET_KEY|NEON_DATABASE_URL|workspaceId|organizationId|userId/);
});

test("workspace authentication always returns to the workspace route", async () => {
  const script = await source("workspace/workspace.js");
  assert.match(script, /forceRedirectUrl:\s*"\/workspace\/"/);
  assert.match(script, /signUpForceRedirectUrl:\s*"\/workspace\/"/);
  assert.doesNotMatch(script, /afterSignInUrl|afterSignUpUrl/);
});

test("workspace has a route-only Clerk CSP and authentication return fallback", async () => {
  const config = await source("netlify.toml");
  assert.match(config, /for = "\/workspace\/\*"/);
  assert.match(config, /https:\/\/\*\.clerk\.accounts\.dev/);
  assert.match(config, /https:\/\/challenges\.cloudflare\.com/);
  assert.match(config, /from = "\/workspace\/\*"\s+to = "\/workspace\/index\.html"\s+status = 200/);
});

test("workspace remains excluded from search crawling", async () => {
  const robots = await source("robots.txt");
  assert.match(robots, /Disallow: \/workspace\//);
});
