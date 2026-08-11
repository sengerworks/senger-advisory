import { withNeonWorkspaceTransaction } from "./neon-workspace-database.mjs";
import { configuredPlatformOperatorUserIds } from "./platform-operations-auth.mjs";

export async function authorizePresenterDemo({workspaceId,userId,now=new Date(),operatorUserIds=configuredPlatformOperatorUserIds()},connectionString){
  if(operatorUserIds.includes(userId))return Object.freeze({allowed:true,authority:"platform-operator"});
  return withNeonWorkspaceTransaction(workspaceId,async({query})=>{const result=await query(`SELECT 1 FROM app_operations.diagnostic_advisor_assignments WHERE advisor_clerk_user_id=$1 AND revoked_at IS NULL AND expires_at>$2::timestamptz LIMIT 1`,[userId,now.toISOString()]);return Object.freeze({allowed:result.rowCount===1,authority:result.rowCount===1?"assigned-steward":null});},connectionString);
}
export const presenterDemoAccessPolicy=Object.freeze({platformOperatorAllowed:true,activeAssignedStewardAllowed:true,clientSponsorAllowed:false,participantAllowed:false,liveClientDataIncluded:false});
