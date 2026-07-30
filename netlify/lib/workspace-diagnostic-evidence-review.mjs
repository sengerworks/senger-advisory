import { withNeonWorkspaceTransaction } from "./neon-workspace-database.mjs";
import { validateDiagnosticContextId } from "./workspace-diagnostic-context.mjs";

export class DiagnosticEvidenceReviewInputError extends Error {}
export class DiagnosticEvidenceReviewAccessError extends Error {}
export class DiagnosticEvidenceReviewStateError extends Error {}

function evidenceId(value) {
  const id = String(value || "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    throw new DiagnosticEvidenceReviewInputError("Choose a valid evidence record.");
  }
  return id;
}

export function validateEvidenceReviewInput(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)
    || Object.keys(value).sort().join(",") !== "decision,diagnosticId,evidenceId,reviewNote") {
    throw new DiagnosticEvidenceReviewInputError("Enter one bounded evidence-review decision.");
  }
  const decision = String(value.decision || "");
  const reviewNote = String(value.reviewNote || "").trim();
  if (!new Set(["approved", "excluded"]).has(decision)) throw new DiagnosticEvidenceReviewInputError("Choose approve or exclude.");
  if (reviewNote.length > 500) throw new DiagnosticEvidenceReviewInputError("Keep the review note to 500 characters or fewer.");
  if (decision === "excluded" && !reviewNote) throw new DiagnosticEvidenceReviewInputError("Explain why excluded evidence cannot enter synthesis.");
  return Object.freeze({
    diagnosticId: validateDiagnosticContextId(value.diagnosticId),
    evidenceId: evidenceId(value.evidenceId),
    decision,
    reviewNote
  });
}

export async function requireAdvisorAssignment(query, { diagnosticId, userId, now }) {
  const assignment = await query(
    `SELECT id, purpose, starts_at, expires_at
     FROM app_operations.diagnostic_advisor_assignments
     WHERE diagnostic_id = $1 AND advisor_clerk_user_id = $2
       AND revoked_at IS NULL AND starts_at <= $3::timestamptz AND expires_at > $3::timestamptz
     LIMIT 1`,
    [diagnosticId, userId, now.toISOString()]
  );
  if (assignment.rowCount !== 1) throw new DiagnosticEvidenceReviewAccessError("An active advisor assignment is required for evidence review.");
  return assignment.rows[0];
}

function publicEvidence(row) {
  return Object.freeze({
    evidenceId: row.id,
    sourceQuestionId: row.source_question_id,
    evidenceVersion: row.evidence_version,
    deidentifiedText: row.deidentified_text,
    redactionCategories: row.redaction_categories,
    disclosureRisk: row.disclosure_risk,
    transformationNote: row.transformation_note,
    reviewStatus: row.review_status,
    reviewerType: row.reviewed_by_type,
    reviewNote: row.review_note,
    createdAt: new Date(row.created_at).toISOString(),
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : null
  });
}

export async function getDiagnosticEvidenceReviewQueue(
  { workspaceId, userId, diagnosticId, now = new Date() }, connectionString
) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    const assignment = await requireAdvisorAssignment(query, { diagnosticId, userId, now });
    const result = await query(
      `SELECT id, source_question_id, evidence_version, deidentified_text,
              redaction_categories, disclosure_risk, transformation_note,
              review_status, reviewed_by_type, review_note, created_at, reviewed_at
       FROM app_private.diagnostic_evidence
       WHERE diagnostic_id = $1
       ORDER BY CASE review_status WHEN 'pending' THEN 0 ELSE 1 END, created_at, id`,
      [diagnosticId]
    );
    const evidence = result.rows.map(publicEvidence);
    return Object.freeze({
      assignment: Object.freeze({
        purpose: assignment.purpose,
        startsAt: new Date(assignment.starts_at).toISOString(),
        expiresAt: new Date(assignment.expires_at).toISOString()
      }),
      progress: Object.freeze({
        total: evidence.length,
        pending: evidence.filter(record => record.reviewStatus === "pending").length,
        approved: evidence.filter(record => record.reviewStatus === "approved").length,
        excluded: evidence.filter(record => record.reviewStatus === "excluded").length,
        highRiskPending: evidence.filter(record => record.reviewStatus === "pending" && record.disclosureRisk === "high").length
      }),
      evidence
    });
  }, connectionString);
}

export async function reviewDiagnosticEvidence(
  { workspaceId, userId, input, now = new Date() }, connectionString
) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    await requireAdvisorAssignment(query, { diagnosticId: input.diagnosticId, userId, now });
    const result = await query(
      `UPDATE app_private.diagnostic_evidence
       SET review_status = $4, reviewed_by_type = 'human', review_note = $5,
           reviewed_by_clerk_user_id = $3, reviewed_at = $6::timestamptz
       WHERE diagnostic_id = $1 AND id = $2 AND review_status = 'pending'
       RETURNING id, source_question_id, evidence_version, deidentified_text,
                 redaction_categories, disclosure_risk, transformation_note,
                 review_status, reviewed_by_type, review_note, created_at, reviewed_at`,
      [input.diagnosticId, input.evidenceId, userId, input.decision, input.reviewNote, now.toISOString()]
    );
    if (result.rowCount !== 1) throw new DiagnosticEvidenceReviewStateError("That evidence record is no longer pending review.");
    await query(
      `INSERT INTO app_operations.audit_events
        (workspace_id, actor_clerk_user_id, action, target_type, target_id, metadata)
       VALUES ($1, $2, 'diagnostic.evidence-reviewed', 'diagnostic-evidence', $3, $4::jsonb)`,
      [workspaceId, userId, input.evidenceId, JSON.stringify({
        diagnosticId: input.diagnosticId,
        decision: input.decision,
        reviewerType: "human"
      })]
    );
    return publicEvidence(result.rows[0]);
  }, connectionString);
}
