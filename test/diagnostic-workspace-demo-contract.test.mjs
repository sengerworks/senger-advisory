import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const source = path => readFile(new URL(path, root), "utf8");

test("diagnostic workspace prototype is a no-index fictional Capacity Operating Brief", async () => {
  const [html, script] = await Promise.all([
    source("diagnostic-workspace.html"),
    source("diagnostic-workspace-demo.js")
  ]);
  assert.match(html, /noindex,nofollow/);
  assert.match(html, /Capacity Operating Brief/);
  assert.match(html, /executive decision brief—not a performance dashboard/);
  assert.match(html, /What did we diagnose/);
  assert.match(html, /Why do we believe it/);
  assert.match(html, /What did we decide/);
  assert.match(html, /What should change now/);
  assert.match(html, /What needs attention/);
  assert.match(html, /What happens next/);
  assert.match(html, /No client data/);
  assert.doesNotMatch(script, /fetch\(|localStorage|sessionStorage|indexedDB/);
});

test("automated and advisor-led routes share one client record and three evidence classes", async () => {
  const [html, script] = await Promise.all([
    source("diagnostic-workspace.html"),
    source("diagnostic-workspace-demo.js")
  ]);
  assert.match(html, /One workspace · Two delivery routes/);
  assert.match(html, /data-delivery-route="automated"/);
  assert.match(html, /data-delivery-route="advisor-led"/);
  assert.match(script, /same validated diagnostic record/);
  assert.match(html, />Delivery</);
  assert.match(html, />Operating change</);
  assert.match(html, />Capacity change</);
  assert.match(html, /Reassessment is scheduled/);
});
