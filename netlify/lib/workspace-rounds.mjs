import { withNeonWorkspaceTransaction } from "./neon-workspace-database.mjs";
import { requireWorkspaceId } from "../../workspace-tenant-boundary.js";

const ASSESSMENT_VERSION = "1.0.0";
const SCORING_VERSION = "0.1.0";
const NOTICE_VERSION = "1.0.0";
const MINIMUM_PARTICIPANTS = 5;
const MAX_ROUNDS_RETURNED = 12;

export class RoundInputError extends Error {}
export class RoundStateError extends Error {}

function isoOrNull(value) {
  return value === null ? null : new Date(value).toISOString();
}

function publicRound(row) {
  return Object.freeze({
    id: row.id,
    label: row.display_label,
    status: row.status,
    minimumParticipants: row.minimum_participants,
    opensAt: isoOrNull(row.opens_at),
    closesAt: isoOrNull(row.closes_at),
    priorRoundId: row.prior_round_id || null,
    createdAt: new Date(row.created_at).toISOString()
  });
}

export function validateRoundDraft(value, now = Date.now()) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new RoundInputError("Enter the collection-round details.");
  }
  const keys = Object.keys(value).sort();
  if (keys.join(",") !== "closesAt,label,opensAt") {
    throw new RoundInputError("Only the collection name and participation dates are accepted.");
  }

  const label = typeof value.label === "string" ? value.label.trim().replace(/\s+/g, " ") : "";
  if (label.length < 3 || label.length > 120) {
    throw new RoundInputError("Use a collection name between 3 and 120 characters.");
  }

  const opensAt = Date.parse(value.opensAt);
  const closesAt = Date.parse(value.closesAt);
  if (!Number.isFinite(opensAt) || !Number.isFinite(closesAt)) {
    throw new RoundInputError("Choose valid opening and closing dates.");
  }
  if (opensAt < now - 5 * 60 * 1000) {
    throw new RoundInputError("The collection cannot open in the past.");
  }
  if (closesAt <= opensAt) {
    throw new RoundInputError("The closing date must follow the opening date.");
  }
  if (closesAt - opensAt > 180 * 24 * 60 * 60 * 1000) {
    throw new RoundInputError("A collection round cannot remain open longer than 180 days.");
  }

  return Object.freeze({
    label,
    opensAt: new Date(opensAt).toISOString(),
    closesAt: new Date(closesAt).toISOString()
  });
}

export async function listWorkspaceRounds(workspaceId, connectionString) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    const result = await query(
      `SELECT id, display_label, status, minimum_participants, opens_at, closes_at,
              prior_round_id, created_at
       FROM app_identity.collection_rounds
       ORDER BY created_at DESC
       LIMIT $1`,
      [MAX_ROUNDS_RETURNED]
    );
    return result.rows.map(publicRound);
  }, connectionString);
}

export async function createWorkspaceRound(
  { workspaceId, actorUserId, draft },
  connectionString
) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    const inserted = await query(
      `INSERT INTO app_identity.collection_rounds
        (workspace_id, display_label, status, assessment_version, scoring_version,
         notice_version, minimum_participants, opens_at, closes_at)
       VALUES ($1, $2, 'draft', $3, $4, $5, $6, $7, $8)
       RETURNING id, display_label, status, minimum_participants, opens_at, closes_at,
                 prior_round_id, created_at`,
      [
        workspaceId,
        draft.label,
        ASSESSMENT_VERSION,
        SCORING_VERSION,
        NOTICE_VERSION,
        MINIMUM_PARTICIPANTS,
        draft.opensAt,
        draft.closesAt
      ]
    );
    const round = publicRound(inserted.rows[0]);
    await query(
      `INSERT INTO app_operations.audit_events
        (workspace_id, actor_clerk_user_id, action, target_type, target_id, metadata)
       VALUES ($1, $2, 'round.created', 'collection_round', $3, $4::jsonb)`,
      [
        workspaceId,
        actorUserId,
        round.id,
        JSON.stringify({
          status: round.status,
          minimumParticipants: round.minimumParticipants
        })
      ]
    );
    return round;
  }, connectionString);
}

export async function updateWorkspaceRound(
  { workspaceId, actorUserId, roundId, draft },
  connectionString
) {
  requireWorkspaceId(roundId);
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    const updated = await query(
      `UPDATE app_identity.collection_rounds
       SET display_label = $3, opens_at = $4, closes_at = $5, updated_at = now()
       WHERE workspace_id = $1 AND id = $2 AND status = 'draft'
       RETURNING id, display_label, status, minimum_participants, opens_at, closes_at,
                 prior_round_id, created_at`,
      [workspaceId, roundId, draft.label, draft.opensAt, draft.closesAt]
    );
    if (updated.rowCount !== 1) {
      throw new RoundStateError("Only a draft collection round can be changed.");
    }
    await query(
      `INSERT INTO app_operations.audit_events
        (workspace_id, actor_clerk_user_id, action, target_type, target_id, metadata)
       VALUES ($1, $2, 'round.updated', 'collection_round', $3, '{}'::jsonb)`,
      [workspaceId, actorUserId, roundId]
    );
    return publicRound(updated.rows[0]);
  }, connectionString);
}

export async function openWorkspaceRound(
  { workspaceId, actorUserId, roundId },
  connectionString
) {
  requireWorkspaceId(roundId);
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    const opened = await query(
      `UPDATE app_identity.collection_rounds
       SET status = 'open', updated_at = now()
       WHERE workspace_id = $1
         AND id = $2
         AND status = 'draft'
         AND closes_at > now()
         AND NOT EXISTS (
           SELECT 1
           FROM app_identity.collection_rounds existing
           WHERE existing.workspace_id = $1
             AND existing.status = 'open'
         )
       RETURNING id, display_label, status, minimum_participants, opens_at, closes_at,
                 prior_round_id, created_at`,
      [workspaceId, roundId]
    );
    if (opened.rowCount !== 1) {
      throw new RoundStateError(
        "Only one current, unexpired collection round can be open at a time."
      );
    }
    await query(
      `INSERT INTO app_operations.audit_events
        (workspace_id, actor_clerk_user_id, action, target_type, target_id, metadata)
       VALUES ($1, $2, 'round.opened', 'collection_round', $3, $4::jsonb)`,
      [
        workspaceId,
        actorUserId,
        roundId,
        JSON.stringify({
          minimumParticipants: opened.rows[0].minimum_participants
        })
      ]
    );
    return publicRound(opened.rows[0]);
  }, connectionString);
}

export async function deleteWorkspaceRound(
  { workspaceId, actorUserId, roundId },
  connectionString
) {
  requireWorkspaceId(roundId);
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    const deleted = await query(
      `DELETE FROM app_identity.collection_rounds
       WHERE workspace_id = $1 AND id = $2 AND status = 'draft'
       RETURNING id`,
      [workspaceId, roundId]
    );
    if (deleted.rowCount !== 1) {
      throw new RoundStateError("Only a draft collection round can be deleted.");
    }
    await query(
      `INSERT INTO app_operations.audit_events
        (workspace_id, actor_clerk_user_id, action, target_type, target_id, metadata)
       VALUES ($1, $2, 'round.deleted', 'collection_round', $3, '{}'::jsonb)`,
      [workspaceId, actorUserId, roundId]
    );
    return Object.freeze({ id: roundId });
  }, connectionString);
}

export async function closeWorkspaceRound(
  { workspaceId, actorUserId, roundId },
  connectionString
) {
  requireWorkspaceId(roundId);
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    const closed = await query(
      `UPDATE app_identity.collection_rounds round
       SET status = 'closed', updated_at = now()
       WHERE round.workspace_id = $1
         AND round.id = $2
         AND round.status = 'open'
         AND EXISTS (
           SELECT 1
           FROM app_shared.organizational_aggregates aggregate
           WHERE aggregate.workspace_id = round.workspace_id
             AND aggregate.round_id = round.id
             AND aggregate.result_policy = 'aggregate'
             AND aggregate.participant_count >= aggregate.minimum_required
         )
         AND EXISTS (
           SELECT 1
           FROM app_shared.action_cycles cycle
           WHERE cycle.workspace_id = round.workspace_id
             AND cycle.round_id = round.id
             AND cycle.status IN ('completed', 'stopped')
         )
         AND NOT EXISTS (
           SELECT 1
           FROM app_shared.action_cycles cycle
           WHERE cycle.workspace_id = round.workspace_id
             AND cycle.round_id = round.id
             AND cycle.status IN ('planned', 'active')
         )
       RETURNING id, display_label, status, minimum_participants, opens_at, closes_at,
                 prior_round_id, created_at`,
      [workspaceId, roundId]
    );
    if (closed.rowCount !== 1) {
      throw new RoundStateError(
        "Close the current action cycle after the privacy threshold is met before ending this collection."
      );
    }
    await query(
      `INSERT INTO app_operations.audit_events
        (workspace_id, actor_clerk_user_id, action, target_type, target_id, metadata)
       VALUES ($1, $2, 'round.closed', 'collection_round', $3, '{}'::jsonb)`,
      [workspaceId, actorUserId, roundId]
    );
    return publicRound(closed.rows[0]);
  }, connectionString);
}

export async function createFollowUpRound(
  { workspaceId, actorUserId, priorRoundId, draft },
  connectionString
) {
  requireWorkspaceId(priorRoundId);
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    const inserted = await query(
      `INSERT INTO app_identity.collection_rounds
        (workspace_id, display_label, status, assessment_version, scoring_version,
         notice_version, minimum_participants, opens_at, closes_at, prior_round_id)
       SELECT $1, $3, 'draft', prior.assessment_version, prior.scoring_version,
              prior.notice_version, prior.minimum_participants, $4, $5, prior.id
       FROM app_identity.collection_rounds prior
       WHERE prior.workspace_id = $1
         AND prior.id = $2
         AND prior.status = 'closed'
         AND NOT EXISTS (
           SELECT 1
           FROM app_identity.collection_rounds existing
           WHERE existing.workspace_id = $1
             AND existing.prior_round_id = prior.id
         )
       RETURNING id, display_label, status, minimum_participants, opens_at, closes_at,
                 prior_round_id, created_at`,
      [workspaceId, priorRoundId, draft.label, draft.opensAt, draft.closesAt]
    );
    if (inserted.rowCount !== 1) {
      throw new RoundStateError(
        "A follow-up can be created once from a closed, threshold-qualified collection."
      );
    }
    const round = publicRound(inserted.rows[0]);
    await query(
      `INSERT INTO app_operations.audit_events
        (workspace_id, actor_clerk_user_id, action, target_type, target_id, metadata)
       VALUES ($1, $2, 'round.follow_up_created', 'collection_round', $3, $4::jsonb)`,
      [
        workspaceId,
        actorUserId,
        round.id,
        JSON.stringify({ priorRoundId })
      ]
    );
    return round;
  }, connectionString);
}

export async function getWorkspaceRound(workspaceId, roundId, connectionString) {
  requireWorkspaceId(roundId);
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    const result = await query(
      `SELECT id, display_label, status, minimum_participants, opens_at, closes_at,
              prior_round_id, created_at
       FROM app_identity.collection_rounds
       WHERE workspace_id = $1 AND id = $2`,
      [workspaceId, roundId]
    );
    return result.rowCount === 1 ? publicRound(result.rows[0]) : null;
  }, connectionString);
}

export const workspaceRoundPolicy = Object.freeze({
  assessmentVersion: ASSESSMENT_VERSION,
  scoringVersion: SCORING_VERSION,
  noticeVersion: NOTICE_VERSION,
  minimumParticipants: MINIMUM_PARTICIPANTS
});
