import { WORKSPACE_ROLES } from "../../workspace-authorization.js";
import { authenticateWorkspaceRequest } from "../lib/clerk-workspace-auth.mjs";
import { createOpenAIDiagnosticQuestionReframer, DiagnosticQuestionReframeProviderError, signDiagnosticQuestionRevision } from "../lib/openai-diagnostic-question-reframe.mjs";
import { validateDiagnosticContextId } from "../lib/workspace-diagnostic-context.mjs";
import {
  approveSponsorProtocolReviewV2,
  DiagnosticProtocolGovernanceV2InputError,
  DiagnosticProtocolGovernanceV2StateError,
  getSponsorProtocolReviewV2,
  sponsorProtocolGovernanceV2Policy,
  validateSponsorProtocolReviewV2
} from "../lib/workspace-diagnostic-protocol-governance-v2.mjs";

const headers={"Cache-Control":"no-store","Content-Type":"application/json; charset=utf-8","X-Content-Type-Options":"nosniff"};
const json=(status,body)=>new Response(JSON.stringify(body),{status,headers});
async function body(request){if(!request.headers.get("content-type")?.toLowerCase().startsWith("application/json"))throw new DiagnosticProtocolGovernanceV2InputError("Use application/json.");const text=await request.text();if(text.length>65536)throw new DiagnosticProtocolGovernanceV2InputError("Request too large.");try{return JSON.parse(text);}catch{throw new DiagnosticProtocolGovernanceV2InputError("Enter valid protocol-review details.");}}

export function createWorkspaceDiagnosticProtocolSponsorReviewV2Handler({authenticate=authenticateWorkspaceRequest,getReview=getSponsorProtocolReviewV2,approveReview=approveSponsorProtocolReviewV2,reframeQuestion=null}={}){
  return async request=>{
    if(!["GET","POST"].includes(request.method))return json(405,{error:"Method not allowed."});
    const url=new URL(request.url),origin=request.headers.get("origin");if(origin&&origin!==url.origin)return json(403,{error:"Origin not allowed."});
    try{
      const auth=await authenticate(request);if(!auth.ok)return json(auth.status,{error:"Workspace access unavailable."});
      if(auth.value.role!==WORKSPACE_ROLES.owner)return json(403,{error:"Only the client sponsor can review the diagnostic protocol."});
      if(request.method==="GET"){
        const diagnosticId=validateDiagnosticContextId(url.searchParams.get("diagnosticId"));
        return json(200,{...(await getReview({workspaceId:auth.value.workspaceId,diagnosticId})),policy:sponsorProtocolGovernanceV2Policy});
      }
      const input=await body(request);
      if(input?.action==="reframe-question"){
        if(Object.keys(input).sort().join(",")!=="action,currentQuestion,diagnosticId,reason,templateId")throw new DiagnosticProtocolGovernanceV2InputError("Only the governed question revision fields are accepted.");
        const diagnosticId=validateDiagnosticContextId(input.diagnosticId),state=await getReview({workspaceId:auth.value.workspaceId,diagnosticId});
        if(state.state!=="sponsor-review")throw new DiagnosticProtocolGovernanceV2StateError("The protocol is not open for sponsor revision.");
        const question=state.protocol.questions.find(item=>item.templateId===input.templateId);if(!question)throw new DiagnosticProtocolGovernanceV2InputError("Choose a governed protocol question.");
        if(!sponsorProtocolGovernanceV2Policy.revisionReasons.includes(input.reason))throw new DiagnosticProtocolGovernanceV2InputError("Choose a supported revision reason.");
        const currentQuestion=String(input.currentQuestion||"").trim();if(currentQuestion.length<20||currentQuestion.length>600)throw new DiagnosticProtocolGovernanceV2InputError("The question is outside the governed boundary.");
        const provider=reframeQuestion||createOpenAIDiagnosticQuestionReframer();
        const questionText=await provider({questionText:currentQuestion,canonicalQuestion:question.canonicalQuestion,reason:input.reason,evidenceObjectiveId:question.evidenceLayerId,domainId:question.mechanismIds.join(", ")||"cross-cutting"});
        const revision={templateId:question.templateId,reason:input.reason,questionText};
        revision.token=signDiagnosticQuestionRevision({diagnosticId,templateId:question.templateId,reason:input.reason,priorQuestion:currentQuestion,questionText});
        return json(200,{revision});
      }
      const state=await getReview({workspaceId:auth.value.workspaceId,diagnosticId:validateDiagnosticContextId(input.diagnosticId)});
      if(!state.protocol)throw new DiagnosticProtocolGovernanceV2StateError("The steward must prepare the protocol before sponsor review.");
      validateSponsorProtocolReviewV2(input,state.protocol.questions);
      return json(201,{...(await approveReview({workspaceId:auth.value.workspaceId,userId:auth.value.userId,input})),policy:sponsorProtocolGovernanceV2Policy});
    }catch(error){
      if(error instanceof DiagnosticProtocolGovernanceV2InputError)return json(400,{error:error.message});
      if(error instanceof DiagnosticProtocolGovernanceV2StateError)return json(409,{error:error.message});
      if(error instanceof DiagnosticQuestionReframeProviderError)return json(503,{error:"The question could not be reframed right now. Please try again."});
      console.error("Sponsor Protocol v2 review failed",error instanceof Error?error.message:"Unknown error");return json(503,{error:"Sponsor protocol review is temporarily unavailable."});
    }
  };
}

export default createWorkspaceDiagnosticProtocolSponsorReviewV2Handler();
export const config={path:"/api/workspace/diagnostic-protocol-sponsor-review-v2",rateLimit:{windowLimit:30,windowSize:60,aggregateBy:["ip","domain"]}};
