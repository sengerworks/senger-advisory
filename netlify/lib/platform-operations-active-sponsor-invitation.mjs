import { createClerkClient } from "@clerk/backend";
import { withNeonWorkspaceTransaction } from "./neon-workspace-database.mjs";

export class ActiveSponsorInvitationInputError extends Error {}

export function validateActiveSponsorInvitation(value){
  if(!value||typeof value!=="object"||Array.isArray(value)||Object.keys(value).sort().join(",")!=="invitationRequestId,privacyBriefConfirmed,scopeConfirmed,sponsorEmail")throw new ActiveSponsorInvitationInputError("Submit the complete sponsor invitation confirmation.");
  const sponsorEmail=String(value.sponsorEmail||"").trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sponsorEmail)||sponsorEmail.length>254)throw new ActiveSponsorInvitationInputError("Enter a valid sponsor email address.");
  if(value.scopeConfirmed!==true)throw new ActiveSponsorInvitationInputError("Confirm the POC scope, participant range, target window, and final debrief.");
  if(value.privacyBriefConfirmed!==true)throw new ActiveSponsorInvitationInputError("Confirm the sponsor received the confidentiality brief and paid-boundary explanation.");
  const invitationRequestId=String(value.invitationRequestId||"");
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(invitationRequestId))throw new ActiveSponsorInvitationInputError("Start a valid sponsor invitation request.");
  return Object.freeze({sponsorEmail,scopeConfirmed:true,privacyBriefConfirmed:true,invitationRequestId});
}

const findActivePoc=(workspaceId,connectionString)=>withNeonWorkspaceTransaction(workspaceId,async({query})=>(await query(`SELECT id,state FROM app_shared.diagnostics WHERE entitlement_type='poc' ORDER BY created_at DESC LIMIT 1`)).rows[0]||null,connectionString);
const recordInvitation=(workspaceId,operatorUserId,diagnosticId,invitationId,invitationRequestId,delivery,connectionString)=>withNeonWorkspaceTransaction(workspaceId,({query})=>query(`INSERT INTO app_operations.audit_events (workspace_id,actor_clerk_user_id,action,target_type,target_id,metadata) VALUES ($1,$2,'workspace.active-poc-sponsor-invited','diagnostic',$3,$4::jsonb)`,[workspaceId,operatorUserId,diagnosticId,JSON.stringify({invitationId,invitationRequestId,delivery})]),connectionString);

export async function inviteActivePocSponsor({workspaceId,organizationId,operatorUserId,input,redirectOrigin},{clerkClient=createClerkClient({secretKey:process.env.CLERK_SECRET_KEY}),getDiagnostic=findActivePoc,recordAudit=recordInvitation,connectionString}={}){
  const diagnostic=await getDiagnostic(workspaceId,connectionString);
  if(!diagnostic)throw new ActiveSponsorInvitationInputError("Create the active organization's POC engagement before inviting its sponsor.");
  const invitations=await clerkClient.organizations.getOrganizationInvitationList({organizationId,status:["pending","accepted"],limit:100});
  let invitation=(invitations.data||[]).find(value=>value.privateMetadata?.invitationRequestId===input.invitationRequestId);
  let delivery=invitation?"existing-request":"sent";
  if(!invitation){
    const prior=(invitations.data||[]).find(value=>value.emailAddress?.toLowerCase()===input.sponsorEmail&&value.privateMetadata?.responsibility==="executive-sponsor");
    if(prior?.status==="accepted"){invitation=prior;delivery="already-accepted";}
    else{
      if(prior?.status==="pending")await clerkClient.organizations.revokeOrganizationInvitation({organizationId,invitationId:prior.id,requestingUserId:operatorUserId});
      invitation=await clerkClient.organizations.createOrganizationInvitation({organizationId,inviterUserId:operatorUserId,emailAddress:input.sponsorEmail,role:"org:admin",expiresInDays:30,redirectUrl:`${redirectOrigin}/workspace/`,privateMetadata:{product:"organizational-capacity",responsibility:"executive-sponsor",invitationRequestId:input.invitationRequestId}});
      delivery=prior?"reissued":"sent";
    }
  }
  await recordAudit(workspaceId,operatorUserId,diagnostic.id,invitation.id,input.invitationRequestId,delivery,connectionString);
  return Object.freeze({diagnostic:Object.freeze({id:diagnostic.id,state:diagnostic.state}),sponsorInvitation:Object.freeze({status:invitation.status||"pending",delivery,expiresAt:new Date(invitation.expiresAt).toISOString()})});
}
