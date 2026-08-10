import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = file => readFile(new URL(`../${file}`, import.meta.url), "utf8");

test("public assessment loads v2 while preserving explicit legacy entry paths", async () => {
  const [html, app] = await Promise.all([
    source("assessment.html"),
    source("capacity-signal-assessment-app.js")
  ]);

  assert.match(html, /capacity-signal-assessment-app\.js/);
  assert.match(app, /parameters\.has\("workspaceRound"\)/);
  assert.match(app, /#recovery=v1\./);
  assert.match(app, /Capacity Signal Brief—not a score or diagnosis/);
  assert.match(app, /signal-priority-field/);
  assert.match(app, /signal-context-selects/);
  assert.match(app, /Focus on what must become true/);
  assert.match(html, /capacity-signal-v4/);
});

test("local preview serves the same Capacity Signal Assessment assets as the published site", async () => {
  const server = await source("scripts/workspace-dev-server.mjs");
  assert.match(server, /\/capacity-signal-assessment-app\.js/);
  assert.match(server, /\/capacity-signal-assessment-engine\.js/);
});

test("public Capacity Signal Brief exposes uncertainty without scorecard output", async () => {
  const app = await source("capacity-signal-assessment-app.js");
  assert.match(app, /Similar signals can have different causes/);
  assert.match(app, /They are not five independent scores/);
  assert.match(app, /does not measure Organizational Capacity/);
  assert.doesNotMatch(app, /data-overall-score|domain-score-track|primaryConstraintIds/);
});

test("private saved v2 brief is no-indexed and remains separate from legacy results", async () => {
  const [html, script, robots] = await Promise.all([
    source("saved-capacity-signal.html"),
    source("saved-capacity-signal.js"),
    source("robots.txt")
  ]);
  assert.match(html, /noindex,nofollow,noarchive/);
  assert.match(html, /not individual answers/);
  assert.match(script, /schemaVersion !== "2\.0\.0"/);
  assert.match(robots, /Disallow: \/saved-capacity-signal\.html/);
});
