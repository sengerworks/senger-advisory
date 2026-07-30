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
      `SELECT interview.id, interview.encrypted_response_payload
       FROM app_private.diagnostic_interviews interview
       WHERE interview.diagnostic_id = $1 AND interview.status = 'submitted'
         AND interview.encrypted_response_payload IS NOT NULL
         AND NOT EXISTS (
           SELECT 1 FROM app_private.diagnostic_evidence evidence
           WHERE evidence.workspace_id = interview.workspace_id
             AND evidence.source_interview_id = interview.id
         )
       ORDER BY interview.submitted_at, interview.id
       LIMIT 1`,
      [diagnosticId]
    );
    if (!result.rows[0]) return null;
    const decrypted = decryptDiagnosticResponsePayload(result.rows[0].encrypted_response_payload);
    return Object.freeze({ interviewId: result.rows[0].id, answers: decrypted.answers });
  }, connectionString);
}

export async function persistPreparedDiagnosticEvidence(
  { workspaceId, userId, diagnosticId, interviewId, evidence, model, now = new Date() }, connectionString
) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    await requireAdvisorAssignment(query, { diagnosticId, userId, now });
    const source = await query(
      `SELECT id FROM app_private.diagnostic_interviews
       WHERE id = $1 AND diagnostic_id = $2 AND status = 'submitted'
         AND NOT EXISTS (
           SELECT 1 FROM app_private.diagnostic_evidence candidate
           WHERE candidate.workspace_id = app_private.diagnostic_interviews.workspace_id
             AND candidate.source_interview_id = app_private.diagnostic_interviews.id
         )
       FOR UPDATE`,
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
          (id, workspace_id, diagnostic_id, source_interview_id, source_question_id,
           evidence_version, deidentified_text, redaction_categories, disclosure_risk,
           transformation_note, review_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, 'pending')`,
        [record.evidenceId, workspaceId, diagnosticId, interviewId, record.sourceQuestionId,
          record.evidenceVersion, record.deidentifiedText, JSON.stringify(record.redactionCategories),
          record.disclosureRisk, record.transformationNote]
      );
    }
    await query(
      `UPDATE app_private.diagnostic_interviews SET status = 'review-required', updated_at = $2::timestamptz WHERE id = $1`,
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
  return persistPreparedDiagnosticEvidence({ workspaceId, userId, diagnosticId, interviewId: source.interviewId, evidence, model }, connectionString);
}
