import { authenticatePlatformOperationsRequest } from "../lib/platform-operations-auth.mjs";
import { ActiveSponsorInvitationInputError, inviteActivePocSponsor, validateActiveSponsorInvitation } from "../lib/platform-operations-active-sponsor-invitation.mjs";

const headers={"Cache-Control":"no-store","Content-Type":"application/json; charset=utf-8","X-Content-Type-Options":"nosniff"};
const json=(status,body)=>new Response(JSON.stringify(body),{status,headers});
async function body(request){if(!request.headers.get("content-type")?.toLowerCase().startsWith("application/json"))throw new ActiveSponsorInvitationInputError("Use application/json.");const text=await request.text();if(text.length>1024)throw new ActiveSponsorInvitationInputError("Request too large.");try{return JSON.parse(text);}catch{throw new ActiveSponsorInvitationInputError("Enter valid sponsor invitation details.");}}

export function createPlatformOperationsActiveSponsorInvitationHandler({authenticate=authenticatePlatformOperationsRequest,invite=inviteActivePocSponsor}={}){return async request=>{if(request.method!=="POST")return json(405,{error:"Method not allowed."});const url=new URL(request.url),origin=request.headers.get("origin");if(origin&&origin!==url.origin)return json(403,{error:"Origin not allowed."});try{const auth=await authenticate(request);if(!auth.ok)return json(auth.status,{error:"Platform Operations access unavailable."});const input=validateActiveSponsorInvitation(await body(request));return json(201,await invite({workspaceId:auth.value.workspaceId,organizationId:auth.value.organizationId,operatorUserId:auth.value.userId,input,redirectOrigin:origin||url.origin}));}catch(error){if(error instanceof ActiveSponsorInvitationInputError)return json(400,{error:error.message});console.error("Active POC sponsor invitation failed",error instanceof Error?error.message:"Unknown error");return json(503,{error:"The active POC sponsor invitation is temporarily unavailable."});}};}

export default createPlatformOperationsActiveSponsorInvitationHandler();
export const config={path:"/api/operations/active-sponsor-invitation",rateLimit:{windowLimit:10,windowSize:60,aggregateBy:["ip","domain"]}};
