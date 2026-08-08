import { withNeonWorkspaceTransaction } from "./neon-workspace-database.mjs";
import { requireAdvisorAssignment } from "./workspace-diagnostic-evidence-review.mjs";

export class DiagnosticSynthesisStateError extends Error {}

function publicFinding(row) {
  if (!row) return null;
  return Object.freeze({
    findingId: row.id,
    diagnosticRecordVersion: row.diagnostic_record_version,
    synthesisVersion: row.synthesis_version,
    status: row.status,
    advisorReviewStatus: row.advisor_review_status,
    advisorReviewNote: row.advisor_review_note,
    advisorReviewedAt: row.advisor_reviewed_at ? new Date(row.advisor_reviewed_at).toISOString() : null,
    confidence: row.confidence,
    themes: row.record_payload.themes,
    hypothesis: row.record_payload.hypothesis,
    createdAt: new Date(row.created_at).toISOString()
  });
}

export async function loadApprovedEvidenceForSynthesis({ workspaceId, userId, diagnosticId, now = new Date() }, connectionString) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    await requireAdvisorAssignment(query, { diagnosticId, userId, now });
    const existing = await query(`SELECT id FROM app_shared.diagnostic_findings WHERE diagnostic_id = $1`, [diagnosticId]);
    if (existing.rowCount) throw new DiagnosticSynthesisStateError("A synthesis draft already exists for this diagnostic.");
    const result = await query(
      `SELECT id, source_question_id, deidentified_text, review_status
       FROM app_private.diagnostic_evidence WHERE diagnostic_id = $1 ORDER BY created_at, id`,
      [diagnosticId]
    );
    if (result.rows.some(row => row.review_status === "pending")) throw new DiagnosticSynthesisStateError("Review every evidence candidate before synthesis.");
    const evidence = result.rows.filter(row => row.review_status === "approved").map(row => Object.freeze({ evidenceId: row.id, sourceQuestionId: row.source_question_id, deidentifiedText: row.deidentified_text }));
    if (evidence.length < 2) throw new DiagnosticSynthesisStateError("Approve at least two evidence records before synthesis.");
    const v2=await query(
      `SELECT frame.frame_payload,protocol.governed_questions
       FROM app_operations.diagnostic_v2_collection_activations activation
       JOIN app_private.diagnostic_frames_v2 frame ON frame.workspace_id=activation.workspace_id AND frame.diagnostic_id=activation.diagnostic_id AND frame.id=activation.frame_id AND frame.status='approved'
       JOIN app_shared.diagnostic_protocols_v2 protocol ON protocol.workspace_id=activation.workspace_id AND protocol.diagnostic_id=activation.diagnostic_id AND protocol.id=activation.protocol_id
       WHERE activation.diagnostic_id=$1 AND activation.deactivated_at IS NULL LIMIT 1`,[diagnosticId]
    );
    if(!v2.rows[0])return Object.freeze({evidence:Object.freeze(evidence),methodContext:null});
    const frame=v2.rows[0].frame_payload,questionById=new Map(v2.rows[0].governed_questions.map(question=>[question.questionId,question]));
    const annotated=evidence.map(record=>{const question=questionById.get(record.sourceQuestionId.split(".")[0]);return Object.freeze({...record,evidenceLayerId:question?.evidenceLayerId||"unknown",mechanismIds:Object.freeze(question?.mechanismIds||[])});});
    return Object.freeze({evidence:Object.freeze(annotated),methodContext:Object.freeze({methodVersion:"2.0.0",frame:Object.freeze({executionDemand:frame.executionDemand,diagnosticQuestion:frame.diagnosticQuestion,leadershipDecision:frame.leadershipDecision,performanceConsequences:Object.freeze(frame.performanceConsequences||[]),complexityObservations:Object.freeze(frame.complexityObservations||[])})})});
  }, connectionString);
}

export async function persistDiagnosticSynthesis({ workspaceId, userId, diagnosticId, synthesis, model, now = new Date() }, connectionString) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    await requireAdvisorAssignment(query, { diagnosticId, userId, now });
    const pending = await query(`SELECT count(*)::integer AS count FROM app_private.diagnostic_evidence WHERE diagnostic_id = $1 AND review_status = 'pending'`, [diagnosticId]);
    if (pending.rows[0].count) throw new DiagnosticSynthesisStateError("Evidence review changed before synthesis could be saved.");
    const payload = { themes: synthesis.themes, hypothesis: synthesis.hypothesis, methodContext: synthesis.methodContext||null, generatedBy: { kind: "ai-assisted-advisor-draft", model } };
    const inserted = await query(
      `INSERT INTO app_shared.diagnostic_findings
        (workspace_id, diagnostic_id, diagnostic_record_version, synthesis_version, record_payload, confidence, status)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, 'draft')
       RETURNING id, diagnostic_record_version, synthesis_version, record_payload, confidence, status,
         advisor_review_status, advisor_review_note, advisor_reviewed_at, created_at`,
      [workspaceId, diagnosticId, synthesis.methodVersion||"1.0.0", synthesis.hypothesis.synthesisVersion, JSON.stringify(payload), synthesis.hypothesis.confidence]
    );
    await query(`UPDATE app_shared.diagnostics SET state = 'synthesis', human_review_status = 'resolved', updated_at = $2::timestamptz WHERE id = $1`, [diagnosticId, now.toISOString()]);
    await query(
      `INSERT INTO app_operations.audit_events
        (workspace_id, actor_clerk_user_id, action, target_type, target_id, metadata)
       VALUES ($1, $2, 'diagnostic.synthesis-drafted', 'diagnostic', $3, $4::jsonb)`,
      [workspaceId, userId, diagnosticId, JSON.stringify({ diagnosticRecordVersion:synthesis.methodVersion||"1.0.0",synthesisVersion: synthesis.hypothesis.synthesisVersion, themeCount: synthesis.themes.length, confidence: synthesis.hypothesis.confidence, mechanismScoresProduced:false,model })]
    );
    return publicFinding(inserted.rows[0]);
  }, connectionString);
}

export async function createDiagnosticSynthesis({ workspaceId, userId, diagnosticId, synthesize, model, connectionString }) {
  const source = await loadApprovedEvidenceForSynthesis({ workspaceId, userId, diagnosticId }, connectionString);
  const synthesis = await synthesize({ diagnosticId, evidence:source.evidence, methodContext:source.methodContext });
  return persistDiagnosticSynthesis({ workspaceId, userId, diagnosticId, synthesis, model }, connectionString);
}

export async function getDiagnosticSynthesis({ workspaceId, userId, diagnosticId, now = new Date() }, connectionString) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    await requireAdvisorAssignment(query, { diagnosticId, userId, now });
    const result = await query(
      `SELECT id, diagnostic_record_version, synthesis_version, record_payload, confidence, status,
         advisor_review_status, advisor_review_note, advisor_reviewed_at, created_at
       FROM app_shared.diagnostic_findings WHERE diagnostic_id = $1 LIMIT 1`,
      [diagnosticId]
    );
    return publicFinding(result.rows[0]);
  }, connectionString);
}

export async function reviewDiagnosticSynthesis({ workspaceId, userId, diagnosticId, decision, reviewNote, now = new Date() }, connectionString) {
  if (!new Set(["approved", "revision-required"]).has(decision)) throw new DiagnosticSynthesisStateError("Choose approve or request revision.");
  const note = String(reviewNote || "").trim();
  if (note.length > 1200) throw new DiagnosticSynthesisStateError("Advisor review notes must be 1,200 characters or fewer.");
  if (decision === "revision-required" && note.length < 20) throw new DiagnosticSynthesisStateError("Explain what must change before requesting revision.");
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    await requireAdvisorAssignment(query, { diagnosticId, userId, now });
    const result = await query(
      `UPDATE app_shared.diagnostic_findings
       SET advisor_review_status = $2, advisor_review_note = $3,
         advisor_reviewed_by_clerk_user_id = $4, advisor_reviewed_at = $5::timestamptz,
         status = CASE WHEN $2 = 'revision-required' THEN 'revision-required' ELSE 'draft' END
       WHERE diagnostic_id = $1 AND advisor_review_status = 'pending'
       RETURNING id, diagnostic_record_version, synthesis_version, record_payload, confidence, status,
         advisor_review_status, advisor_review_note, advisor_reviewed_at, created_at`,
      [diagnosticId, decision, note, userId, now.toISOString()]
    );
    if (!result.rowCount) throw new DiagnosticSynthesisStateError("This synthesis draft has already received an advisor decision.");
    await query(
      `INSERT INTO app_operations.audit_events
        (workspace_id, actor_clerk_user_id, action, target_type, target_id, metadata)
       VALUES ($1, $2, $3, 'diagnostic', $4, $5::jsonb)`,
      [workspaceId, userId, decision === "approved" ? "diagnostic.synthesis-advisor-approved" : "diagnostic.synthesis-revision-requested", diagnosticId, JSON.stringify({ reviewNote: note })]
    );
    if (decision === "approved") {
      await query(
        `UPDATE app_shared.diagnostics SET state = 'leadership-validation', updated_at = $2::timestamptz
         WHERE id = $1 AND state = 'synthesis'`,
        [diagnosticId, now.toISOString()]
      );
    }
    return publicFinding(result.rows[0]);
  }, connectionString);
}
