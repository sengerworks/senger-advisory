import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "node:crypto";
import { withNeonWorkspaceTransaction } from "./neon-workspace-database.mjs";

export class DiagnosticInterviewInputError extends Error {}
export class DiagnosticInterviewStateError extends Error {}

function key() {
  const configured = process.env.DIAGNOSTIC_RESPONSE_ENCRYPTION_KEY;
  if (configured) {
    const value = Buffer.from(configured, "base64");
    if (value.length === 32) return value;
  }
  if (process.env.WORKSPACE_ENVIRONMENT === "development" && process.env.CLERK_SECRET_KEY) {
    return createHash("sha256").update(`senger-diagnostic-development-v1:${process.env.CLERK_SECRET_KEY}`).digest();
  }
  throw new Error("Diagnostic response encryption is not configured.");
}
function encrypt(value) {
  const iv=randomBytes(12); const cipher=createCipheriv("aes-256-gcm",key(),iv);
  const content=Buffer.concat([cipher.update(JSON.stringify(value)),cipher.final()]);
  return Buffer.concat([iv,cipher.getAuthTag(),content]);
}
function decrypt(value) {
  const data=Buffer.from(value); const decipher=createDecipheriv("aes-256-gcm",key(),data.subarray(0,12));
  decipher.setAuthTag(data.subarray(12,28));
  return JSON.parse(Buffer.concat([decipher.update(data.subarray(28)),decipher.final()]).toString("utf8"));
}
export function validateInterviewAnswers(value,{submit=false}={}){
  if(!value||typeof value!=="object"||Object.keys(value).sort().join(",")!=="answers,diagnosticId")throw new DiagnosticInterviewInputError("Enter the diagnostic interview answers.");
  if(!Array.isArray(value.answers)||value.answers.length>15)throw new DiagnosticInterviewInputError("The interview supports fifteen core answers.");
  const answers=value.answers.map((answer,index)=>{
    if(!answer||Object.keys(answer).sort().join(",")!=="answerText,questionId")throw new DiagnosticInterviewInputError(`Answer ${index+1} is invalid.`);
    const answerText=String(answer.answerText||"").trim();
    if(answerText.length>6000)throw new DiagnosticInterviewInputError(`Answer ${index+1} is too long.`);
    if(submit&&answerText.length<40)throw new DiagnosticInterviewInputError(`Add at least 40 characters of context to question ${index+1}.`);
    return{questionId:String(answer.questionId),answerText};
  });
  if(new Set(answers.map(a=>a.questionId)).size!==answers.length)throw new DiagnosticInterviewInputError("Each question can be answered once.");
  if(submit&&answers.length!==15)throw new DiagnosticInterviewInputError("Answer all fifteen questions before submission.");
  return{diagnosticId:String(value.diagnosticId),answers};
}
export async function getParticipantInterview({workspaceId,userId,diagnosticId},connectionString){
 return withNeonWorkspaceTransaction(workspaceId,async({query})=>{
  const source=await query(`SELECT slot.id AS slot_id, protocol.id AS protocol_id, protocol.governed_questions
   FROM app_identity.diagnostic_participant_slots slot JOIN app_shared.diagnostic_protocols protocol ON protocol.workspace_id=slot.workspace_id AND protocol.diagnostic_id=slot.diagnostic_id
   WHERE slot.diagnostic_id=$1 AND slot.clerk_user_id=$2 AND slot.notice_accepted_at IS NOT NULL AND slot.revoked_at IS NULL`,[diagnosticId,userId]);
  if(source.rowCount!==1)throw new DiagnosticInterviewStateError("Accept the diagnostic privacy notice before beginning.");
  let result=await query(`SELECT id,status,encrypted_response_payload,updated_at FROM app_private.diagnostic_interviews WHERE diagnostic_id=$1 AND participant_slot_id=$2`,[diagnosticId,source.rows[0].slot_id]);
  if(!result.rows[0])result=await query(`INSERT INTO app_private.diagnostic_interviews(id,workspace_id,diagnostic_id,participant_slot_id,protocol_id,collection_mode,status,encryption_version,encryption_key_ref,encrypted_response_payload)
   VALUES($1,$2,$3,$4,$5,'automated-written','in-progress','aes-256-gcm-v1','diagnostic-development-v1',$6) RETURNING id,status,encrypted_response_payload,updated_at`,[randomUUID(),workspaceId,diagnosticId,source.rows[0].slot_id,source.rows[0].protocol_id,encrypt({answers:[]})]);
  const row=result.rows[0]; return{interviewId:row.id,status:row.status,questions:source.rows[0].governed_questions,answers:row.encrypted_response_payload?decrypt(row.encrypted_response_payload).answers:[],updatedAt:new Date(row.updated_at).toISOString()};
 },connectionString);
}
export async function saveParticipantInterview({workspaceId,userId,input,submit=false,now=new Date()},connectionString){
 return withNeonWorkspaceTransaction(workspaceId,async({query})=>{
  const status=submit?"submitted":"in-progress";
  const result=await query(`UPDATE app_private.diagnostic_interviews interview SET encrypted_response_payload=$4,status=$5,submitted_at=CASE WHEN $5='submitted' THEN $6::timestamptz ELSE NULL::timestamptz END,updated_at=$6::timestamptz
   FROM app_identity.diagnostic_participant_slots slot WHERE interview.workspace_id=$1 AND interview.diagnostic_id=$2 AND interview.participant_slot_id=slot.id AND slot.clerk_user_id=$3 AND interview.status='in-progress' RETURNING interview.id,interview.status,interview.updated_at`,[workspaceId,input.diagnosticId,userId,encrypt({answers:input.answers}),status,now.toISOString()]);
  if(result.rowCount!==1)throw new DiagnosticInterviewStateError("This interview is not available for changes.");
  return{saved:true,submitted:submit,updatedAt:new Date(result.rows[0].updated_at).toISOString()};
 },connectionString);
}
