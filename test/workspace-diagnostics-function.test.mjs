import test from "node:test";
import assert from "node:assert/strict";
import { createWorkspaceDiagnosticsHandler } from "../netlify/functions/workspace-diagnostics.mjs";
import { DiagnosticInputError, validateDiagnosticDraft, workspaceDiagnosticPolicy } from "../netlify/lib/workspace-diagnostics.mjs";
import { WORKSPACE_ROLES } from "../workspace-authorization.js";

const workspaceId="11111111-1111-4111-8111-111111111111";
function request(method="GET",body,origin="https://example.com"){return new Request("https://example.com/api/workspace/diagnostics",{method,headers:{origin,...(body===undefined?{}:{"content-type":"application/json"})},body:body===undefined?undefined:JSON.stringify(body)})}
function authentication(role=WORKSPACE_ROLES.owner){return async()=>({ok:true,value:{role,workspaceId,userId:"user_owner"}})}
const diagnostic={id:"22222222-2222-4222-8222-222222222222",route:"automated",entitlementType:"poc",entitlementStatus:"active",state:"draft",humanReviewState:"clear",createdAt:"2026-08-01T00:00:00.000Z",updatedAt:"2026-08-01T00:00:00.000Z"};

test("validates only governed diagnostic routes and entitlement types",()=>{assert.deepEqual(validateDiagnosticDraft({route:"automated",entitlementType:"poc"}),{route:"automated",entitlementType:"poc"});assert.throws(()=>validateDiagnosticDraft({route:"assessment",entitlementType:"poc"}),DiagnosticInputError);assert.throws(()=>validateDiagnosticDraft({route:"automated",entitlementType:"free"}),DiagnosticInputError);assert.equal(workspaceDiagnosticPolicy.lifecycleVersion,"1.0.0")});
test("client administrators list minimized diagnostics but cannot create engagements",async()=>{const handler=createWorkspaceDiagnosticsHandler({authenticate:authentication(),listDiagnostics:async id=>{assert.equal(id,workspaceId);return[diagnostic]}});const listed=await handler(request());assert.equal(listed.status,200);assert.deepEqual((await listed.json()).diagnostics,[diagnostic]);assert.equal((await handler(request("POST",{route:"automated",entitlementType:"poc"}))).status,405)});
test("participants, foreign origins, and unsupported methods fail closed",async()=>{const handler=createWorkspaceDiagnosticsHandler({authenticate:authentication(WORKSPACE_ROLES.participant)});assert.equal((await handler(request("GET"))).status,403);assert.equal((await handler(request("GET",undefined,"https://attacker.example"))).status,403);assert.equal((await handler(request("DELETE"))).status,405)});
