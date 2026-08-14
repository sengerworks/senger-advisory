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

test("public navigation features the Platform Journey while assessment retains its organizational demo", async () => {
  const [home, journey, journeyScript, assessment, sitemap] = await Promise.all([
    source("index.html"),
    source("platform-journey.html"),
    source("platform-journey.js"),
    source("assessment.html"),
    source("sitemap.xml")
  ]);
  assert.match(home, /href="platform-journey\.html">Platform Journey/);
  assert.match(journey, /approximately 5 minutes/);
  assert.match(journey, /Start the Journey/);
  assert.match(journey, /Jump to the Capacity Operating Brief/);
  assert.match(journey, /Request a Guided Walkthrough/);
  assert.equal((journeyScript.match(/title:"[^"]+",steps:/g)||[]).length,5);
  assert.match(journeyScript, /Step \$\{current\+1\} of \$\{flatSteps\.length\}/);
  assert.match(journeyScript, /Sponsor/);
  assert.match(journeyScript, /Platform/);
  assert.match(journey, /Why it matters/);
  assert.match(assessment, /href="organization-view\.html">View organizational demo/);
  assert.match(sitemap, /https:\/\/sengeradvisory\.com\/platform-journey\.html/);
});

test("Platform Journey uses the centered public-page content frame", async () => {
  const styles = await readFile(new URL("../platform-journey.css", import.meta.url), "utf8");
  assert.match(styles, /\.platform-journey-page \.demo-main\s*\{[^}]*width:\s*min\(1240px,calc\(100% - 40px\)\);[^}]*margin:\s*0 auto;/);
});
