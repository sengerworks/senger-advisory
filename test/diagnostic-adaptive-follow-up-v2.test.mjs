import test from "node:test";
import assert from "node:assert/strict";
import { adaptiveFollowUpPolicyV2, planAdaptiveFollowUpsV2 } from "../diagnostic-adaptive-follow-up-v2.js";

const protocol=Object.freeze({protocolId:"protocol-v2",status:"approved",questions:Object.freeze(Array.from({length:4},(_,index)=>Object.freeze({questionId:`q-0${index+1}`})))});
const answers=protocol.questions.map((question,index)=>({questionId:question.questionId,answerText:index===3?"Leaders described the operating choice in broad terms without considering a competing interpretation.":"Work is difficult and coordination could be better across the organization."}));

test("plans no more than three nonrepeating governed clarifications",()=>{
  const original=JSON.stringify(protocol.questions);
  const followUps=planAdaptiveFollowUpsV2({protocol,interviewInstanceId:"interview-v2",answers},{id:index=>`follow-up-${index+1}`,now:new Date("2026-08-08T12:00:00.000Z")});
  assert.equal(followUps.length,3);
  assert.equal(new Set(followUps.map(item=>item.questionId)).size,3);
  assert.deepEqual(followUps.map(item=>item.promptType),["example","consequence","alternative-explanation"]);
  assert.equal(JSON.stringify(protocol.questions),original);
  assert.equal(adaptiveFollowUpPolicyV2.coreProtocolMutable,false);
});

test("reuses the encrypted clarification plan instead of generating more prompts",()=>{
  const existing=planAdaptiveFollowUpsV2({protocol,interviewInstanceId:"interview-v2",answers},{id:index=>`follow-up-${index+1}`});
  assert.deepEqual(planAdaptiveFollowUpsV2({protocol,interviewInstanceId:"interview-v2",answers,existingFollowUps:existing}),existing);
});
