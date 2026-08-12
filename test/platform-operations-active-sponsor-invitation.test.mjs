import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createPlatformOperationsActiveSponsorInvitationHandler } from "../netlify/functions/platform-operations-active-sponsor-invitation.mjs";
import { ActiveSponsorInvitationInputError, validateActiveSponsorInvitation } from "../netlify/lib/platform-operations-active-sponsor-invitation.mjs";

const auth=async()=>({ok:true,value:{userId:"user_operator",workspaceId:"11111111-1111-4111-8111-111111111111",organizationId:"org_active",authority:"platform-operator"}});
const input={sponsorEmail:"sponsor@example.com",scopeConfirmed:true,privacyBriefConfirmed:true,invitationRequestId:"11111111-1111-4111-8111-111111111111"};
const request=(value=input,origin="https://example.com")=>new Request("https://example.com/api/operations/active-sponsor-invitation",{method:"POST",headers:{origin,"content-type":"application/json"},body:JSON.stringify(value)});

test("validates an active POC sponsor invitation",()=>{assert.deepEqual(validateActiveSponsorInvitation(input),input);assert.throws(()=>validateActiveSponsorInvitation({...input,sponsorEmail:"invalid"}),ActiveSponsorInvitationInputError);assert.throws(()=>validateActiveSponsorInvitation({...input,scopeConfirmed:false}),ActiveSponsorInvitationInputError);assert.throws(()=>validateActiveSponsorInvitation({...input,privacyBriefConfirmed:false}),ActiveSponsorInvitationInputError);});

test("platform operator invites a sponsor to the active organization",async()=>{let received;const handler=createPlatformOperationsActiveSponsorInvitationHandler({authenticate:auth,invite:async value=>(received=value,{diagnostic:{id:"diagnostic_active",state:"context-intake"},sponsorInvitation:{status:"pending",expiresAt:new Date(0).toISOString()}})});const response=await handler(request());assert.equal(response.status,201);assert.equal(received.workspaceId,"11111111-1111-4111-8111-111111111111");assert.equal(received.organizationId,"org_active");assert.equal(received.operatorUserId,"user_operator");assert.equal(received.redirectOrigin,"https://example.com");});

test("active sponsor invitation rejects foreign origins and unsupported requests",async()=>{const handler=createPlatformOperationsActiveSponsorInvitationHandler({authenticate:auth});assert.equal((await handler(request(input,"https://attacker.example"))).status,403);assert.equal((await handler(new Request("https://example.com/api/operations/active-sponsor-invitation"))).status,405);});

test("operations UI distinguishes active sponsor access from new-client enrollment",async()=>{const [html,client,source]=await Promise.all([readFile(new URL("../workspace/operations.html",import.meta.url),"utf8"),readFile(new URL("../workspace/operations.js",import.meta.url),"utf8"),readFile(new URL("../netlify/lib/platform-operations-active-sponsor-invitation.mjs",import.meta.url),"utf8")]);assert.match(html,/Active organization.*readonly/);assert.match(html,/Invite sponsor to active POC/);assert.match(html,/New client organization name/);assert.doesNotMatch(html,/Acme Company|adam@example\.com/);assert.match(client,/active-sponsor-invitation/);assert.match(source,/responsibility:"executive-sponsor"/);assert.doesNotMatch(source,/JSON\.stringify\([^\n]*sponsorEmail/);});
