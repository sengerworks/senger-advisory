import { compareOrganizationRounds } from "../../organization-comparison-engine.js";
import { requireWorkspaceId } from "../../workspace-tenant-boundary.js";
import { withNeonWorkspaceTransaction } from "./neon-workspace-database.mjs";

export async function getWorkspaceComparison(workspaceId, roundId, connectionString) {
  requireWorkspaceId(roundId);
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    const rounds = await query(
      `SELECT follow_up.id AS follow_up_id, follow_up.display_label AS follow_up_label,
              baseline.id AS baseline_id, baseline.display_label AS baseline_label
       FROM app_identity.collection_rounds follow_up
       JOIN app_identity.collection_rounds baseline
         ON baseline.workspace_id = follow_up.workspace_id
        AND baseline.id = follow_up.prior_round_id
       WHERE follow_up.workspace_id = $1 AND follow_up.id = $2`,
      [workspaceId, roundId]
    );
    if (rounds.rowCount !== 1) return null;
    const row = rounds.rows[0];
    const aggregates = await query(
      `SELECT round_id, aggregate_payload
       FROM app_shared.organizational_aggregates
       WHERE workspace_id = $1
         AND round_id = ANY($2::uuid[])
         AND result_policy = 'aggregate'`,
      [workspaceId, [row.baseline_id, row.follow_up_id]]
    );
    const byRound = new Map(
      aggregates.rows.map(value => [value.round_id, value.aggregate_payload])
    );
    return {
      baselineRound: { id: row.baseline_id, label: row.baseline_label },
      followUpRound: { id: row.follow_up_id, label: row.follow_up_label },
      comparison: compareOrganizationRounds(
        byRound.get(row.baseline_id),
        byRound.get(row.follow_up_id)
      )
    };
  }, connectionString);
}
