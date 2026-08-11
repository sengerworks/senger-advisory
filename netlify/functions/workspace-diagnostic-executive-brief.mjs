import { WORKSPACE_ROLES } from "../../workspace-authorization.js";
import { authenticateWorkspaceRequest } from "../lib/clerk-workspace-auth.mjs";
import { validateDiagnosticContextId } from "../lib/workspace-diagnostic-context.mjs";
import { DiagnosticEvidenceReviewAccessError } from "../lib/workspace-diagnostic-evidence-review.mjs";
import { executiveBriefHtml, executiveBriefReleasePolicy, ExecutiveBriefReleaseStateError, getReleasedExecutiveBrief, releaseExecutiveBrief } from "../lib/workspace-diagnostic-executive-brief.mjs";

const jsonHeaders={"Cache-Control":"no-store","Content-Type":"application/json; charset=utf-8","X-Content-Type-Options":"nosniff"};
const json=(status,body)=>new Response(JSON.stringify(body),{status,headers:jsonHeaders});

export function createWorkspaceDiagnosticExecutiveBriefHandler({authenticate=authenticateWorkspaceRequest,get=getReleasedExecutiveBrief,release=releaseExecutiveBrief}={}){return async request=>{
  if(!["GET","POST"].includes(request.method))return json(405,{error:"Method not allowed."});
  const url=new URL(request.url),origin=request.headers.get("origin");if(origin&&origin!==url.origin)return json(403,{error:"Origin not allowed."});
  try{
    const auth=await authenticate(request);if(!auth.ok)return json(auth.status,{error:"Workspace access unavailable."});
    let diagnosticId;
    if(request.method==="GET"){
      if(auth.value.role!==WORKSPACE_ROLES.owner)return json(403,{error:"Only the client sponsor can access the released Brief."});
      diagnosticId=validateDiagnosticContextId(url.searchParams.get("diagnosticId"));
      const result=await get({workspaceId:auth.value.workspaceId,diagnosticId});
      if(url.searchParams.get("download")==="1"){
        if(result.state!=="available")return json(result.state==="expired"?410:409,{error:result.state==="expired"?"Brief access has expired.":"The Brief has not been released."});
        return new Response(executiveBriefHtml(result.brief),{status:200,headers:{"Cache-Control":"no-store","Content-Type":"text/html; charset=utf-8","Content-Disposition":"attachment; filename=executive-capacity-brief.html","X-Content-Type-Options":"nosniff"}});
      }
      return json(200,{...result,policy:executiveBriefReleasePolicy});
    }
    if(auth.value.role===WORKSPACE_ROLES.participant)return json(403,{error:"Participants cannot release synthesis outputs."});
    if(!request.headers.get("content-type")?.toLowerCase().startsWith("application/json"))return json(400,{error:"Use application/json."});
    const text=await request.text();if(text.length>512)return json(400,{error:"Request too large."});let body;try{body=JSON.parse(text);}catch{return json(400,{error:"Choose one diagnostic to release."});}
    if(Object.keys(body||{}).join(",")!=="diagnosticId")return json(400,{error:"Choose one diagnostic to release."});
    diagnosticId=validateDiagnosticContextId(body.diagnosticId);
    return json(200,{brief:await release({workspaceId:auth.value.workspaceId,userId:auth.value.userId,diagnosticId}),policy:executiveBriefReleasePolicy});
  }catch(error){if(error instanceof DiagnosticEvidenceReviewAccessError)return json(403,{error:"An active steward assignment is required."});if(error instanceof ExecutiveBriefReleaseStateError)return json(409,{error:error.message});console.error("Executive Brief release failed",error instanceof Error?error.message:"Unknown error");return json(503,{error:"Executive Brief access is temporarily unavailable."});}
};}
export default createWorkspaceDiagnosticExecutiveBriefHandler();
export const config={path:"/api/workspace/diagnostic-executive-brief",rateLimit:{windowLimit:30,windowSize:60,aggregateBy:["ip","domain"]}};
