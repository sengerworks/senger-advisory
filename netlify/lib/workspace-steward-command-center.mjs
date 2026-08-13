import {withNeonWorkspaceTransaction} from "./neon-workspace-database.mjs";
import {validateDiagnosticContextId} from "./workspace-diagnostic-context.mjs";
import {requireAdvisorAssignment} from "./workspace-diagnostic-evidence-review.mjs";

function iso(value){return value?new Date(value).toISOString():null;}
function stageOf(slot){if(slot.interview_status==="submitted")return"submitted";if(slot.interview_status)return"in-progress";if(slot.notice_accepted)return"accepted";return"invited";}
function nextAction(source){
  const session=new Map(source.sessions.map(item=>[item.session_type,item.status]));
  if(session.get("guidance")!=="completed")return{code:"complete-guidance",owner:"steward",label:"Complete and attest the Guidance Session."};
  if(!source.context)return{code:"approve-context",owner:"sponsor-steward",label:"Finish and approve the bounded Context Brief."};
  if(session.get("design")!=="completed")return{code:"complete-design",owner:"steward",label:"Complete and attest the Design Session."};
  if(!source.plan)return{code:"approve-perspectives",owner:"sponsor-steward",label:"Approve the identity-free perspective design."};
  if(!source.protocol)return{code:"prepare-protocol",owner:"steward",label:"Prepare the common 18-question protocol."};
  if(!source.protocol.sponsor_approved_at)return{code:"sponsor-protocol-review",owner:"sponsor",label:"Sponsor review of all 18 questions is required."};
  if(!source.protocol.steward_finalized_at)return{code:"finalize-protocol",owner:"steward",label:"Finalize the sponsor-approved protocol."};
  if(!source.activation)return{code:"activate-collection",owner:"platform-operations",label:"Activate Protocol v2 collection."};
  if(source.invited<source.planned)return{code:"invite-perspectives",owner:"sponsor",label:`Invite ${source.planned-source.invited} remaining approved perspective${source.planned-source.invited===1?"":"s"}.`};
  if(source.completed<5)return{code:"reach-threshold",owner:"sponsor-steward",label:`Follow up on participation; ${5-source.completed} more confidential completion${5-source.completed===1?" is":"s are"} required.`};
  if(source.completed<source.planned)return{code:"resolve-collection",owner:"sponsor-steward",label:`Confidentiality is met; resolve ${source.planned-source.completed} remaining perspective${source.planned-source.completed===1?"":"s"}.`};
  if(source.evidence.total===0)return{code:"prepare-evidence",owner:"steward",label:"Prepare submitted interviews for protected de-identification review."};
  if(source.evidence.pending>0)return{code:"review-evidence",owner:"steward",label:`Review ${source.evidence.pending} pending de-identified evidence candidate${source.evidence.pending===1?"":"s"}.`};
  if(!source.finding)return{code:"synthesize",owner:"steward",label:"Create the governed synthesis draft."};
  if(source.finding.advisor_review_status==="pending")return{code:"review-synthesis",owner:"steward",label:"Review the synthesis, uncertainty, and evidence trace."};
  if(!source.directions)return{code:"prepare-intervention-directions",owner:"steward",label:"Prepare three weighted, evidence-informed Intervention Directions."};
  if(source.directions.advisor_review_status==="revision-required")return{code:"revise-intervention-directions",owner:"steward",label:"Resolve the requested Intervention Direction revisions."};
  if(source.directions.advisor_review_status!=="approved")return{code:"review-intervention-directions",owner:"steward",label:"Review and approve the weighted Intervention Directions."};
  if(!source.executiveBrief||!source.revelationGuide)return{code:"prepare-dual-outputs",owner:"steward",label:"Prepare the locked Executive Capacity Brief and private Revelation Guide."};
  if(source.executiveBrief.advisor_review_status==="revision-required"||source.revelationGuide.advisor_review_status==="revision-required")return{code:"revise-dual-outputs",owner:"steward",label:"Resolve the requested output revisions before revelation preparation."};
  if(source.executiveBrief.advisor_review_status!=="approved"||source.revelationGuide.advisor_review_status!=="approved")return{code:"review-dual-outputs",owner:"steward",label:"Review and approve both governed synthesis outputs."};
  if(!session.has("revelation")||session.get("revelation")==="cancelled")return{code:"schedule-revelation",owner:"sponsor-steward",label:"Schedule the 30-minute Revelation Session before sponsor release."};
  if(source.executiveBrief.status!=="released")return{code:"release-executive-brief",owner:"steward",label:"Deliberately release the Executive Capacity Brief to the sponsor."};
  if(!source.validation)return{code:"prepare-revelation",owner:"steward",label:"Conduct the sponsor revelation and capture leadership validation."};
  return{code:"advance",owner:"steward",label:"Advance the next governed POC gate."};
}

export async function getStewardCommandCenter({workspaceId,userId,diagnosticId,now=new Date()},connectionString){return withNeonWorkspaceTransaction(workspaceId,async({query})=>{
  const id=validateDiagnosticContextId(diagnosticId);await requireAdvisorAssignment(query,{diagnosticId:id,userId,now});
  const [diagnostic,context,plan,protocol,activation,sessions,slots,evidence,finding,directions,executiveBrief,revelationGuide,validation]=await Promise.all([
    query("SELECT id,state,delivery_route,entitlement_type,updated_at FROM app_shared.diagnostics WHERE id=$1",[id]),
    query("SELECT approved_at FROM app_private.diagnostic_context_briefs WHERE diagnostic_id=$1",[id]),
    query("SELECT approved_payload,approved_at FROM app_private.diagnostic_participant_plans WHERE diagnostic_id=$1",[id]),
    query("SELECT governed_questions,sponsor_approved_at,steward_finalized_at FROM app_shared.diagnostic_protocols_v2 WHERE diagnostic_id=$1",[id]),
    query("SELECT activated_at FROM app_operations.diagnostic_v2_collection_activations WHERE diagnostic_id=$1 AND deactivated_at IS NULL",[id]),
    query("SELECT session_type,status,scheduled_at,completed_at FROM app_operations.diagnostic_steward_sessions WHERE diagnostic_id=$1 ORDER BY scheduled_at",[id]),
    query(`SELECT slot.plan_slot_id,slot.clerk_invitation_id,slot.created_at,slot.notice_accepted_at IS NOT NULL AS notice_accepted,COALESCE(interview_v2.status,interview.status) AS interview_status
      FROM app_identity.diagnostic_participant_slots slot LEFT JOIN app_private.diagnostic_interviews interview ON interview.workspace_id=slot.workspace_id AND interview.participant_slot_id=slot.id LEFT JOIN app_private.diagnostic_interviews_v2 interview_v2 ON interview_v2.workspace_id=slot.workspace_id AND interview_v2.participant_slot_id=slot.id WHERE slot.diagnostic_id=$1 AND slot.revoked_at IS NULL`,[id]),
    query("SELECT source_question_id,review_status,disclosure_risk FROM app_private.diagnostic_evidence WHERE diagnostic_id=$1",[id]),
    query("SELECT record_payload,confidence,advisor_review_status,created_at FROM app_shared.diagnostic_findings WHERE diagnostic_id=$1 LIMIT 1",[id]),
    query("SELECT advisor_review_status FROM app_private.diagnostic_intervention_directions WHERE diagnostic_id=$1 LIMIT 1",[id]),
    query("SELECT advisor_review_status,status FROM app_shared.diagnostic_executive_briefs WHERE diagnostic_id=$1 LIMIT 1",[id]),
    query("SELECT advisor_review_status FROM app_private.diagnostic_revelation_guides WHERE diagnostic_id=$1 LIMIT 1",[id]),
    query("SELECT decision,created_at FROM app_operations.diagnostic_leadership_validations WHERE diagnostic_id=$1 ORDER BY created_at DESC LIMIT 1",[id])
  ]);
  if(!diagnostic.rows[0])throw new Error("That diagnostic is not available in this workspace.");
  const planPayload=plan.rows[0]?.approved_payload||null,planned=planPayload?.participantSlots?.length||0,slotRows=slots.rows,completed=slotRows.filter(row=>row.interview_status==="submitted").length;
  const evidenceRows=evidence.rows,evidenceSummary={total:evidenceRows.length,pending:evidenceRows.filter(row=>row.review_status==="pending").length,approved:evidenceRows.filter(row=>row.review_status==="approved").length,excluded:evidenceRows.filter(row=>row.review_status==="excluded").length,highRiskPending:evidenceRows.filter(row=>row.review_status==="pending"&&row.disclosure_risk==="high").length};
  const questionById=new Map((protocol.rows[0]?.governed_questions||[]).map(question=>[question.questionId,question]));const clusterCounts=new Map();
  if(completed>=5)for(const row of evidenceRows.filter(item=>item.review_status==="approved")){const question=questionById.get(row.source_question_id.split(".")[0]);for(const mechanism of question?.mechanismIds||[])clusterCounts.set(mechanism,(clusterCounts.get(mechanism)||0)+1);}
  const source={sessions:sessions.rows,context:context.rows[0],plan:plan.rows[0],protocol:protocol.rows[0],activation:activation.rows[0],planned,invited:slotRows.length,completed,evidence:evidenceSummary,finding:finding.rows[0],directions:directions.rows[0],executiveBrief:executiveBrief.rows[0],revelationGuide:revelationGuide.rows[0],validation:validation.rows[0]};
  return Object.freeze({diagnostic:Object.freeze({...diagnostic.rows[0],updatedAt:iso(diagnostic.rows[0].updated_at)}),threshold:Object.freeze({minimum:5,completed,met:completed>=5,contentIntelligencePermitted:completed>=5}),progress:Object.freeze({planned,invited:slotRows.length,accepted:slotRows.filter(row=>row.notice_accepted).length,inProgress:slotRows.filter(row=>row.interview_status&&row.interview_status!=="submitted").length,completed,remaining:Math.max(planned-completed,0)}),participants:Object.freeze(slotRows.map(row=>Object.freeze({planSlotId:row.plan_slot_id,invitationId:row.clerk_invitation_id,stage:stageOf(row),invitedAt:iso(row.created_at)}))),sessions:Object.freeze(sessions.rows.map(row=>Object.freeze({sessionType:row.session_type,status:row.status,scheduledAt:iso(row.scheduled_at),completedAt:iso(row.completed_at)}))),evidence:Object.freeze(evidenceSummary),emergingIntelligence:Object.freeze({available:completed>=5,clusters:Object.freeze(completed>=5?[...clusterCounts].map(([mechanismId,evidenceCount])=>Object.freeze({mechanismId,evidenceCount})):[]),themes:Object.freeze(completed>=5?(finding.rows[0]?.record_payload?.themes||[]).map(theme=>Object.freeze({title:theme.title,summary:theme.summary,confidence:theme.confidence})):[]),message:completed<5?"Content-derived intelligence is withheld until five confidential interviews are complete.":finding.rows[0]?"Governed themes are available to the assigned steward only.":"Threshold met. Evidence clusters are provisional until governed synthesis."}),nextAction:Object.freeze(nextAction(source))});
},connectionString);}

export const stewardCommandCenterPolicy=Object.freeze({activeAdvisorAssignmentRequired:true,participantIdentityPermittedForOperationalFollowup:true,rawAnswersPermitted:false,contentIntelligenceThreshold:5,sponsorVisibility:false});
