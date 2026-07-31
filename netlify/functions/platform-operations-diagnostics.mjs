import { authenticatePlatformOperationsRequest } from "../lib/platform-operations-auth.mjs";
import { createWorkspaceDiagnostic, DiagnosticInputError, listWorkspaceDiagnostics, validateDiagnosticDraft, workspaceDiagnosticPolicy } from "../lib/workspace-diagnostics.mjs";

const headers={"Cache-Control":"no-store","Content-Type":"application/json; charset=utf-8","X-Content-Type-Options":"nosniff"};
const json=(status,body)=>new Response(JSON.stringify(body),{status,headers});
async function body(request){if(!request.headers.get("content-type")?.toLowerCase().startsWith("application/json"))throw new DiagnosticInputError("Use application/json.");const text=await request.text();if(text.length>1024)throw new DiagnosticInputError("Request too large.");try{return JSON.parse(text);}catch{throw new DiagnosticInputError("Enter valid diagnostic details.");}}
export function createPlatformOperationsDiagnosticsHandler({authenticate=authenticatePlatformOperationsRequest,listDiagnostics=listWorkspaceDiagnostics,createDiagnostic=createWorkspaceDiagnostic}={}){
  return async request=>{
    if(!["GET","POST"].includes(request.method))return json(405,{error:"Method not allowed."});
    const origin=request.headers.get("origin");if(origin&&origin!==new URL(request.url).origin)return json(403,{error:"Origin not allowed."});
    try{const auth=await authenticate(request);if(!auth.ok)return json(auth.status,{error:"Platform Operations access unavailable."});if(request.method==="GET")return json(200,{diagnostics:await listDiagnostics(auth.value.workspaceId),policy:workspaceDiagnosticPolicy});const draft=validateDiagnosticDraft(await body(request));return json(201,{diagnostic:await createDiagnostic({workspaceId:auth.value.workspaceId,actorUserId:auth.value.userId,draft})});}
    catch(error){if(error instanceof DiagnosticInputError)return json(400,{error:error.message});console.error("Platform diagnostic operation failed",error instanceof Error?error.message:"Unknown error");return json(503,{error:"Platform diagnostic setup is temporarily unavailable."});}
  };
}
export default createPlatformOperationsDiagnosticsHandler();
export const config={path:"/api/operations/diagnostics",rateLimit:{windowLimit:30,windowSize:60,aggregateBy:["ip","domain"]}};
