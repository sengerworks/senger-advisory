import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createPlatformOperationsClientProvisioningHandler } from "../netlify/functions/platform-operations-client-provisioning.mjs";
import { ClientProvisioningInputError, validateClientProvisioning } from "../netlify/lib/platform-operations-client-provisioning.mjs";

const auth=async()=>({ok:true,value:{userId:"user_operator",workspaceId:"11111111-1111-4111-8111-111111111111",authority:"platform-operator"}});
const input={organizationName:"Adam's Company",sponsorEmail:"adam@example.com",route:"automated"};
const request=(value=input,origin="https://example.com")=>new Request("https://example.com/api/operations/client-provisioning",{method:"POST",headers:{origin,"content-type":"application/json"},body:JSON.stringify(value)});

test("validates one bounded POC client enrollment",()=>{assert.deepEqual(validateClientProvisioning(input),input);assert.throws(()=>validateClientProvisioning({...input,sponsorEmail:"invalid"}),ClientProvisioningInputError);assert.throws(()=>validateClientProvisioning({...input,route:"custom"}),ClientProvisioningInputError);});

test("platform operator provisions the client, sponsor, and no-charge diagnostic",async()=>{let received;const handler=createPlatformOperationsClientProvisioningHandler({authenticate:auth,provision:async value=>(received=value,{organization:{id:"org_client",name:value.input.organizationName},diagnostic:{entitlementType:"poc"},sponsorInvitation:{status:"pending",expiresAt:new Date(0).toISOString()}})});const response=await handler(request());assert.equal(response.status,201);assert.equal(received.operatorUserId,"user_operator");assert.equal(received.redirectOrigin,"https://example.com");assert.equal((await response.json()).diagnostic.entitlementType,"poc");});

test("client provisioning rejects foreign origins and unsupported requests",async()=>{const handler=createPlatformOperationsClientProvisioningHandler({authenticate:auth});assert.equal((await handler(request(input,"https://attacker.example"))).status,403);assert.equal((await handler(new Request("https://example.com/api/operations/client-provisioning"))).status,405);});

test("provisioning keeps sponsor identity out of audit metadata",async()=>{const source=await readFile(new URL("../netlify/lib/platform-operations-client-provisioning.mjs",import.meta.url),"utf8");const audit=source.match(/workspace\.poc-client-provisioned[\s\S]*?JSON\.stringify\((\{[^)]*\})\)/)?.[1]||"";assert.doesNotMatch(audit,/email|sponsorEmail/);assert.match(source,/role: "org:admin"/);assert.match(source,/maxAllowedMemberships: 12/);assert.match(source,/entitlementType: "poc"/);});
