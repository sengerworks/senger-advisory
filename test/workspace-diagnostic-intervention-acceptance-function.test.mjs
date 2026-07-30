import test from "node:test";
import assert from "node:assert/strict";
import { createWorkspaceDiagnosticInterventionAcceptanceHandler } from "../netlify/functions/workspace-diagnostic-intervention-acceptance.mjs";
import { InterventionAcceptanceInputError, validateInterventionAcceptanceInput } from "../netlify/lib/workspace-diagnostic-intervention-acceptance.mjs";
import { WORKSPACE_ROLES } from "../workspace-authorization.js";

const diagnosticId="22222222-2222-4222-8222-222222222222";
const auth=role=>async()=>({ok:true,value:{workspaceId:"11111111-1111-4111-8111-111111111111",userId:"user_sponsor",role}});
const request=(method="GET",body)=>new Request(`https://example.com/api/workspace/diagnostic-intervention-acceptance?diagnosticId=${diagnosticId}`,{method,headers:{origin:"https://example.com",...(body?{"content-type":"application/json"}:{})},body:body?JSON.stringify(body):undefined});

test("client sponsor reads and explicitly accepts a commercially entitled proposal",async()=>{let received;const handler=createWorkspaceDiagnosticInterventionAcceptanceHandler({authenticate:auth(WORKSPACE_ROLES.owner),get:async()=>({state:"review",canAccept:true,intervention:{commercialOfferRef:"POC-1"}}),accept:async value=>{received=value;return{status:"accepted"};}});assert.equal((await handler(request())).status,200);const response=await handler(request("POST",{diagnosticId,scopeAccepted:true,commercialTermsAccepted:true}));assert.equal(response.status,201);assert.equal(received.input.scopeAccepted,true);});

test("acceptance requires both explicit consents",()=>{assert.throws(()=>validateInterventionAcceptanceInput({diagnosticId,scopeAccepted:false,commercialTermsAccepted:true}),InterventionAcceptanceInputError);assert.throws(()=>validateInterventionAcceptanceInput({diagnosticId,scopeAccepted:true,commercialTermsAccepted:false}),InterventionAcceptanceInputError);});

test("acceptance blocks non-sponsors, foreign origins, and unsupported methods",async()=>{const handler=createWorkspaceDiagnosticInterventionAcceptanceHandler({authenticate:auth(WORKSPACE_ROLES.facilitator)});assert.equal((await handler(request())).status,403);assert.equal((await handler(new Request(`https://example.com/api/workspace/diagnostic-intervention-acceptance?diagnosticId=${diagnosticId}`,{headers:{origin:"https://attacker.example"}}))).status,403);assert.equal((await handler(request("DELETE"))).status,405);});

