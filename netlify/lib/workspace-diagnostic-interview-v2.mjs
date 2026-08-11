import { randomUUID } from "node:crypto";
import { decryptDiagnosticResponsePayload, encryptDiagnosticResponsePayload } from "./workspace-diagnostic-interview.mjs";
import { withNeonWorkspaceTransaction } from "./neon-workspace-database.mjs";
import { validateDiagnosticContextId } from "./workspace-diagnostic-context.mjs";
import { planAdaptiveFollowUpsV2 } from "../../diagnostic-adaptive-follow-up-v2.js";

export const DIAGNOSTIC_INTERVIEW_VERSION_V2 = "2.0.0";
export class DiagnosticInterviewV2InputError extends Error {}
export class DiagnosticInterviewV2StateError extends Error {}

export function validateInterviewAnswersV2(value, protocolQuestions, { submit = false, followUps = [] } = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).some(key=>!["answers","diagnosticId","followUpAnswers"].includes(key))) throw new DiagnosticInterviewV2InputError("Enter the v2 diagnostic interview answers.");
  const diagnosticId = validateDiagnosticContextId(value.diagnosticId);
  if (!Array.isArray(protocolQuestions) || protocolQuestions.length < 12 || protocolQuestions.length > 18) throw new DiagnosticInterviewV2StateError("The approved v2 protocol is not available.");
  if (!Array.isArray(value.answers) || value.answers.length > protocolQuestions.length) throw new DiagnosticInterviewV2InputError(`The interview supports ${protocolQuestions.length} core answers.`);
  const allowed = new Set(protocolQuestions.map(question => question.questionId));
  const answers = value.answers.map((answer, index) => {
    if (!answer || typeof answer !== "object" || Array.isArray(answer) || Object.keys(answer).sort().join(",") !== "answerText,questionId") throw new DiagnosticInterviewV2InputError(`Answer ${index + 1} is invalid.`);
    const questionId = String(answer.questionId || ""), answerText = String(answer.answerText || "").trim();
    if (!allowed.has(questionId)) throw new DiagnosticInterviewV2InputError("Every answer must belong to the approved v2 protocol.");
    if (answerText.length > 6000) throw new DiagnosticInterviewV2InputError(`Answer ${index + 1} is too long.`);
    if (submit && answerText.length < 40) throw new DiagnosticInterviewV2InputError(`Add at least 40 characters of context to ${questionId}.`);
    return Object.freeze({ questionId, answerText });
  });
  if (new Set(answers.map(answer => answer.questionId)).size !== answers.length) throw new DiagnosticInterviewV2InputError("Each question can be answered once.");
  if (submit && (answers.length !== allowed.size || answers.some(answer => !allowed.has(answer.questionId)))) throw new DiagnosticInterviewV2InputError("Answer every approved core question before submission.");
  const allowedFollowUps=new Set(followUps.map(item=>item.followUpId));
  const followUpAnswers=(value.followUpAnswers||[]).map((answer,index)=>{if(!answer||typeof answer!=="object"||Array.isArray(answer)||Object.keys(answer).sort().join(",")!=="answerText,followUpId")throw new DiagnosticInterviewV2InputError(`Follow-up answer ${index+1} is invalid.`);const followUpId=String(answer.followUpId||""),answerText=String(answer.answerText||"").trim();if(!allowedFollowUps.has(followUpId))throw new DiagnosticInterviewV2InputError("Every follow-up answer must belong to this interview.");if(answerText.length>4000)throw new DiagnosticInterviewV2InputError(`Follow-up answer ${index+1} is too long.`);if(submit&&answerText.length<40)throw new DiagnosticInterviewV2InputError("Add at least 40 characters to every requested clarification.");return Object.freeze({followUpId,answerText});});
  if(new Set(followUpAnswers.map(answer=>answer.followUpId)).size!==followUpAnswers.length)throw new DiagnosticInterviewV2InputError("Each follow-up can be answered once.");
  if(submit&&followUps.length&&followUpAnswers.length!==followUps.length)throw new DiagnosticInterviewV2InputError("Answer every requested clarification before final submission.");
  return Object.freeze({ diagnosticId, answers: Object.freeze(answers), followUpAnswers:Object.freeze(followUpAnswers) });
}

async function participantSource(query, diagnosticId, userId) {
  const result = await query(
    `SELECT slot.id AS slot_id, protocol.id AS protocol_id, protocol.governed_questions
     FROM app_identity.diagnostic_participant_slots slot
     JOIN app_shared.diagnostic_protocols_v2 protocol ON protocol.workspace_id=slot.workspace_id AND protocol.diagnostic_id=slot.diagnostic_id AND protocol.steward_finalized_at IS NOT NULL
     JOIN app_operations.diagnostic_v2_collection_activations activation ON activation.workspace_id=protocol.workspace_id AND activation.diagnostic_id=protocol.diagnostic_id AND activation.protocol_id=protocol.id AND activation.deactivated_at IS NULL
     WHERE slot.diagnostic_id=$1 AND slot.clerk_user_id=$2 AND slot.notice_accepted_at IS NOT NULL AND slot.revoked_at IS NULL`, [diagnosticId,userId]
  );
  if (result.rowCount !== 1) throw new DiagnosticInterviewV2StateError("Accept the diagnostic privacy notice before beginning the v2 interview.");
  return result.rows[0];
}

export async function getParticipantInterviewV2({ workspaceId, userId, diagnosticId }, connectionString) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    diagnosticId = validateDiagnosticContextId(diagnosticId);
    const source = await participantSource(query, diagnosticId, userId);
    let result = await query("SELECT id,status,encrypted_response_payload,updated_at FROM app_private.diagnostic_interviews_v2 WHERE diagnostic_id=$1 AND participant_slot_id=$2", [diagnosticId,source.slot_id]);
    if (!result.rows[0]) result = await query(
      `INSERT INTO app_private.diagnostic_interviews_v2
        (id,workspace_id,diagnostic_id,participant_slot_id,protocol_id,interview_version,collection_mode,status,encryption_version,encryption_key_ref,encrypted_response_payload)
       VALUES($1,$2,$3,$4,$5,'2.0.0','automated-written','in-progress','aes-256-gcm-v1','diagnostic-development-v1',$6)
       RETURNING id,status,encrypted_response_payload,updated_at`,
      [randomUUID(),workspaceId,diagnosticId,source.slot_id,source.protocol_id,encryptDiagnosticResponsePayload({answers:[]})]
    );
    const row=result.rows[0], payload=row.encrypted_response_payload?decryptDiagnosticResponsePayload(row.encrypted_response_payload):{answers:[]};
    return Object.freeze({interviewId:row.id,interviewVersion:DIAGNOSTIC_INTERVIEW_VERSION_V2,status:row.status,questions:Object.freeze(source.governed_questions),answers:Object.freeze(payload.answers||[]),followUps:Object.freeze(payload.followUps||[]),followUpAnswers:Object.freeze(payload.followUpAnswers||[]),updatedAt:new Date(row.updated_at).toISOString()});
  }, connectionString);
}

export async function saveParticipantInterviewV2({workspaceId,userId,input,submit=false,now=new Date()},connectionString) {
  return withNeonWorkspaceTransaction(workspaceId,async({query})=>{
    const source=await participantSource(query,input.diagnosticId,userId);
    const current=await query("SELECT id,status,encrypted_response_payload FROM app_private.diagnostic_interviews_v2 WHERE diagnostic_id=$1 AND participant_slot_id=$2 FOR UPDATE",[input.diagnosticId,source.slot_id]);
    if(current.rowCount!==1||current.rows[0].status!=="in-progress")throw new DiagnosticInterviewV2StateError("This v2 interview is not available for changes.");
    const payload=current.rows[0].encrypted_response_payload?decryptDiagnosticResponsePayload(current.rows[0].encrypted_response_payload):{};
    const existingFollowUps=payload.followUps||[];
    const validated=validateInterviewAnswersV2(input,source.governed_questions,{submit,followUps:existingFollowUps});
    const protocol={protocolId:source.protocol_id,status:"approved",questions:source.governed_questions};
    const followUps=submit&&!existingFollowUps.length?planAdaptiveFollowUpsV2({protocol,interviewInstanceId:current.rows[0].id,answers:validated.answers}):existingFollowUps;
    const clarificationRequired=submit&&followUps.length>0&&!existingFollowUps.length;
    const status=submit&&!clarificationRequired?"submitted":"in-progress";
    const encrypted=encryptDiagnosticResponsePayload({answers:validated.answers,followUps,followUpAnswers:validated.followUpAnswers});
    const result=await query(
      `UPDATE app_private.diagnostic_interviews_v2 interview SET encrypted_response_payload=$4,status=$5,
       submitted_at=CASE WHEN $5='submitted' THEN $6::timestamptz ELSE NULL::timestamptz END,updated_at=$6::timestamptz
       FROM app_identity.diagnostic_participant_slots slot
       WHERE interview.workspace_id=$1 AND interview.diagnostic_id=$2 AND interview.participant_slot_id=slot.id
         AND slot.clerk_user_id=$3 AND interview.protocol_id=$7 AND interview.status='in-progress'
       RETURNING interview.id,interview.status,interview.updated_at`,
      [workspaceId,validated.diagnosticId,userId,encrypted,status,now.toISOString(),source.protocol_id]
    );
    if(result.rowCount!==1)throw new DiagnosticInterviewV2StateError("This v2 interview is not available for changes.");
    return Object.freeze({saved:true,submitted:status==="submitted",clarificationRequired,followUpCount:followUps.length,interviewVersion:DIAGNOSTIC_INTERVIEW_VERSION_V2,updatedAt:new Date(result.rows[0].updated_at).toISOString()});
  },connectionString);
}

export async function withdrawParticipantInterviewV2({workspaceId,userId,diagnosticId,now=new Date()},connectionString) {
  return withNeonWorkspaceTransaction(workspaceId,async({query})=>{
    diagnosticId=validateDiagnosticContextId(diagnosticId);
    const result=await query(
      `UPDATE app_private.diagnostic_interviews_v2 interview SET encrypted_response_payload=NULL,status='withdrawn',submitted_at=NULL,withdrawn_at=$4::timestamptz,updated_at=$4::timestamptz
       FROM app_identity.diagnostic_participant_slots slot
       WHERE interview.workspace_id=$1 AND interview.diagnostic_id=$2 AND interview.participant_slot_id=slot.id AND slot.clerk_user_id=$3 AND interview.status<>'withdrawn'
       RETURNING interview.id`,[workspaceId,diagnosticId,userId,now.toISOString()]
    );
    if(result.rowCount!==1)throw new DiagnosticInterviewV2StateError("This v2 interview is not available for withdrawal.");
    return Object.freeze({withdrawn:true,responseContentDeleted:true,withdrawnAt:now.toISOString()});
  },connectionString);
}

export const workspaceDiagnosticInterviewV2Policy=Object.freeze({interviewVersion:DIAGNOSTIC_INTERVIEW_VERSION_V2,minimumQuestions:12,maximumQuestions:18,maximumAdaptiveFollowUps:3,minimumAnswerCharactersAtSubmission:40,maximumAnswerCharacters:6000,identityFieldsPermitted:false,followUpsStoredEncrypted:true,coreProtocolMutable:false,withdrawalDeletesResponseContent:true,activatesParticipantRoute:false});
