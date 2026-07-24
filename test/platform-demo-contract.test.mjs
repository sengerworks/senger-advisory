import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const source = path => readFile(new URL(path, root), "utf8");

test("public demo walks from private perspectives to a shared action cycle", async () => {
  const [html, script] = await Promise.all([
    source("organization-view.html"),
    source("organization-view.js")
  ]);
  assert.match(html, /Organizational Capacity Platform · Interactive Demo/);
  assert.match(html, /Fictional demonstration/);
  assert.match(html, /Organizational results remain hidden/);
  assert.match(html, /Turn the signal into a testable commitment/);
  assert.match(html, /Demo entries stay in this browser and are not stored/);
  assert.match(html, /Discuss your organization/);
  assert.match(html, /Save fictional review/);
  assert.match(html, /Linked Reassessment/);
  assert.match(html, /What changed between observations/);
  assert.match(script, /aggregateOrganization/);
  assert.match(script, /result\.policy === "aggregate"/);
  assert.match(script, /elements\.actionCard\.hidden = false/);
  assert.match(script, /Latest review:/);
  assert.match(script, /compareOrganizationRounds/);
  assert.match(script, /No follow-up scores are shown/);
  assert.doesNotMatch(script, /fetch\(|localStorage|sessionStorage/);
});

test("homepage and sitemap expose the platform demo", async () => {
  const [home, sitemap] = await Promise.all([
    source("index.html"),
    source("sitemap.xml")
  ]);
  assert.match(home, /href="organization-view\.html">Platform Demo/);
  assert.match(sitemap, /https:\/\/sengeradvisory\.com\/organization-view\.html/);
});
