import test from "node:test";
import assert from "node:assert/strict";
import { createPlatformOperationsAdvisorAssignmentsHandler } from "../netlify/functions/platform-operations-advisor-assignments.mjs";
import { PlatformAdvisorAssignmentInputError, validatePlatformAdvisorAssignment } from "../netlify/lib/platform-operations-advisor-assignments.mjs";

const diagnosticId="22222222-2222-4222-8222-222222222222",assignmentId="33333333-3333-4333-8333-333333333333";
const auth=async()=>({ok:true,value:{workspaceId:"11111111-1111-4111-8111-111111111111",userId:"user_operator",authority:"platform-operator"}});
const req=(method="GET",body)=>new Request("https://example.com/api/operations/advisor-assignments",{method,headers:{origin:"https://example.com",...(body?{"content-type":"application/json"}:{})},body:body?JSON.stringify(body):undefined});

test("validates bounded advisor assignments and explicit revocations",()=>{
  const assign=validatePlatformAdvisorAssignment({action:"assign",diagnosticId,advisorClerkUserId:"user_advisor123",purpose:"Review protected evidence for this diagnostic engagement.",durationDays:7});
  assert.equal(assign.durationDays,7);
  assert.equal(validatePlatformAdvisorAssignment({action:"revoke",diagnosticId,assignmentId,reason:"The bounded evidence-review engagement has concluded."}).action,"revoke");
  assert.throws(()=>validatePlatformAdvisorAssignment({...assign,durationDays:31}),PlatformAdvisorAssignmentInputError);
});

test("platform handler lists and changes assignments under operator authority",async()=>{
  let changed;
  const handler=createPlatformOperationsAdvisorAssignmentsHandler({authenticate:auth,list:async()=>[],change:async value=>(changed=value,{assignmentId})});
  assert.equal((await handler(req())).status,200);
  const response=await handler(req("POST",{action:"assign",diagnosticId,advisorClerkUserId:"user_advisor123",purpose:"Review protected evidence for this diagnostic engagement.",durationDays:7}));
  assert.equal(response.status,201);
  assert.equal(changed.actorUserId,"user_operator");
});
