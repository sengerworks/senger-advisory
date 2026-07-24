import { createActionCycle, updateActionCycle } from "../../action-cycle-engine.js";
import { requireWorkspaceId } from "../../workspace-tenant-boundary.js";
import { withNeonWorkspaceTransaction } from "./neon-workspace-database.mjs";

export class ActionCycleInputError extends Error {}
export class ActionCycleStateError extends Error {}

function responsibleOwner(value) {
  const text = String(value || "").trim();
  if (!text || text.length > 120) {
    throw new ActionCycleInputError("Enter the person accountable for this commitment.");
  }
  return text;
}

function publicActionCycle(row) {
  return {
    actionCycleId: row.id,
    actionCycleVersion: row.action_cycle_version,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    constraintDomainId: row.constraint_domain_id,
    hypothesis: row.hypothesis,
    commitment: row.commitment,
    responsibleOwner: row.responsible_owner,
    evidenceMeasureId: row.evidence_measure_id,
    evidenceDescription: row.evidence_description,
    reviewDate: row.review_date instanceof Date
      ? row.review_date.toISOString().slice(0, 10)
      : String(row.review_date),
    status: row.status,
    closedAt: row.closed_at ? new Date(row.closed_at).toISOString() : null,
    reviewNote: row.review_note
  };
}

const actionColumns = `
  id, action_cycle_version, created_at, updated_at, constraint_domain_id,
  hypothesis, commitment, responsible_owner, evidence_measure_id,
  evidence_description, review_date, status, closed_at, review_note
`;

export function validateActionCycleInput(value, options = {}) {
  if (
    !value
    || typeof value !== "object"
    || Array.isArray(value)
    || Object.keys(value).sort().join(",") !== [
      "commitment",
      "constraintDomainId",
      "evidenceDescription",
      "evidenceMeasureId",
      "hypothesis",
      "responsibleOwner",
      "reviewDate",
      "roundId",
      "status"
    ].join(",")
  ) {
    throw new ActionCycleInputError("Enter the complete action-cycle commitment.");
  }
  requireWorkspaceId(value.roundId);
  try {
    const cycle = createActionCycle(value, options);
    return Object.freeze({
      roundId: value.roundId,
      responsibleOwner: responsibleOwner(value.responsibleOwner),
      cycle
    });
  } catch (error) {
    if (error instanceof TypeError) throw error;
    throw new ActionCycleInputError(error.message);
  }
}

export async function listWorkspaceActionCycles(workspaceId, roundId, connectionString) {
  requireWorkspaceId(roundId);
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    const result = await query(
      `SELECT ${actionColumns}
       FROM app_shared.action_cycles
       WHERE workspace_id = $1 AND round_id = $2
       ORDER BY created_at DESC`,
      [workspaceId, roundId]
    );
    return result.rows.map(publicActionCycle);
  }, connectionString);
}

export async function createWorkspaceActionCycle(
  { workspaceId, actorUserId, input },
  connectionString
) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    const aggregate = await query(
      `SELECT 1
       FROM app_shared.organizational_aggregates
       WHERE workspace_id = $1
         AND round_id = $2
         AND result_policy = 'aggregate'
         AND participant_count >= minimum_required
       LIMIT 1`,
      [workspaceId, input.roundId]
    );
    if (aggregate.rowCount !== 1) {
      throw new ActionCycleStateError(
        "An action cycle can begin only after the privacy threshold is met."
      );
    }
    const cycle = input.cycle;
    const result = await query(
      `INSERT INTO app_shared.action_cycles
        (id, workspace_id, round_id, action_cycle_version, constraint_domain_id,
         hypothesis, commitment, responsible_owner, evidence_measure_id,
         evidence_description, review_date, status, closed_at, created_by_clerk_user_id,
         created_at, updated_at)
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $15)
       RETURNING ${actionColumns}`,
      [
        cycle.actionCycleId,
        workspaceId,
        input.roundId,
        cycle.actionCycleVersion,
        cycle.constraintDomainId,
        cycle.hypothesis,
        cycle.commitment,
        input.responsibleOwner,
        cycle.evidenceMeasureId,
        cycle.evidenceDescription,
        cycle.reviewDate,
        cycle.status,
        cycle.closedAt,
        actorUserId,
        cycle.createdAt
      ]
    );
    await query(
      `INSERT INTO app_operations.audit_events
        (workspace_id, actor_clerk_user_id, action, target_type, target_id, metadata)
       VALUES ($1, $2, 'action_cycle.created', 'action_cycle', $3, $4::jsonb)`,
      [
        workspaceId,
        actorUserId,
        cycle.actionCycleId,
        JSON.stringify({
          actionCycleVersion: cycle.actionCycleVersion,
          constraintDomainId: cycle.constraintDomainId,
          status: cycle.status
        })
      ]
    );
    return publicActionCycle(result.rows[0]);
  }, connectionString);
}

export function validateActionCycleReview(value, options = {}) {
  if (
    !value
    || typeof value !== "object"
    || Array.isArray(value)
    || Object.keys(value).sort().join(",") !== "actionCycleId,reviewNote,roundId,status"
  ) {
    throw new ActionCycleInputError("Enter one complete action-cycle review.");
  }
  requireWorkspaceId(value.roundId);
  requireWorkspaceId(value.actionCycleId);
  const now = options.now instanceof Date ? options.now : new Date(options.now || Date.now());
  try {
    const updated = updateActionCycle(
      {
        status: "active",
        closedAt: null,
        reviewDate: "2099-01-01"
      },
      { status: value.status, reviewNote: value.reviewNote },
      { now }
    );
    return Object.freeze({
      roundId: value.roundId,
      actionCycleId: value.actionCycleId,
      status: updated.status,
      reviewNote: updated.reviewNote,
      closedAt: updated.closedAt,
      updatedAt: updated.updatedAt
    });
  } catch (error) {
    throw new ActionCycleInputError(error.message);
  }
}

export async function reviewWorkspaceActionCycle(
  { workspaceId, actorUserId, review },
  connectionString
) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    const result = await query(
      `UPDATE app_shared.action_cycles
       SET status = $4, review_note = $5, closed_at = $6, updated_at = $7
       WHERE workspace_id = $1 AND round_id = $2 AND id = $3
       RETURNING ${actionColumns}`,
      [
        workspaceId,
        review.roundId,
        review.actionCycleId,
        review.status,
        review.reviewNote,
        review.closedAt,
        review.updatedAt
      ]
    );
    if (result.rowCount !== 1) throw new ActionCycleStateError("Action cycle not found.");
    await query(
      `INSERT INTO app_operations.audit_events
        (workspace_id, actor_clerk_user_id, action, target_type, target_id, metadata)
       VALUES ($1, $2, 'action_cycle.reviewed', 'action_cycle', $3, $4::jsonb)`,
      [
        workspaceId,
        actorUserId,
        review.actionCycleId,
        JSON.stringify({ status: review.status })
      ]
    );
    return publicActionCycle(result.rows[0]);
  }, connectionString);
}
