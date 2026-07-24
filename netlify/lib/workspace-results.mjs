import {
  aggregateOrganization,
  ORGANIZATION_AGGREGATION_VERSION
} from "../../organization-aggregation-engine.js";
import { requireWorkspaceId } from "../../workspace-tenant-boundary.js";
import { withNeonWorkspaceTransaction } from "./neon-workspace-database.mjs";

function submissionFromRow(row) {
  return {
    submissionId: row.id,
    completedAt: new Date(row.completed_at).toISOString(),
    assessmentVersion: row.assessment_version,
    scoringVersion: row.scoring_version,
    domainScores: row.domain_scores,
    overallIndex: row.overall_index,
    interpretationBand: row.interpretation_band,
    primaryConstraintIds: row.primary_constraint_ids
  };
}

export async function getWorkspaceResults(workspaceId, roundId, connectionString) {
  requireWorkspaceId(roundId);
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    const roundResult = await query(
      `SELECT id, display_label, status, minimum_participants
       FROM app_identity.collection_rounds
       WHERE workspace_id = $1 AND id = $2`,
      [workspaceId, roundId]
    );
    if (roundResult.rowCount !== 1) return null;
    const round = roundResult.rows[0];
    const countResult = await query(
      `SELECT count(*)::integer AS participant_count
       FROM app_private.submissions
       WHERE workspace_id = $1
         AND round_id = $2
         AND replaced_at IS NULL
         AND deleted_at IS NULL`,
      [workspaceId, roundId]
    );
    const participantCount = countResult.rows[0].participant_count;
    if (participantCount < round.minimum_participants) {
      return {
        round: { id: round.id, label: round.display_label, status: round.status },
        result: {
          policy: "suppressed",
          participantCount,
          minimumRequired: round.minimum_participants,
          remaining: round.minimum_participants - participantCount,
          reason: "Organizational results remain hidden until the privacy threshold is met."
        }
      };
    }

    const submissionResult = await query(
      `SELECT id, completed_at, assessment_version, scoring_version, domain_scores,
              overall_index, interpretation_band, primary_constraint_ids
       FROM app_private.submissions
       WHERE workspace_id = $1
         AND round_id = $2
         AND replaced_at IS NULL
         AND deleted_at IS NULL
       ORDER BY id`,
      [workspaceId, roundId]
    );
    const aggregate = aggregateOrganization(
      submissionResult.rows.map(submissionFromRow),
      { minimumRequired: round.minimum_participants }
    );
    await query(
      `INSERT INTO app_shared.organizational_aggregates
        (workspace_id, round_id, aggregation_version, participant_count, minimum_required,
         result_policy, aggregate_payload, generated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, now())
       ON CONFLICT (workspace_id, round_id, aggregation_version)
       DO UPDATE SET
         participant_count = EXCLUDED.participant_count,
         minimum_required = EXCLUDED.minimum_required,
         result_policy = EXCLUDED.result_policy,
         aggregate_payload = EXCLUDED.aggregate_payload,
         generated_at = now()`,
      [
        workspaceId,
        roundId,
        ORGANIZATION_AGGREGATION_VERSION,
        aggregate.participantCount,
        round.minimum_participants,
        aggregate.policy === "aggregate" ? "aggregate" : "incompatible-versions",
        aggregate.policy === "aggregate" ? JSON.stringify(aggregate) : null
      ]
    );
    return {
      round: { id: round.id, label: round.display_label, status: round.status },
      result: aggregate
    };
  }, connectionString);
}
