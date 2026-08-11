import {
  acceptPerspectiveGap,
  approveParticipantPlan,
  createParticipantPlan,
  diagnosticDiscovery,
  evaluatePerspectiveCoverage
} from "../../diagnostic-discovery-engine.js";
import { withNeonWorkspaceTransaction } from "./neon-workspace-database.mjs";
import { validateDiagnosticContextId } from "./workspace-diagnostic-context.mjs";

const allowedKeys = new Set([
  "diagnosticId", "targetLeadershipLevels", "targetExecutionProximities",
  "targetFunctionalLenses", "participantSlots", "acceptedGaps", "approvalNote",
  "designSessionScheduledFor", "designSessionAcknowledged"
]);

export class DiagnosticParticipantInputError extends Error {}
export class DiagnosticParticipantStateError extends Error {}

function scheduledSession(value) {
  const date = new Date(String(value || ""));
  if (!Number.isFinite(date.getTime())) throw new Error("Record the scheduled Design Session date and time.");
  return date.toISOString();
}

export function diagnosticScopeGuidance(context) {
  if (!context) return null;
  const guidance = {
    enterprise: ["Include the enterprise decision owner.", "Include people translating direction into functional priorities.", "Include people coordinating and delivering the work."],
    "business-unit": ["Include the business-unit decision owner.", "Include operating and delivery perspectives inside the unit.", "Include at least one perspective from a dependency outside the unit."],
    function: ["Include the accountable functional leader.", "Include managers and individual contributors experiencing the work.", "Include at least one upstream or downstream cross-functional perspective."],
    "leadership-layer": ["Include people within the leadership layer.", "Include a perspective that sets expectations for that layer.", "Include people who experience the consequences of its decisions."],
    "cross-functional-system": ["Include the leader accountable for the shared outcome.", "Include perspectives from both sides of critical handoffs.", "Include someone close to delivery who experiences the consequences."]
  }[context.diagnosticScopeType] || [];
  return Object.freeze({
    scopeType: context.diagnosticScopeType,
    scopeName: context.diagnosticScopeName,
    scopeBoundary: context.diagnosticScopeBoundary,
    crossBoundaryDependencies: context.crossBoundaryDependencies,
    guidance: Object.freeze(guidance)
  });
}

export function validateDiagnosticParticipantPlan(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new DiagnosticParticipantInputError("Enter the participant design.");
  }
  if (Object.keys(value).some(key => !allowedKeys.has(key))) {
    throw new DiagnosticParticipantInputError("The participant design contains unsupported fields.");
  }
  try {
    const diagnosticId = validateDiagnosticContextId(value.diagnosticId);
    const designSessionScheduledFor = scheduledSession(value.designSessionScheduledFor);
    if (value.designSessionAcknowledged !== true) throw new Error("Confirm the required Design Session before approving the perspective plan.");
    let plan = createParticipantPlan({
      diagnosticId,
      targetLeadershipLevels: value.targetLeadershipLevels,
      targetExecutionProximities: value.targetExecutionProximities,
      targetFunctionalLenses: value.targetFunctionalLenses,
      participantSlots: value.participantSlots
    }, { id: "00000000-0000-4000-8000-000000000002", now: new Date(0) });
    if (!Array.isArray(value.acceptedGaps || [])) throw new Error("Accepted gaps must be a list.");
    for (const gap of value.acceptedGaps || []) {
      if (!gap || Object.keys(gap).sort().join(",") !== "gapId,reason") {
        throw new Error("Each accepted gap requires only a gap ID and reason.");
      }
      plan = acceptPerspectiveGap(plan, gap, { now: new Date(0) });
    }
    const approved = approveParticipantPlan(plan, { approvalNote: value.approvalNote || "" }, { now: new Date(0) });
    return Object.freeze({
      diagnosticId,
      targetLeadershipLevels: Object.freeze([...approved.coverageObjectives.leadershipLevels]),
      targetExecutionProximities: Object.freeze([...approved.coverageObjectives.executionProximities]),
      targetFunctionalLenses: Object.freeze([...approved.coverageObjectives.functionalLenses]),
      participantSlots: Object.freeze(approved.participantSlots.map(slot => Object.freeze({ ...slot }))),
      acceptedGaps: Object.freeze(approved.acceptedGaps.map(gap => Object.freeze({ gapId: gap.gapId, reason: gap.reason }))),
      designSessionScheduledFor,
      designSessionAcknowledged: true,
      approvalNote: approved.approvalNote
    });
  } catch (error) {
    if (error instanceof DiagnosticParticipantInputError) throw error;
    throw new DiagnosticParticipantInputError(error.message);
  }
}

function publicPlan(row) {
  if (!row) return null;
  return Object.freeze({
    id: row.id,
    diagnosticId: row.diagnostic_id,
    discoveryVersion: row.discovery_version,
    ...row.approved_payload,
    approvedAt: new Date(row.approved_at).toISOString()
  });
}

export async function getWorkspaceDiagnosticParticipantPlan(workspaceId, diagnosticId, connectionString) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    const result = await query(
      `SELECT id, diagnostic_id, discovery_version, approved_payload, approved_at
       FROM app_private.diagnostic_participant_plans
       WHERE diagnostic_id = $1 LIMIT 1`,
      [diagnosticId]
    );
    return publicPlan(result.rows[0]);
  }, connectionString);
}

export async function approveWorkspaceDiagnosticParticipantPlan(
  { workspaceId, actorUserId, input }, connectionString
) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    const diagnosticResult = await query(
      `SELECT diagnostic.id, diagnostic.state, diagnostic.entitlement_type, context.id AS context_id
       FROM app_shared.diagnostics diagnostic
       LEFT JOIN app_private.diagnostic_context_briefs context
         ON context.workspace_id = diagnostic.workspace_id AND context.diagnostic_id = diagnostic.id
       WHERE diagnostic.id = $1
       FOR UPDATE OF diagnostic`,
      [input.diagnosticId]
    );
    const diagnostic = diagnosticResult.rows[0];
    if (!diagnostic) throw new DiagnosticParticipantStateError("That diagnostic is not available in this workspace.");
    if (!diagnostic.context_id || diagnostic.state !== "participant-design") {
      throw new DiagnosticParticipantStateError("Approve the Context Brief before participant design.");
    }
    if (input.participantSlots.length < 5) {
      throw new DiagnosticParticipantStateError("At least five participant perspectives are required to protect confidentiality.");
    }
    if (diagnostic.entitlement_type === "poc" && input.participantSlots.length > 10) {
      throw new DiagnosticParticipantStateError("The POC includes up to 10 participant perspectives. Activate a full diagnostic to include up to 50.");
    }
    const designSession = await query(
      `SELECT id,status FROM app_operations.diagnostic_steward_sessions
       WHERE diagnostic_id=$1 AND session_type='design' AND scheduled_at=$2::timestamptz`,
      [input.diagnosticId,input.designSessionScheduledFor]
    );
    if (!designSession.rowCount || designSession.rows[0].status === "cancelled") {
      throw new DiagnosticParticipantStateError("Book and confirm the required Design Session before approving perspective coverage.");
    }

    let plan = createParticipantPlan({
      diagnosticId: input.diagnosticId,
      targetLeadershipLevels: input.targetLeadershipLevels,
      targetExecutionProximities: input.targetExecutionProximities,
      targetFunctionalLenses: input.targetFunctionalLenses,
      participantSlots: input.participantSlots
    });
    for (const gap of input.acceptedGaps) plan = acceptPerspectiveGap(plan, gap);
    const approved = approveParticipantPlan(plan, { approvalNote: input.approvalNote });
    const coverage = evaluatePerspectiveCoverage(approved);
    const payload = {
      coverageObjectives: approved.coverageObjectives,
      participantSlots: approved.participantSlots,
      acceptedGaps: approved.acceptedGaps,
      coverage: { covered: coverage.covered, accepted: coverage.accepted },
      designSessionScheduledFor: input.designSessionScheduledFor,
      designSessionAcknowledged: input.designSessionAcknowledged,
      approvalNote: approved.approvalNote
    };
    const inserted = await query(
      `INSERT INTO app_private.diagnostic_participant_plans
        (id, workspace_id, diagnostic_id, discovery_version, approved_payload,
         approved_by_clerk_user_id, approved_at, created_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $7)
       RETURNING id, diagnostic_id, discovery_version, approved_payload, approved_at`,
      [approved.participantPlanId, workspaceId, approved.diagnosticId, approved.discoveryVersion,
        JSON.stringify(payload), actorUserId, approved.approvedAt]
    );
    await query(
      `UPDATE app_shared.diagnostics SET state = 'protocol-review', updated_at = $2 WHERE id = $1`,
      [approved.diagnosticId, approved.approvedAt]
    );
    await query(
      `INSERT INTO app_operations.audit_events
        (workspace_id, actor_clerk_user_id, action, target_type, target_id, metadata)
       VALUES ($1, $2, 'diagnostic.participant-plan-approved', 'diagnostic', $3, $4::jsonb)`,
      [workspaceId, actorUserId, approved.diagnosticId, JSON.stringify({
        discoveryVersion: approved.discoveryVersion,
        plannedSlots: approved.participantSlots.length,
        acceptedCoverageGaps: approved.acceptedGaps.length,
        designSessionScheduledFor: input.designSessionScheduledFor,
        nextState: "protocol-review"
      })]
    );
    return publicPlan(inserted.rows[0]);
  }, connectionString);
}

export const workspaceDiagnosticParticipantPolicy = Object.freeze({
  discoveryVersion: diagnosticDiscovery.version,
  leadershipLevels: diagnosticDiscovery.leadershipLevels,
  executionProximities: diagnosticDiscovery.executionProximities,
  functionalLenses: diagnosticDiscovery.functionalLenses,
  fixedParticipantMinimum: null,
  confidentialityParticipantMinimum: 5,
  pocParticipantMaximum: 10,
  fullDiagnosticParticipantMaximum: 50,
  sponsorCountsAsParticipant: false,
  eligibleParticipantBoundary: "internal-organization",
  participantIdentityStoredInPlan: false
});
