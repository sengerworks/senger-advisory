import test from "node:test";
import assert from "node:assert/strict";
import { authenticatePlatformOperationsRequest, configuredPlatformOperatorUserIds, platformOperationsAuthPolicy } from "../netlify/lib/platform-operations-auth.mjs";

const request=new Request("https://example.com/api/operations/overview");
test("platform operators require an explicit Clerk user allowlist",async()=>{
  assert.deepEqual(configuredPlatformOperatorUserIds("user_alpha,user_beta,user_alpha"),["user_alpha","user_beta"]);
  assert.throws(()=>configuredPlatformOperatorUserIds(""));
  assert.throws(()=>configuredPlatformOperatorUserIds("alpha"));
  const authenticate=async()=>({ok:true,value:{userId:"user_alpha",workspaceId:"workspace-1",organizationId:"org_alpha",role:"org:admin"}});
  const allowed=await authenticatePlatformOperationsRequest(request,{authenticate,operatorUserIds:["user_alpha"]});
  assert.equal(allowed.ok,true);assert.equal(allowed.value.authority,"platform-operator");assert.equal(allowed.value.workspaceId,"workspace-1");
  assert.deepEqual(await authenticatePlatformOperationsRequest(request,{authenticate,operatorUserIds:["user_other"]}),{ok:false,status:403});
  assert.equal(platformOperationsAuthPolicy.participantContentAccess,false);
});
