import test from "node:test";
import assert from "node:assert/strict";
import { createWorkspaceDiagnosticProtocolSponsorReviewV2Handler } from "../netlify/functions/workspace-diagnostic-protocol-sponsor-review-v2.mjs";
import { validateSponsorProtocolReviewV2 } from "../netlify/lib/workspace-diagnostic-protocol-governance-v2.mjs";
import { WORKSPACE_ROLES } from "../workspace-authorization.js";

const workspaceId="11111111-1111-4111-8111-111111111111",diagnosticId="22222222-2222-4222-8222-222222222222";
const questions=Array.from({length:18},(_,index)=>Object.freeze({templateId:`template-${index+1}`,questionText:`Question ${index+1}: Describe the observable work pattern and its effect on execution.`,contextualizationNote:"Approved-frame context.",mechanismIds:[],evidenceLayerId:"observable-pattern"}));
const review={diagnosticId,questions:questions.map(({templateId,questionText})=>({templateId,questionText})),questionReviews:questions.map(({templateId,questionText})=>({templateId,originalQuestion:questionText,revisions:[],status:"approved"})),approvalNote:"I reviewed all 18 questions and confirm they are appropriate for confidential participation."};
const auth=role=>async()=>({ok:true,value:{workspaceId,userId:"sponsor-user",role}});
const request=(method="GET",body)=>new Request(`https://example.com/api/workspace/diagnostic-protocol-sponsor-review-v2?diagnosticId=${diagnosticId}`,{method,headers:{origin:"https://example.com",...(body?{"content-type":"application/json"}:{})},body:body?JSON.stringify(body):undefined});

test("sponsor approves the exact complete 18-question protocol",async()=>{
  assert.equal(validateSponsorProtocolReviewV2(review,questions).questions.length,18);
  let received;
  const handler=createWorkspaceDiagnosticProtocolSponsorReviewV2Handler({authenticate:auth(WORKSPACE_ROLES.owner),getReview:async()=>({state:"sponsor-review",protocol:{questions}}),approveReview:async value=>{received=value;return{state:"awaiting-steward-finalization",protocol:{questions}};}});
  assert.equal((await handler(request())).status,200);
  assert.equal((await handler(request("POST",review))).status,201);
  assert.equal(received.input.questions.length,18);
});

test("participants cannot inspect or alter sponsor protocol governance",async()=>{
  const handler=createWorkspaceDiagnosticProtocolSponsorReviewV2Handler({authenticate:auth(WORKSPACE_ROLES.participant)});
  assert.equal((await handler(request())).status,403);
  assert.equal((await handler(request("POST",review))).status,403);
});

test("sponsor cannot remove, add, or freely edit questions",()=>{
  assert.throws(()=>validateSponsorProtocolReviewV2({...review,questions:review.questions.slice(0,17)},questions),/preserve all 18/);
  const edited=review.questions.map((question,index)=>index?question:{...question,questionText:"Sponsor-authored replacement question that bypasses governed reframing."});
  assert.throws(()=>validateSponsorProtocolReviewV2({...review,questions:edited},questions),/does not match/);
});
