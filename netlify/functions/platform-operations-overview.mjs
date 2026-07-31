import { authenticatePlatformOperationsRequest } from "../lib/platform-operations-auth.mjs";
import { getPlatformOperationsOverview, platformOperationsOverviewPolicy } from "../lib/platform-operations-overview.mjs";

const headers={"Cache-Control":"no-store","Content-Type":"application/json; charset=utf-8","X-Content-Type-Options":"nosniff"};
const json=(status,body)=>new Response(JSON.stringify(body),{status,headers});
export function createPlatformOperationsOverviewHandler({authenticate=authenticatePlatformOperationsRequest,getOverview=getPlatformOperationsOverview}={}){
  return async request=>{
    if(request.method!=="GET")return json(405,{error:"Method not allowed."});
    const origin=request.headers.get("origin");if(origin&&origin!==new URL(request.url).origin)return json(403,{error:"Origin not allowed."});
    try{const auth=await authenticate(request);if(!auth.ok)return json(auth.status,{error:"Platform Operations access unavailable."});return json(200,{...(await getOverview({workspaceId:auth.value.workspaceId})),policy:platformOperationsOverviewPolicy});}
    catch(error){console.error("Platform Operations overview failed",error instanceof Error?error.message:"Unknown error");return json(503,{error:"Platform Operations is temporarily unavailable."});}
  };
}
export default createPlatformOperationsOverviewHandler();
export const config={path:"/api/operations/overview",rateLimit:{windowLimit:60,windowSize:60,aggregateBy:["ip","domain"]}};
