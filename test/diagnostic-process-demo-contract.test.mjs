import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const root = new URL("../", import.meta.url);
const source = path => readFile(new URL(path, root), "utf8");

test("diagnostic process prototype uses governed discovery without persistence", async () => {
  const [html, script] = await Promise.all([source("diagnostic-process.html"), source("diagnostic-process-demo.js")]);
  assert.match(html, /noindex,nofollow/);
  assert.match(html, /Begin with context, not a questionnaire/);
  assert.match(html, /Entries disappear on refresh/);
  assert.match(script, /createDiagnosticContextBrief/);
  assert.match(script, /approveDiagnosticContextBrief/);
  assert.match(script, /createParticipantPlan/);
  assert.match(script, /evaluatePerspectiveCoverage/);
  assert.match(script, /approveParticipantPlan/);
  assert.doesNotMatch(script, /fetch\(|localStorage|sessionStorage|indexedDB/);
});

test("participant design separates identity and makes coverage gaps explicit", async () => {
  const [html, script] = await Promise.all([source("diagnostic-process.html"), source("diagnostic-process-demo.js")]);
  assert.match(html, /identity-free perspective slots/);
  assert.match(html, /Names, emails, invitations, and response content belong in separate platform boundaries/);
  assert.match(html, /Coverage gaps/);
  assert.match(html, /Accept documented gaps/);
  assert.match(script, /acceptPerspectiveGap/);
  assert.doesNotMatch(html, /name="(?:participantName|participantEmail|email)"/);
});
