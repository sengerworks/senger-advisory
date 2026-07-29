import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const root = new URL("../", import.meta.url);
const source = path => readFile(new URL(path, root), "utf8");

test("interview prototype uses governed protocol and confidential interview engines", async () => {
  const [html, script] = await Promise.all([source("diagnostic-interview.html"), source("diagnostic-interview-demo.js")]);
  assert.match(html, /noindex,nofollow/);
  assert.match(html, /One governed method\. Fifteen contextual questions/);
  assert.match(html, /Nothing is recorded or saved/);
  assert.match(script, /createDiagnosticProtocol/);
  assert.match(script, /approveDiagnosticProtocol/);
  assert.match(script, /createDiagnosticInterview/);
  assert.match(script, /saveCoreAnswer/);
  assert.match(script, /submitDiagnosticInterview/);
  assert.doesNotMatch(script, /fetch\(|localStorage|sessionStorage|indexedDB/);
});

test("participant notice, bounded probing, and evidence-quality gate remain explicit", async () => {
  const [html, script] = await Promise.all([source("diagnostic-interview.html"), source("diagnostic-interview-demo.js")]);
  assert.match(html, /Your perspective will inform an organizational finding—not an individual evaluation/);
  assert.match(html, /The sponsor cannot see/);
  assert.match(html, /Show a governed follow-up/);
  assert.match(script, /createAdaptiveFollowUp/);
  assert.match(script, /saveFollowUpAnswer/);
  assert.match(script, /evaluateInterviewEvidence/);
  assert.match(html, /ready for de-identification/);
});
