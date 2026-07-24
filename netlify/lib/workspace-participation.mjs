import { validateOrganizationSubmission } from "../../organization-aggregation-engine.js";
import { requireWorkspaceId } from "../../workspace-tenant-boundary.js";
import { withNeonWorkspaceTransaction } from "./neon-workspace-database.mjs";

export const WORKSPACE_NOTICE_VERSION = "1.0.0";

export class ParticipationInputError extends Error {}
export class ParticipationStateError extends Error {}

function publicRound(row) {
  return {
    id: row.id,
    label: row.display_label,
    opensAt: new Date(row.opens_at).toISOString(),
    closesAt: new Date(row.closes_at).toISOString(),
    minimumParticipants: row.minimum_participants
  };
}

export async function getWorkspaceParticipation(
  { workspaceId, userId, now = new Date() },
  connectionString
) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    const result = await query(
      `SELECT id, display_label, opens_at, closes_at, minimum_participants
       FROM app_identity.collection_rounds
       WHERE workspace_id = $1 AND status = 'open'
       ORDER BY created_at DESC
       LIMIT 1`,
      [workspaceId]
    );
    if (result.rowCount === 0) return { state: "unavailable" };
    const row = result.rows[0];
    const round = publicRound(row);
    const current = now.getTime();
    const timing = current < new Date(round.opensAt).getTime()
      ? "scheduled"
      : current > new Date(round.closesAt).getTime()
        ? "ended"
        : "ready";

    await query(
      `INSERT INTO app_identity.participant_slots
        (workspace_id, round_id, clerk_user_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (workspace_id, round_id, clerk_user_id) DO NOTHING`,
      [workspaceId, round.id, userId]
    );
    const slot = await query(
      `SELECT notice_accepted_at, notice_version, submission_id
       FROM app_identity.participant_slots
       WHERE workspace_id = $1 AND round_id = $2 AND clerk_user_id = $3 AND revoked_at IS NULL`,
      [workspaceId, round.id, userId]
    );
    if (slot.rowCount !== 1) throw new ParticipationStateError("Participation is unavailable.");
    return {
      state: timing,
      round,
      noticeVersion: WORKSPACE_NOTICE_VERSION,
      noticeAccepted: (
        slot.rows[0].notice_version === WORKSPACE_NOTICE_VERSION
        && slot.rows[0].notice_accepted_at !== null
      ),
      submitted: slot.rows[0].submission_id !== null
    };
  }, connectionString);
}

export async function acceptWorkspaceNotice(
  { workspaceId, userId, roundId, noticeVersion, now = new Date() },
  connectionString
) {
  requireWorkspaceId(roundId);
  if (noticeVersion !== WORKSPACE_NOTICE_VERSION) {
    throw new ParticipationInputError("The current workspace privacy notice is required.");
  }
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    const result = await query(
      `UPDATE app_identity.participant_slots slot
       SET notice_accepted_at = $4, notice_version = $5
       FROM app_identity.collection_rounds round
       WHERE slot.workspace_id = $1
         AND slot.round_id = $2
         AND slot.clerk_user_id = $3
         AND slot.revoked_at IS NULL
         AND round.workspace_id = slot.workspace_id
         AND round.id = slot.round_id
         AND round.status = 'open'
         AND round.opens_at <= $4
         AND round.closes_at >= $4
       RETURNING slot.submission_id`,
      [workspaceId, roundId, userId, now.toISOString(), noticeVersion]
    );
    if (result.rowCount !== 1) {
      throw new ParticipationStateError("This collection is not currently accepting perspectives.");
    }
    return { accepted: true, submitted: result.rows[0].submission_id !== null };
  }, connectionString);
}

export function validateWorkspaceSubmissionEnvelope(value) {
  if (
    !value
    || typeof value !== "object"
    || Array.isArray(value)
    || Object.keys(value).sort().join(",") !== "roundId,submission"
  ) {
    throw new ParticipationInputError("Enter one completed assessment submission.");
  }
  requireWorkspaceId(value.roundId);
  if (!validateOrganizationSubmission(value.submission)) {
    throw new ParticipationInputError("The assessment submission is incomplete or unsupported.");
  }
  return Object.freeze({ roundId: value.roundId, submission: value.submission });
}

export async function submitWorkspaceAssessment(
  { workspaceId, userId, roundId, submission, now = new Date() },
  connectionString
) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    const round = await query(
      `SELECT assessment_version, scoring_version
       FROM app_identity.collection_rounds
       WHERE workspace_id = $1
         AND id = $2
         AND status = 'open'
         AND opens_at <= $3
         AND closes_at >= $3
       FOR UPDATE`,
      [workspaceId, roundId, now.toISOString()]
    );
    if (round.rowCount !== 1) {
      throw new ParticipationStateError("This collection is not currently accepting perspectives.");
    }
    if (
      round.rows[0].assessment_version !== submission.assessmentVersion
      || round.rows[0].scoring_version !== submission.scoringVersion
    ) {
      throw new ParticipationStateError("This assessment version does not match the collection.");
    }

    const slot = await query(
      `SELECT submission_id
       FROM app_identity.participant_slots
       WHERE workspace_id = $1
         AND round_id = $2
         AND clerk_user_id = $3
         AND revoked_at IS NULL
         AND notice_version = $4
         AND notice_accepted_at IS NOT NULL
       FOR UPDATE`,
      [workspaceId, roundId, userId, WORKSPACE_NOTICE_VERSION]
    );
    if (slot.rowCount !== 1) {
      throw new ParticipationStateError("Accept the workspace privacy notice before contributing.");
    }
    if (slot.rows[0].submission_id !== null) {
      throw new ParticipationStateError("Your perspective has already been submitted.");
    }

    await query(
      `INSERT INTO app_private.submissions
        (id, workspace_id, round_id, completed_at, assessment_version, scoring_version,
         domain_scores, overall_index, interpretation_band, primary_constraint_ids)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10::jsonb)`,
      [
        submission.submissionId,
        workspaceId,
        roundId,
        submission.completedAt,
        submission.assessmentVersion,
        submission.scoringVersion,
        JSON.stringify(submission.domainScores),
        submission.overallIndex,
        submission.interpretationBand,
        JSON.stringify(submission.primaryConstraintIds)
      ]
    );
    await query(
      `UPDATE app_identity.participant_slots
       SET submission_id = $4
       WHERE workspace_id = $1 AND round_id = $2 AND clerk_user_id = $3`,
      [workspaceId, roundId, userId, submission.submissionId]
    );
    await query(
      `INSERT INTO app_operations.audit_events
        (workspace_id, action, target_type, target_id, metadata)
       VALUES ($1, 'submission.completed', 'collection_round', $2, $3::jsonb)`,
      [
        workspaceId,
        roundId,
        JSON.stringify({
          assessmentVersion: submission.assessmentVersion,
          scoringVersion: submission.scoringVersion
        })
      ]
    );
    return { submitted: true };
  }, connectionString);
}
