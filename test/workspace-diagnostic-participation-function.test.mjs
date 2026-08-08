import test from "node:test";
import assert from "node:assert/strict";
import { createWorkspaceDiagnosticParticipationHandler } from "../netlify/functions/workspace-diagnostic-participation.mjs";
import { DIAGNOSTIC_NOTICE_VERSION, diagnosticCollectionRoute, DiagnosticParticipationStateError } from "../netlify/lib/workspace-diagnostic-participation.mjs";
import { WORKSPACE_ROLES } from "../workspace-authorization.js";

const workspaceId="11111111-1111-4111-8111-111111111111";
const diagnosticId="22222222-2222-4222-8222-222222222222";
function auth(role=WORKSPACE_ROLES.participant){return async()=>({ok:true,value:{role,workspaceId,userId:"user_test",organizationId:"org_alpha"}})}
function request(method="GET",body,origin="https://example.com"){return new Request("https://example.com/api/workspace/diagnostic-participation",{method,headers:{origin,...(body?{"content-type":"application/json"}:{})},body:body?JSON.stringify(body):undefined})}

test("accepted diagnostic invitations take precedence and bind only the authenticated participant",async()=>{
  let identity;
  const handler=createWorkspaceDiagnosticParticipationHandler({authenticate:auth(),gateway:{resolveAccepted:async()=>({diagnosticId,invitationId:"orginv_123"})},getParticipation:async value=>{identity=value;return{state:"notice-required",diagnosticId,noticeVersion:DIAGNOSTIC_NOTICE_VERSION,noticeAccepted:false,protocol:null}}});
  const response=await handler(request());
  assert.equal(response.status,200);
  assert.equal((await response.json()).state,"notice-required");
  assert.equal(identity.userId,"user_test");
  assert.equal(identity.invitationId,"orginv_123");
});

test("returns unavailable when no accepted diagnostic invitation belongs to the user",async()=>{
  const handler=createWorkspaceDiagnosticParticipationHandler({authenticate:auth(),gateway:{resolveAccepted:async()=>null}});
  const response=await handler(request());
  assert.deepEqual(await response.json(),{state:"unavailable"});
});

test("records the current diagnostic notice and rejects other roles and conflicts",async()=>{
  let accepted;
  const handler=createWorkspaceDiagnosticParticipationHandler({authenticate:auth(),acceptNotice:async value=>{accepted=value;return{accepted:true}}});
  assert.equal((await handler(request("POST",{diagnosticId,noticeVersion:DIAGNOSTIC_NOTICE_VERSION}))).status,200);
  assert.equal(accepted.userId,"user_test");
  const owner=createWorkspaceDiagnosticParticipationHandler({authenticate:auth(WORKSPACE_ROLES.owner)});
  assert.equal((await owner(request())).status,403);
  const conflict=createWorkspaceDiagnosticParticipationHandler({authenticate:auth(),gateway:{resolveAccepted:async()=>({diagnosticId,invitationId:"orginv_123"})},getParticipation:async()=>{throw new DiagnosticParticipationStateError("Unavailable.")}});
  assert.equal((await conflict(request())).status,409);
});

test("collection routing defaults to v1 and requires an explicit v2 activation",()=>{
  const base={v1_protocol_id:"protocol-v1",v1_protocol_version:"1.0.0",v1_governed_questions:[{questionId:"q-01"}],v2_activation_id:null,v2_protocol_id:"protocol-v2",v2_protocol_version:"2.0.0",v2_governed_questions:[{questionId:"q-02"}]};
  assert.equal(diagnosticCollectionRoute(base).interviewVersion,"1.0.0");
  assert.equal(diagnosticCollectionRoute({...base,v2_activation_id:"activation-1"}).interviewVersion,"2.0.0");
  assert.throws(()=>diagnosticCollectionRoute({...base,v2_activation_id:"activation-1",v2_protocol_id:null}),DiagnosticParticipationStateError);
});
