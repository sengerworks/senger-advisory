import { WORKSPACE_ROLES } from "../../workspace-authorization.js";
import { authenticateWorkspaceRequest } from "../lib/clerk-workspace-auth.mjs";
import { DiagnosticInterviewInputError,DiagnosticInterviewStateError,getParticipantInterview,saveParticipantInterview,validateInterviewAnswers } from "../lib/workspace-diagnostic-interview.mjs";
const headers={"Cache-Control":"no-store","Content-Type":"application/json; charset=utf-8","X-Content-Type-Options":"nosniff"}; const json=(s,b)=>new Response(JSON.stringify(b),{status:s,headers});
export function createWorkspaceDiagnosticInterviewHandler({authenticate=authenticateWorkspaceRequest,getInterview=getParticipantInterview,saveInterview=saveParticipantInterview}={}){return async request=>{
 if(!["GET","PATCH","POST"].includes(request.method))return json(405,{error:"Method not allowed."}); const url=new URL(request.url); const origin=request.headers.get("origin"); if(origin&&origin!==url.origin)return json(403,{error:"Origin not allowed."});
 try{const auth=await authenticate(request);if(!auth.ok)return json(auth.status,{error:"Workspace access unavailable."});if(auth.value.role!==WORKSPACE_ROLES.participant)return json(403,{error:"Participant access is required."});
  if(request.method==="GET"){const diagnosticId=url.searchParams.get("diagnosticId");return json(200,await getInterview({workspaceId:auth.value.workspaceId,userId:auth.value.userId,diagnosticId}));}
  const input=validateInterviewAnswers(await request.json(),{submit:request.method==="POST"});return json(200,await saveInterview({workspaceId:auth.value.workspaceId,userId:auth.value.userId,input,submit:request.method==="POST"}));
 }catch(error){if(error instanceof DiagnosticInterviewInputError||error instanceof SyntaxError)return json(400,{error:error.message});if(error instanceof DiagnosticInterviewStateError)return json(409,{error:error.message});console.error("Workspace diagnostic interview failed",error instanceof Error?error.message:"Unknown error");return json(503,{error:"Diagnostic interview is temporarily unavailable."});}
};}
export default createWorkspaceDiagnosticInterviewHandler(); export const config={path:"/api/workspace/diagnostic-interview",rateLimit:{windowLimit:120,windowSize:60,aggregateBy:["ip","domain"]}};
