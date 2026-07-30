import { withNeonWorkspaceTransaction } from "./neon-workspace-database.mjs";

export const CAPACITY_OPERATING_BRIEF_VERSION = "1.0.0";
export class CapacityOperatingBriefStateError extends Error {}

function publicBrief(row) {
  if (!row) return null;
  return Object.freeze({ briefId: row.id, briefVersion: row.brief_version, status: row.status, ...row.brief_payload, activatedAt: new Date(row.activated_at).toISOString() });
}

export async function getCapacityOperatingBrief({ workspaceId, diagnosticId }, connectionString) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    const result = await query(`SELECT id, brief_version, brief_payload, status, activated_at FROM app_shared.capacity_operating_briefs WHERE diagnostic_id = $1 LIMIT 1`, [diagnosticId]);
    if (result.rows[0]) return Object.freeze({ state: "active", brief: publicBrief(result.rows[0]) });
    const intervention = await query(`SELECT status FROM app_shared.diagnostic_interventions WHERE diagnostic_id = $1 LIMIT 1`, [diagnosticId]);
    return Object.freeze({ state: intervention.rows[0]?.status === "accepted" ? "ready" : "blocked", reason: "intervention-acceptance", brief: null });
  }, connectionString);
}

export async function activateCapacityOperatingBrief({ workspaceId, userId, diagnosticId, now = new Date() }, connectionString) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    const source = await query(
      `SELECT intervention.id AS intervention_id, intervention.status AS intervention_status,
              intervention.proposal_payload, intervention.service_route,
              finding.id AS finding_id, finding.status AS finding_status, finding.confidence,
              finding.record_payload, entitlement.entitlement_kind, entitlement.status AS entitlement_status
       FROM app_shared.diagnostic_interventions intervention
       JOIN app_shared.diagnostic_findings finding
         ON finding.workspace_id = intervention.workspace_id AND finding.id = intervention.finding_id
       JOIN app_shared.commercial_entitlements entitlement
         ON entitlement.workspace_id = intervention.workspace_id AND entitlement.id = intervention.entitlement_id
       WHERE intervention.diagnostic_id = $1 FOR UPDATE OF intervention`,
      [diagnosticId]
    );
    const row = source.rows[0];
    if (!row || row.intervention_status !== "accepted" || row.finding_status !== "validated") throw new CapacityOperatingBriefStateError("An accepted intervention and validated finding are required.");
    if (row.entitlement_status !== "active" || !["poc", "intervention"].includes(row.entitlement_kind)) throw new CapacityOperatingBriefStateError("Active intervention access is required before Brief activation.");
    const hypothesis = row.record_payload.hypothesis;
    const proposal = row.proposal_payload;
    const payload = {
      currentFocus: { constraint: hypothesis.statement, confidence: row.confidence, confidenceBasis: hypothesis.confidenceBasis },
      uncertainty: { competingExplanations: hypothesis.competingExplanations.map(item => ({ statement: item.statement, evidenceNeeded: item.evidenceNeeded })), blindSpots: hypothesis.blindSpots },
      themes: row.record_payload.themes.map(theme => ({ title: theme.title, summary: theme.summary, confidence: theme.confidence })),
      intervention: { serviceRoute: row.service_route, objective: proposal.objective, rationale: proposal.rationale, scope: proposal.scope, operatingChanges: proposal.operatingChanges, commitments: proposal.commitments, learningRequirements: proposal.learningRequirements, evidencePlan: proposal.evidencePlan, reviewCadence: proposal.reviewCadence, duration: proposal.duration },
      nextReview: { cadence: proposal.reviewCadence, status: "not-yet-recorded" }
    };
    let inserted;
    try {
      inserted = await query(
        `INSERT INTO app_shared.capacity_operating_briefs
          (workspace_id, diagnostic_id, finding_id, intervention_id, brief_version, brief_payload, status, activated_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, 'active', $7::timestamptz, $7::timestamptz, $7::timestamptz)
         RETURNING id, brief_version, brief_payload, status, activated_at`,
        [workspaceId, diagnosticId, row.finding_id, row.intervention_id, CAPACITY_OPERATING_BRIEF_VERSION, JSON.stringify(payload), now.toISOString()]
      );
    } catch (error) {
      if (error?.code === "23505") throw new CapacityOperatingBriefStateError("The Capacity Operating Brief is already active.");
      throw error;
    }
    await query(`UPDATE app_shared.diagnostic_interventions SET status = 'active', updated_at = $2::timestamptz WHERE id = $1`, [row.intervention_id, now.toISOString()]);
    await query(`UPDATE app_shared.diagnostics SET state = 'active-intervention', updated_at = $2::timestamptz WHERE id = $1`, [diagnosticId, now.toISOString()]);
    await query(`INSERT INTO app_operations.audit_events (workspace_id, actor_clerk_user_id, action, target_type, target_id, metadata) VALUES ($1, $2, 'capacity-operating-brief.activated', 'diagnostic', $3, $4::jsonb)`, [workspaceId, userId, diagnosticId, JSON.stringify({ briefVersion: CAPACITY_OPERATING_BRIEF_VERSION, serviceRoute: row.service_route })]);
    return publicBrief(inserted.rows[0]);
  }, connectionString);
}

