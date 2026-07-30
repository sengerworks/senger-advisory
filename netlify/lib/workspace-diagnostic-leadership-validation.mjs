import { withNeonWorkspaceTransaction } from "./neon-workspace-database.mjs";

export const DIAGNOSTIC_CONFIDENTIALITY_FLOOR = 5;
export const LEADERSHIP_VALIDATION_VERSION = "1.0.0";
export class LeadershipValidationInputError extends Error {}
export class LeadershipValidationStateError extends Error {}

function requiredText(value, name, maximum, minimum = 1) {
  const text = String(value || "").trim();
  if (text.length < minimum || text.length > maximum) throw new LeadershipValidationInputError(`${name} must be between ${minimum} and ${maximum} characters.`);
  return text;
}

function optionalText(value, name, maximum) {
  const text = String(value || "").trim();
  if (text.length > maximum) throw new LeadershipValidationInputError(`${name} must be ${maximum} characters or fewer.`);
  return text;
}

export function validateLeadershipValidationInput(input) {
  const allowed = new Set(["diagnosticId", "resonance", "completeness", "surprised", "missingEvidence", "materialObjection", "objection", "decision", "decisionNote"]);
  if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).some(key => !allowed.has(key)) || Object.keys(input).length !== allowed.size) throw new LeadershipValidationInputError("Submit the complete leadership validation response.");
  if (!["supports", "partially-supports", "challenges"].includes(input.resonance)) throw new LeadershipValidationInputError("Choose how strongly the finding resonates.");
  if (!["complete-enough", "material-gaps"].includes(input.completeness)) throw new LeadershipValidationInputError("Choose whether the finding is complete enough.");
  if (typeof input.surprised !== "boolean" || typeof input.materialObjection !== "boolean") throw new LeadershipValidationInputError("Leadership validation flags must be explicit.");
  if (!["accepted", "revision-required"].includes(input.decision)) throw new LeadershipValidationInputError("Choose accept or request revision.");
  const objection = optionalText(input.objection, "Material objection", 1000);
  const missingEvidence = optionalText(input.missingEvidence, "Missing evidence", 1000);
  const decisionNote = requiredText(input.decisionNote, "Decision note", 1000, 20);
  if (input.materialObjection && objection.length < 20) throw new LeadershipValidationInputError("Explain the material objection before requesting revision.");
  if (input.completeness === "material-gaps" && missingEvidence.length < 20) throw new LeadershipValidationInputError("Describe the material evidence gap.");
  if (input.decision === "accepted" && (input.materialObjection || input.completeness === "material-gaps" || input.resonance === "challenges")) throw new LeadershipValidationInputError("A challenged finding, material gap, or material objection requires revision.");
  return Object.freeze({
    diagnosticId: String(input.diagnosticId || ""), resonance: input.resonance, completeness: input.completeness,
    surprised: input.surprised, missingEvidence, materialObjection: input.materialObjection,
    objection, decision: input.decision, decisionNote
  });
}

function safeFinding(row) {
  if (!row) return null;
  const payload = row.record_payload;
  return Object.freeze({
    findingId: row.id,
    status: row.status,
    confidence: row.confidence,
    themes: payload.themes.map(theme => Object.freeze({
      title: theme.title,
      summary: theme.summary,
      perspectivePattern: theme.perspectivePattern,
      confidence: theme.confidence,
      confidenceBasis: theme.confidenceBasis
    })),
    hypothesis: Object.freeze({
      statement: payload.hypothesis.statement,
      competingExplanations: payload.hypothesis.competingExplanations.map(item => Object.freeze({
        statement: item.statement,
        evidenceNeeded: item.evidenceNeeded
      })),
      blindSpots: [...payload.hypothesis.blindSpots],
      confidence: payload.hypothesis.confidence,
      confidenceBasis: payload.hypothesis.confidenceBasis,
      interventionDirection: payload.hypothesis.interventionDirection
    })
  });
}

export async function getLeadershipValidationView({ workspaceId, diagnosticId }, connectionString) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    const findingResult = await query(
      `SELECT id, record_payload, confidence, status, advisor_review_status
       FROM app_shared.diagnostic_findings WHERE diagnostic_id = $1 LIMIT 1`,
      [diagnosticId]
    );
    const finding = findingResult.rows[0];
    if (!finding || finding.advisor_review_status !== "approved") {
      return Object.freeze({ state: "withheld", reason: "advisor-validation", requiredCompleted: DIAGNOSTIC_CONFIDENTIALITY_FLOOR });
    }
    const progress = await query(
      `SELECT
         count(*) FILTER (WHERE slot.clerk_user_id IS NOT NULL AND slot.revoked_at IS NULL)::integer AS assigned,
         count(*) FILTER (WHERE slot.clerk_user_id IS NOT NULL AND slot.revoked_at IS NULL
           AND interview.status IN ('submitted', 'review-required', 'evidence-ready'))::integer AS completed
       FROM app_identity.diagnostic_participant_slots slot
       LEFT JOIN app_private.diagnostic_interviews interview
         ON interview.workspace_id = slot.workspace_id
        AND interview.diagnostic_id = slot.diagnostic_id
        AND interview.participant_slot_id = slot.id
       WHERE slot.diagnostic_id = $1`,
      [diagnosticId]
    );
    const pendingEvidence = await query(
      `SELECT count(*)::integer AS count FROM app_private.diagnostic_evidence
       WHERE diagnostic_id = $1 AND review_status = 'pending'`,
      [diagnosticId]
    );
    const { assigned, completed } = progress.rows[0];
    const collectionComplete = assigned >= DIAGNOSTIC_CONFIDENTIALITY_FLOOR && completed === assigned;
    if (!collectionComplete || pendingEvidence.rows[0].count > 0) {
      return Object.freeze({
        state: "withheld",
        reason: pendingEvidence.rows[0].count > 0 ? "evidence-review" : "collection-readiness",
        completed,
        requiredCompleted: Math.max(DIAGNOSTIC_CONFIDENTIALITY_FLOOR, assigned)
      });
    }
    const validationResult = await query(
      `SELECT decision, created_at FROM app_operations.diagnostic_leadership_validations
       WHERE diagnostic_id = $1 LIMIT 1`,
      [diagnosticId]
    );
    const validation = validationResult.rows[0]
      ? Object.freeze({ decision: validationResult.rows[0].decision, recordedAt: new Date(validationResult.rows[0].created_at).toISOString() })
      : null;
    return Object.freeze({
      state: "ready",
      confidentiality: Object.freeze({ completed, identityProtected: true, rawResponsesExcluded: true }),
      finding: safeFinding(finding),
      validation
    });
  }, connectionString);
}

export async function recordLeadershipValidation({ workspaceId, userId, input, now = new Date() }, connectionString) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    const findingResult = await query(
      `SELECT id, advisor_review_status FROM app_shared.diagnostic_findings
       WHERE diagnostic_id = $1 AND status = 'draft' FOR UPDATE`,
      [input.diagnosticId]
    );
    const finding = findingResult.rows[0];
    if (!finding || finding.advisor_review_status !== "approved") throw new LeadershipValidationStateError("The finding is not ready for leadership validation.");
    const progress = await query(
      `SELECT
         count(*) FILTER (WHERE slot.clerk_user_id IS NOT NULL AND slot.revoked_at IS NULL)::integer AS assigned,
         count(*) FILTER (WHERE slot.clerk_user_id IS NOT NULL AND slot.revoked_at IS NULL
           AND interview.status IN ('submitted', 'review-required', 'evidence-ready'))::integer AS completed
       FROM app_identity.diagnostic_participant_slots slot
       LEFT JOIN app_private.diagnostic_interviews interview
         ON interview.workspace_id = slot.workspace_id AND interview.diagnostic_id = slot.diagnostic_id
        AND interview.participant_slot_id = slot.id
       WHERE slot.diagnostic_id = $1`,
      [input.diagnosticId]
    );
    const pending = await query(`SELECT count(*)::integer AS count FROM app_private.diagnostic_evidence WHERE diagnostic_id = $1 AND review_status = 'pending'`, [input.diagnosticId]);
    const { assigned, completed } = progress.rows[0];
    if (assigned < DIAGNOSTIC_CONFIDENTIALITY_FLOOR || completed !== assigned || pending.rows[0].count > 0) throw new LeadershipValidationStateError("Collection or confidentiality review is not complete.");
    const payload = {
      resonance: input.resonance, completeness: input.completeness, surprised: input.surprised,
      missingEvidence: input.missingEvidence, materialObjection: input.materialObjection,
      objection: input.objection, decisionNote: input.decisionNote
    };
    let inserted;
    try {
      inserted = await query(
        `INSERT INTO app_operations.diagnostic_leadership_validations
          (workspace_id, diagnostic_id, finding_id, validator_clerk_user_id, validation_version, response_payload, decision, created_at)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8::timestamptz)
         RETURNING id, decision, created_at`,
        [workspaceId, input.diagnosticId, finding.id, userId, LEADERSHIP_VALIDATION_VERSION, JSON.stringify(payload), input.decision, now.toISOString()]
      );
    } catch (error) {
      if (error?.code === "23505") throw new LeadershipValidationStateError("Leadership validation has already been recorded.");
      throw error;
    }
    await query(
      `UPDATE app_shared.diagnostic_findings
       SET status = $2, validated_at = CASE WHEN $2 = 'validated' THEN $3::timestamptz ELSE NULL END
       WHERE id = $1`,
      [finding.id, input.decision === "accepted" ? "validated" : "revision-required", now.toISOString()]
    );
    await query(
      `UPDATE app_shared.diagnostics
       SET state = CASE WHEN $2 = 'accepted' THEN 'leadership-validation' ELSE 'synthesis' END,
         human_review_status = CASE WHEN $2 = 'accepted' THEN 'resolved' ELSE 'required' END,
         updated_at = $3::timestamptz WHERE id = $1`,
      [input.diagnosticId, input.decision, now.toISOString()]
    );
    await query(
      `INSERT INTO app_operations.audit_events
        (workspace_id, actor_clerk_user_id, action, target_type, target_id, metadata)
       VALUES ($1, $2, $3, 'diagnostic', $4, $5::jsonb)`,
      [workspaceId, userId, input.decision === "accepted" ? "diagnostic.leadership-validation-accepted" : "diagnostic.leadership-revision-requested", input.diagnosticId, JSON.stringify({ validationVersion: LEADERSHIP_VALIDATION_VERSION, resonance: input.resonance, completeness: input.completeness, surprised: input.surprised, materialObjection: input.materialObjection })]
    );
    return Object.freeze({ validationId: inserted.rows[0].id, decision: inserted.rows[0].decision, recordedAt: new Date(inserted.rows[0].created_at).toISOString() });
  }, connectionString);
}
