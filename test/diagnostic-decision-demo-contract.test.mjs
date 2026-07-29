import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html=await readFile(new URL("../diagnostic-decision.html",import.meta.url),"utf8");const script=await readFile(new URL("../diagnostic-decision-demo.js",import.meta.url),"utf8");const synthesis=await readFile(new URL("../diagnostic-synthesis.html",import.meta.url),"utf8");
test("decision prototype requires leadership validation before intervention",()=>{assert.match(html,/Material objections must be resolved/);assert.match(html,/Preserve information readiness as a competing explanation/);assert.match(script,/createLeadershipValidation/);assert.match(script,/decideLeadershipValidation/);assert.match(script,/validateDiagnosticRecord/);assert.ok(script.indexOf("validateDiagnosticRecord")<script.indexOf("createInterventionProposal(record"));assert.match(synthesis,/href="diagnostic-decision.html"/)});
test("commercial acceptance and entitlement remain explicit activation gates",()=>{assert.match(html,/payment provider will own transaction details/);assert.match(html,/data-accept-scope/);assert.match(html,/data-accept-terms/);assert.match(html,/data-entitlement/);assert.match(script,/acceptInterventionProposal/);assert.doesNotMatch(script,/fetch\(|localStorage|sessionStorage|indexedDB/)});
