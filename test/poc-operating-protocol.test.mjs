import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const read=name=>readFile(new URL(`../docs/${name}`,import.meta.url),"utf8");

test("POC protocol governs one diagnostic cycle and preserves the paid intervention boundary",async()=>{
  const protocol=await read("POC-Operating-Protocol.md");
  for(const requirement of ["not a demo","Confidential participation","Evidence preparation and synthesis","Leadership validation and Intervention Directions","paid activation","S0 — Safety or confidentiality","Change-control rule","Launch-readiness thresholds","Ready to monetize"])assert.match(protocol,new RegExp(requirement));
  assert.doesNotMatch(protocol,/### 6\. Operate, review, and reassess/);
  assert.match(protocol,/zero unresolved S0 issues/);
  assert.match(protocol,/willingness to pay/i);
  assert.match(protocol,/Never weaken a confidentiality control/);
});

test("POC scorecard excludes participant content and measures commercial evidence",async()=>{
  const scorecard=await read("POC-Scorecard.md");
  assert.match(scorecard,/without participant interview content\s+or identity/);
  assert.match(scorecard,/Participation and trust/);
  assert.match(scorecard,/Method and finding quality/);
  assert.match(scorecard,/Commercial evidence/);
  assert.match(scorecard,/Cohort decision/);
});
