import { withNeonWorkspaceTransaction } from "./neon-workspace-database.mjs";

const iso = value => value ? new Date(value).toISOString() : null;

export async function getPlatformOperationsOverview({ workspaceId }, connectionString) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    const workspace = await query("SELECT display_label, status FROM app_identity.workspaces WHERE id=$1", [workspaceId]);
    const diagnostics = await query(`
      SELECT d.id,d.delivery_route,d.entitlement_type,d.state,d.human_review_status,d.created_at,d.updated_at,
        e.status AS entitlement_status,
        count(DISTINCT slot.id) FILTER (WHERE slot.clerk_user_id IS NOT NULL AND slot.revoked_at IS NULL)::integer AS assigned,
        count(DISTINCT interview.id) FILTER (WHERE interview.status IN ('submitted','review-required','evidence-ready'))::integer AS completed,
        count(DISTINCT evidence.id) FILTER (WHERE evidence.review_status='pending')::integer AS pending_evidence,
        count(DISTINCT assignment.id) FILTER (WHERE assignment.revoked_at IS NULL AND assignment.expires_at > now())::integer AS active_advisors,
        count(DISTINCT feedback.id)::integer AS feedback_count,
        count(DISTINCT candidate.id)::integer AS change_candidates,
        max(brief.status) AS brief_status
      FROM app_shared.diagnostics d
      LEFT JOIN app_shared.commercial_entitlements e ON e.workspace_id=d.workspace_id AND e.diagnostic_id=d.id AND e.entitlement_kind IN ('diagnostic','poc')
      LEFT JOIN app_identity.diagnostic_participant_slots slot ON slot.workspace_id=d.workspace_id AND slot.diagnostic_id=d.id
      LEFT JOIN app_private.diagnostic_interviews interview ON interview.workspace_id=slot.workspace_id AND interview.diagnostic_id=slot.diagnostic_id AND interview.participant_slot_id=slot.id
      LEFT JOIN app_private.diagnostic_evidence evidence ON evidence.workspace_id=d.workspace_id AND evidence.diagnostic_id=d.id
      LEFT JOIN app_operations.diagnostic_advisor_assignments assignment ON assignment.workspace_id=d.workspace_id AND assignment.diagnostic_id=d.id
      LEFT JOIN app_operations.poc_checkpoint_feedback feedback ON feedback.workspace_id=d.workspace_id AND feedback.diagnostic_id=d.id
      LEFT JOIN app_operations.poc_change_candidates candidate ON candidate.workspace_id=d.workspace_id AND candidate.diagnostic_id=d.id
      LEFT JOIN app_shared.capacity_operating_briefs brief ON brief.workspace_id=d.workspace_id AND brief.diagnostic_id=d.id
      GROUP BY d.workspace_id,d.id,e.status
      ORDER BY d.created_at DESC
      LIMIT 50`);
    const items = diagnostics.rows.map(row => Object.freeze({
      diagnosticId: row.id,
      route: row.delivery_route,
      entitlementType: row.entitlement_type,
      entitlementStatus: row.entitlement_status,
      state: row.state,
      humanReviewState: row.human_review_status,
      participation: Object.freeze({ assigned: row.assigned, completed: row.completed }),
      pendingEvidence: row.pending_evidence,
      activeAdvisors: row.active_advisors,
      feedbackCount: row.feedback_count,
      changeCandidates: row.change_candidates,
      briefStatus: row.brief_status || null,
      createdAt: iso(row.created_at),
      updatedAt: iso(row.updated_at)
    }));
    return Object.freeze({
      workspace: Object.freeze({ label: workspace.rows[0]?.display_label || "Client organization", status: workspace.rows[0]?.status || "unavailable" }),
      summary: Object.freeze({
        diagnostics: items.length,
        activePocs: items.filter(item => item.entitlementType === "poc" && !["closed","cancelled"].includes(item.state)).length,
        participantsCompleted: items.reduce((sum, item) => sum + item.participation.completed, 0),
        itemsNeedingReview: items.reduce((sum, item) => sum + item.pendingEvidence, 0)
      }),
      diagnostics: Object.freeze(items)
    });
  }, connectionString);
}

export const platformOperationsOverviewPolicy = Object.freeze({
  workspaceScope: "active-client-organization",
  participantIdentityIncluded: false,
  participantContentIncluded: false,
  individualScoresIncluded: false
});
