import { WORKSPACE_ROLES } from "../../workspace-authorization.js";
import { authenticateWorkspaceRequest } from "../lib/clerk-workspace-auth.mjs";
import { DiagnosticContextInputError, validateDiagnosticContextId } from "../lib/workspace-diagnostic-context.mjs";
import { DiagnosticInterviewV2InputError, DiagnosticInterviewV2StateError, getParticipantInterviewV2, saveParticipantInterviewV2, withdrawParticipantInterviewV2 } from "../lib/workspace-diagnostic-interview-v2.mjs";

const headers={"Cache-Control":"no-store","Content-Type":"application/json; charset=utf-8","X-Content-Type-Options":"nosniff"};
const json=(status,body)=>new Response(JSON.stringify(body),{status,headers});
async function body(request){if(!request.headers.get("content-type")?.toLowerCase().startsWith("application/json"))throw new DiagnosticInterviewV2InputError("Use application/json.");const text=await request.text();if(text.length>131072)throw new DiagnosticInterviewV2InputError("Request too large.");try{return JSON.parse(text);}catch{throw new DiagnosticInterviewV2InputError("Enter valid v2 interview answers.");}}

export function createWorkspaceDiagnosticInterviewV2Handler({authenticate=authenticateWorkspaceRequest,getInterview=getParticipantInterviewV2,saveInterview=saveParticipantInterviewV2,withdrawInterview=withdrawParticipantInterviewV2}={}){return async request=>{
  if(!["GET","PATCH","POST","DELETE"].includes(request.method))return json(405,{error:"Method not allowed."});const url=new URL(request.url),origin=request.headers.get("origin");if(origin&&origin!==url.origin)return json(403,{error:"Origin not allowed."});
  try{const auth=await authenticate(request);if(!auth.ok)return json(auth.status,{error:"Workspace access unavailable."});if(auth.value.role!==WORKSPACE_ROLES.participant)return json(403,{error:"Participant access is required."});
    if(request.method==="GET")return json(200,await getInterview({workspaceId:auth.value.workspaceId,userId:auth.value.userId,diagnosticId:validateDiagnosticContextId(url.searchParams.get("diagnosticId"))}));
    if(request.method==="DELETE")return json(200,await withdrawInterview({workspaceId:auth.value.workspaceId,userId:auth.value.userId,diagnosticId:validateDiagnosticContextId(url.searchParams.get("diagnosticId"))}));
    const input=await body(request);input.diagnosticId=validateDiagnosticContextId(input.diagnosticId);return json(200,await saveInterview({workspaceId:auth.value.workspaceId,userId:auth.value.userId,input,submit:request.method==="POST"}));
  }catch(error){if(error instanceof DiagnosticInterviewV2InputError||error instanceof DiagnosticContextInputError)return json(400,{error:error.message});if(error instanceof DiagnosticInterviewV2StateError)return json(409,{error:error.message});console.error("Workspace diagnostic interview v2 failed",error instanceof Error?error.message:"Unknown error");return json(503,{error:"Diagnostic interview v2 is temporarily unavailable."});}
};}
export default createWorkspaceDiagnosticInterviewV2Handler();
export const config={path:"/api/workspace/diagnostic-interview-v2",rateLimit:{windowLimit:120,windowSize:60,aggregateBy:["ip","domain"]}};
