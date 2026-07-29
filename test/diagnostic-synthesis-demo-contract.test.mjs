import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html=await readFile(new URL("../diagnostic-synthesis.html",import.meta.url),"utf8");
const script=await readFile(new URL("../diagnostic-synthesis-demo.js",import.meta.url),"utf8");
const interview=await readFile(new URL("../diagnostic-interview.html",import.meta.url),"utf8");

test("synthesis prototype makes controlled reasoning inspectable without persistence",()=>{
  assert.match(html,/noindex,nofollow/);
  assert.match(html,/Nothing is recorded or saved/);
  assert.match(html,/High-risk material cannot enter synthesis without human disclosure review/);
  assert.match(html,/Competing explanation/);
  assert.match(html,/Known blind spot/);
  assert.match(html,/This is not a causal conclusion/);
  assert.doesNotMatch(script,/fetch\(|localStorage|sessionStorage|indexedDB/);
});

test("synthesis uses governed evidence primitives and continues the interview journey",()=>{
  for(const primitive of ["createDeidentifiedEvidence","reviewDeidentifiedEvidence","createEvidenceTheme","createConstraintHypothesis"])assert.match(script,new RegExp(primitive));
  assert.match(script,/disclosureRisk==="high"\?"human":"automated"/);
  assert.match(script,/weakeningEvidenceIds/);
  assert.match(interview,/href="diagnostic-synthesis.html"/);
});
