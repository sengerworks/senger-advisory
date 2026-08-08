import { withNeonWorkspaceTransaction } from "./neon-workspace-database.mjs";
import { decryptDiagnosticResponsePayload } from "./workspace-diagnostic-interview.mjs";
import { requireAdvisorAssignment } from "./workspace-diagnostic-evidence-review.mjs";

export class DiagnosticEvidencePreparationStateError extends Error {}

export async function loadNextSubmittedInterview(
  { workspaceId, userId, diagnosticId, now = new Date() }, connectionString
) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    await requireAdvisorAssignment(query, { diagnosticId, userId, now });
    const result = await query(
      `SELECT source.id,source.interview_version,source.encrypted_response_payload
       FROM (
         SELECT interview.id,'1.0.0'::text AS interview_version,interview.encrypted_response_payload,interview.submitted_at
         FROM app_private.diagnostic_interviews interview
         WHERE interview.diagnostic_id=$1 AND interview.status='submitted' AND interview.encrypted_response_payload IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM app_operations.diagnostic_v2_collection_activations activation WHERE activation.diagnostic_id=interview.diagnostic_id AND activation.deactivated_at IS NULL)
           AND NOT EXISTS (SELECT 1 FROM app_private.diagnostic_evidence evidence WHERE evidence.workspace_id=interview.workspace_id AND evidence.source_interview_id=interview.id)
         UNION ALL
         SELECT interview.id,interview.interview_version,interview.encrypted_response_payload,interview.submitted_at
         FROM app_private.diagnostic_interviews_v2 interview
         JOIN app_operations.diagnostic_v2_collection_activations activation ON activation.workspace_id=interview.workspace_id AND activation.diagnostic_id=interview.diagnostic_id AND activation.protocol_id=interview.protocol_id AND activation.deactivated_at IS NULL
         WHERE interview.diagnostic_id=$1 AND interview.status='submitted' AND interview.encrypted_response_payload IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM app_private.diagnostic_evidence evidence WHERE evidence.workspace_id=interview.workspace_id AND evidence.source_interview_v2_id=interview.id)
       ) source ORDER BY source.submitted_at,source.id LIMIT 1`,
      [diagnosticId]
    );
    if (!result.rows[0]) return null;
    const decrypted = decryptDiagnosticResponsePayload(result.rows[0].encrypted_response_payload);
    const followUpById=new Map((decrypted.followUps||[]).map(item=>[item.followUpId,item]));
    const followUpAnswers=(decrypted.followUpAnswers||[]).map(answer=>{const followUp=followUpById.get(answer.followUpId);if(!followUp)throw new DiagnosticEvidencePreparationStateError("A governed clarification reference is missing.");return{questionId:`${followUp.questionId}.${followUp.promptType}`,answerText:answer.answerText};});
    return Object.freeze({ interviewId: result.rows[0].id, interviewVersion: result.rows[0].interview_version, answers: Object.freeze([...(decrypted.answers||[]),...followUpAnswers]) });
  }, connectionString);
}

export async function persistPreparedDiagnosticEvidence(
  { workspaceId, userId, diagnosticId, interviewId, interviewVersion = "1.0.0", evidence, model, now = new Date() }, connectionString
) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    await requireAdvisorAssignment(query, { diagnosticId, userId, now });
    if (!new Set(["1.0.0","2.0.0"]).has(interviewVersion)) throw new DiagnosticEvidencePreparationStateError("That interview version is not supported for evidence preparation.");
    const v2 = interviewVersion === "2.0.0";
    const source = await query(
      v2
        ? `SELECT interview.id FROM app_private.diagnostic_interviews_v2 interview
           JOIN app_operations.diagnostic_v2_collection_activations activation ON activation.workspace_id=interview.workspace_id AND activation.diagnostic_id=interview.diagnostic_id AND activation.protocol_id=interview.protocol_id AND activation.deactivated_at IS NULL
           WHERE interview.id=$1 AND interview.diagnostic_id=$2 AND interview.status='submitted'
             AND NOT EXISTS (SELECT 1 FROM app_private.diagnostic_evidence candidate WHERE candidate.workspace_id=interview.workspace_id AND candidate.source_interview_v2_id=interview.id) FOR UPDATE OF interview`
        : `SELECT interview.id FROM app_private.diagnostic_interviews interview
           WHERE interview.id=$1 AND interview.diagnostic_id=$2 AND interview.status='submitted'
             AND NOT EXISTS (SELECT 1 FROM app_operations.diagnostic_v2_collection_activations activation WHERE activation.diagnostic_id=interview.diagnostic_id AND activation.deactivated_at IS NULL)
             AND NOT EXISTS (SELECT 1 FROM app_private.diagnostic_evidence candidate WHERE candidate.workspace_id=interview.workspace_id AND candidate.source_interview_id=interview.id) FOR UPDATE OF interview`,
      [interviewId, diagnosticId]
    );
    if (source.rowCount !== 1) throw new DiagnosticEvidencePreparationStateError("That submitted interview has already been prepared or is no longer available.");
    if (!Array.isArray(evidence) || evidence.length === 0) {
      await query(
        `UPDATE app_shared.diagnostics SET human_review_status = 'required', updated_at = $2::timestamptz WHERE id = $1`,
        [diagnosticId, now.toISOString()]
      );
      return { prepared: false, evidenceCount: 0, requiresManualReview: true };
    }
    for (const record of evidence) {
      await query(
        `INSERT INTO app_private.diagnostic_evidence
          (id, workspace_id, diagnostic_id, source_interview_id, source_interview_v2_id, source_question_id,
           evidence_version, deidentified_text, redaction_categories, disclosure_risk,
           transformation_note, review_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, 'pending')`,
        [record.evidenceId, workspaceId, diagnosticId, v2 ? null : interviewId, v2 ? interviewId : null, record.sourceQuestionId,
          record.evidenceVersion, record.deidentifiedText, JSON.stringify(record.redactionCategories),
          record.disclosureRisk, record.transformationNote]
      );
    }
    await query(
      `UPDATE ${v2 ? "app_private.diagnostic_interviews_v2" : "app_private.diagnostic_interviews"} SET status = 'review-required', updated_at = $2::timestamptz WHERE id = $1`,
      [interviewId, now.toISOString()]
    );
    await query(
      `UPDATE app_shared.diagnostics SET human_review_status = 'in-review', updated_at = $2::timestamptz WHERE id = $1`,
      [diagnosticId, now.toISOString()]
    );
    await query(
      `INSERT INTO app_operations.audit_events
        (workspace_id, actor_clerk_user_id, action, target_type, target_id, metadata)
       VALUES ($1, $2, 'diagnostic.evidence-prepared', 'diagnostic', $3, $4::jsonb)`,
      [workspaceId, userId, diagnosticId, JSON.stringify({
        evidenceVersion: evidence[0].evidenceVersion,
        interviewVersion,
        candidateCount: evidence.length,
        highRiskCount: evidence.filter(record => record.disclosureRisk === "high").length,
        model
      })]
    );
    return {
      prepared: true,
      evidenceCount: evidence.length,
      highRiskCount: evidence.filter(record => record.disclosureRisk === "high").length,
      requiresManualReview: true
    };
  }, connectionString);
}

export async function prepareNextDiagnosticInterviewEvidence({
  workspaceId, userId, diagnosticId, deidentify, model, connectionString
}) {
  const source = await loadNextSubmittedInterview({ workspaceId, userId, diagnosticId }, connectionString);
  if (!source) return { prepared: false, evidenceCount: 0, queueEmpty: true };
  const evidence = await deidentify({ diagnosticId, interviewId: source.interviewId, answers: source.answers });
  return persistPreparedDiagnosticEvidence({ workspaceId, userId, diagnosticId, interviewId: source.interviewId, interviewVersion: source.interviewVersion, evidence, model }, connectionString);
}
