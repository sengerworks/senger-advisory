import {
  approveDiagnosticContextBrief,
  createDiagnosticContextBrief,
  diagnosticDiscovery
} from "../../diagnostic-discovery-engine.js";
import { withNeonWorkspaceTransaction } from "./neon-workspace-database.mjs";

const allowedInputKeys = new Set([
  "diagnosticId", "organizationSizeBand", "organizationHeadcount", "sponsorPerspective", "sponsorRoleTitle",
  "sponsorOrganizationalLevel", "sponsorFunction", "sponsorResponsibility",
  "diagnosticScopeType", "diagnosticScopeName", "diagnosticScopeHeadcount", "diagnosticScopeBoundary",
  "crossBoundaryDependencies", "guidanceSessionScheduledFor", "guidanceSessionAcknowledged",
  "organizationContext",
  "strategicPriority", "triggeringConcern", "decisionsAtRisk", "recentChanges",
  "priorInterventions", "knownSensitivities", "decisionNeeded", "approvalNote"
]);

export class DiagnosticContextInputError extends Error {}
export class DiagnosticContextStateError extends Error {}

export function validateDiagnosticContextId(value) {
  const diagnosticId = String(value || "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(diagnosticId)) {
    throw new DiagnosticContextInputError("Choose a valid diagnostic.");
  }
  return diagnosticId;
}

export function validateDiagnosticContextInput(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new DiagnosticContextInputError("Enter the diagnostic context brief.");
  }
  const unexpected = Object.keys(value).filter(key => !allowedInputKeys.has(key));
  if (unexpected.length) throw new DiagnosticContextInputError("The context brief contains unsupported fields.");
  try {
    const { approvalNote = "", ...briefInput } = value;
    briefInput.diagnosticId = validateDiagnosticContextId(briefInput.diagnosticId);
    const brief = createDiagnosticContextBrief(briefInput, {
      id: "00000000-0000-4000-8000-000000000001",
      now: new Date(0)
    });
    const approved = approveDiagnosticContextBrief(brief, { approvalNote }, { now: new Date(0) });
    return Object.freeze({
      ...briefInput,
      recentChanges: Object.freeze([...approved.recentChanges]),
      priorInterventions: Object.freeze([...approved.priorInterventions]),
      knownSensitivities: approved.knownSensitivities,
      approvalNote: approved.approvalNote
    });
  } catch (error) {
    throw new DiagnosticContextInputError(error.message);
  }
}

function publicContext(row) {
  if (!row) return null;
  return Object.freeze({
    id: row.id,
    diagnosticId: row.diagnostic_id,
    discoveryVersion: row.discovery_version,
    ...row.approved_payload,
    approvedAt: new Date(row.approved_at).toISOString()
  });
}

export async function getWorkspaceDiagnosticContext(workspaceId, diagnosticId, connectionString) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    const result = await query(
      `SELECT id, diagnostic_id, discovery_version, approved_payload, approved_at
       FROM app_private.diagnostic_context_briefs
       WHERE diagnostic_id = $1
       LIMIT 1`,
      [diagnosticId]
    );
    return publicContext(result.rows[0]);
  }, connectionString);
}

export async function approveWorkspaceDiagnosticContext(
  { workspaceId, actorUserId, input },
  connectionString
) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    const diagnosticResult = await query(
      `SELECT diagnostic.id, diagnostic.state, entitlement.status AS entitlement_status
       FROM app_shared.diagnostics diagnostic
       LEFT JOIN app_shared.commercial_entitlements entitlement
         ON entitlement.workspace_id = diagnostic.workspace_id
        AND entitlement.diagnostic_id = diagnostic.id
        AND entitlement.entitlement_kind IN ('diagnostic', 'poc')
       WHERE diagnostic.id = $1
       FOR UPDATE OF diagnostic`,
      [input.diagnosticId]
    );
    const diagnostic = diagnosticResult.rows[0];
    if (!diagnostic) throw new DiagnosticContextStateError("That diagnostic is not available in this workspace.");
    if (diagnostic.entitlement_status !== "active") {
      throw new DiagnosticContextStateError("Diagnostic access must be active before discovery can begin.");
    }
    if (!new Set(["draft", "discovery"]).has(diagnostic.state)) {
      throw new DiagnosticContextStateError("The context brief is already complete for this diagnostic.");
    }
    const guidanceSession = await query(
      `SELECT id,status FROM app_operations.diagnostic_steward_sessions
       WHERE diagnostic_id=$1 AND session_type='guidance' AND scheduled_at=$2::timestamptz`,
      [input.diagnosticId,input.guidanceSessionScheduledFor]
    );
    if (!guidanceSession.rowCount || guidanceSession.rows[0].status === "cancelled") {
      throw new DiagnosticContextStateError("Book and confirm the required Guidance Session before approving the Context Brief.");
    }

    const { approvalNote, ...briefInput } = input;
    const draft = createDiagnosticContextBrief(briefInput);
    const approved = approveDiagnosticContextBrief(draft, { approvalNote });
    const payload = {
      organizationSizeBand: approved.organizationSizeBand,
      organizationHeadcount: approved.organizationHeadcount,
      sponsorPerspective: approved.sponsorPerspective,
      sponsorRoleTitle: approved.sponsorRoleTitle,
      sponsorOrganizationalLevel: approved.sponsorOrganizationalLevel,
      sponsorFunction: approved.sponsorFunction,
      sponsorResponsibility: approved.sponsorResponsibility,
      diagnosticScopeType: approved.diagnosticScopeType,
      diagnosticScopeName: approved.diagnosticScopeName,
      diagnosticScopeHeadcount: approved.diagnosticScopeHeadcount,
      diagnosticScopeBoundary: approved.diagnosticScopeBoundary,
      crossBoundaryDependencies: approved.crossBoundaryDependencies,
      guidanceSessionScheduledFor: approved.guidanceSessionScheduledFor,
      guidanceSessionAcknowledged: approved.guidanceSessionAcknowledged,
      organizationContext: approved.organizationContext,
      strategicPriority: approved.strategicPriority,
      triggeringConcern: approved.triggeringConcern,
      decisionsAtRisk: approved.decisionsAtRisk,
      recentChanges: approved.recentChanges,
      priorInterventions: approved.priorInterventions,
      knownSensitivities: approved.knownSensitivities,
      decisionNeeded: approved.decisionNeeded,
      approvalNote: approved.approvalNote
    };
    const inserted = await query(
      `INSERT INTO app_private.diagnostic_context_briefs
        (id, workspace_id, diagnostic_id, discovery_version, approved_payload,
         approved_by_clerk_user_id, approved_at, created_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $7)
       RETURNING id, diagnostic_id, discovery_version, approved_payload, approved_at`,
      [approved.contextBriefId, workspaceId, approved.diagnosticId, approved.discoveryVersion,
        JSON.stringify(payload), actorUserId, approved.approvedAt]
    );
    await query(
      `UPDATE app_shared.diagnostics
       SET state = 'participant-design', updated_at = $2
       WHERE id = $1`,
      [approved.diagnosticId, approved.approvedAt]
    );
    await query(
      `INSERT INTO app_operations.audit_events
        (workspace_id, actor_clerk_user_id, action, target_type, target_id, metadata)
       VALUES ($1, $2, 'diagnostic.context-approved', 'diagnostic', $3, $4::jsonb)`,
      [workspaceId, actorUserId, approved.diagnosticId, JSON.stringify({
        discoveryVersion: approved.discoveryVersion,
        diagnosticScopeType: approved.diagnosticScopeType,
        guidanceSessionScheduledFor: approved.guidanceSessionScheduledFor,
        nextState: "participant-design"
      })]
    );
    return publicContext(inserted.rows[0]);
  }, connectionString);
}

export const workspaceDiagnosticDiscoveryPolicy = Object.freeze({
  discoveryVersion: diagnosticDiscovery.version,
  organizationSizeBands: diagnosticDiscovery.organizationSizeBands,
  sponsorPerspectives: diagnosticDiscovery.sponsorPerspectives,
  sponsorOrganizationalLevels: diagnosticDiscovery.sponsorOrganizationalLevels,
  sponsorFunctions: diagnosticDiscovery.sponsorFunctions,
  diagnosticScopeTypes: diagnosticDiscovery.diagnosticScopeTypes
});
