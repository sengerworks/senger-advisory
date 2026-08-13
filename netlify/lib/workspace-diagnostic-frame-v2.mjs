import { approveDiagnosticFrame, createDiagnosticFrame, diagnosticFramePolicy } from "../../diagnostic-frame-engine-v2.js";
import { withNeonWorkspaceTransaction } from "./neon-workspace-database.mjs";
import { validateDiagnosticContextId } from "./workspace-diagnostic-context.mjs";
import { requireAdvisorAssignment } from "./workspace-diagnostic-evidence-review.mjs";

export class DiagnosticFrameV2InputError extends Error {}
export class DiagnosticFrameV2StateError extends Error {}

const approvalKeys = new Set(["approvalNote", "confirmedExecutionDemand", "acceptedEvidencePlan"]);

export function validateDiagnosticFrameV2Input(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new DiagnosticFrameV2InputError("Enter the Diagnostic Frame.");
  const allowed = new Set(["diagnosticId", "organizationContext", "executionDemand", "diagnosticQuestion", "leadershipDecision", "performanceConsequences", "complexityObservations", "evidencePlan", "outOfScope", "knownSensitivities", ...approvalKeys]);
  if (Object.keys(value).some(key => !allowed.has(key))) throw new DiagnosticFrameV2InputError("The Diagnostic Frame contains unsupported fields.");
  try {
    const approval = Object.fromEntries([...approvalKeys].map(key => [key, value[key]]));
    const frameValues = Object.fromEntries(Object.entries(value).filter(([key]) => !approvalKeys.has(key)));
    frameValues.diagnosticId = validateDiagnosticContextId(frameValues.diagnosticId);
    const draft = createDiagnosticFrame(frameValues, { id: "00000000-0000-4000-8000-000000000035", now: new Date(0) });
    const approved = approveDiagnosticFrame(draft, approval, { now: new Date(0) });
    return Object.freeze({ frameValues: Object.freeze(frameValues), approval: Object.freeze(approval), readiness: Object.freeze({ ready: true }) });
  } catch (error) {
    throw new DiagnosticFrameV2InputError(error.message);
  }
}

export function toPublicDiagnosticFrameV2(row) {
  if (!row?.id) return null;
  return Object.freeze({
    frameId: row.id,
    diagnosticId: row.diagnostic_id,
    frameVersion: row.frame_version,
    status: row.status,
    ...row.frame_payload,
    approvedAt: row.approved_at ? new Date(row.approved_at).toISOString() : null,
    updatedAt: new Date(row.updated_at).toISOString()
  });
}

function publicContext(row) {
  if (!row?.context_payload) return null;
  return Object.freeze({
    organizationContext: row.context_payload.organizationContext,
    industry: row.context_payload.industry,
    businessModel: row.context_payload.businessModel,
    operatingEnvironment: row.context_payload.operatingEnvironment,
    organizationOffering: row.context_payload.organizationOffering,
    strategicPriority: row.context_payload.strategicPriority,
    triggeringConcern: row.context_payload.triggeringConcern,
    decisionsAtRisk: row.context_payload.decisionsAtRisk,
    decisionNeeded: row.context_payload.decisionNeeded,
    knownSensitivities: row.context_payload.knownSensitivities,
    recentChanges: row.context_payload.recentChanges || [],
    priorInterventions: row.context_payload.priorInterventions || []
  });
}

export async function getDiagnosticFrameV2({ workspaceId, userId, diagnosticId, now = new Date() }, connectionString) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    await requireAdvisorAssignment(query, { diagnosticId, userId, now });
    const result = await query(
      `SELECT frame.id, frame.diagnostic_id, frame.frame_version, frame.status,
              frame.frame_payload, frame.approved_at, frame.updated_at,
              context.approved_payload AS context_payload
       FROM app_shared.diagnostics diagnostic
       LEFT JOIN app_private.diagnostic_frames_v2 frame
         ON frame.workspace_id = diagnostic.workspace_id AND frame.diagnostic_id = diagnostic.id
       LEFT JOIN app_private.diagnostic_context_briefs context
         ON context.workspace_id = diagnostic.workspace_id AND context.diagnostic_id = diagnostic.id
       WHERE diagnostic.id = $1 LIMIT 1`,
      [diagnosticId]
    );
    if (!result.rows[0]) throw new DiagnosticFrameV2StateError("That diagnostic is not available in this workspace.");
    return Object.freeze({ frame: toPublicDiagnosticFrameV2(result.rows[0]), context: publicContext(result.rows[0]), policy: diagnosticFramePolicy });
  }, connectionString);
}

export async function approveDiagnosticFrameV2({ workspaceId, userId, input, now = new Date() }, connectionString) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    await requireAdvisorAssignment(query, { diagnosticId: input.frameValues.diagnosticId, userId, now });
    const exists = await query("SELECT id FROM app_private.diagnostic_frames_v2 WHERE diagnostic_id = $1 LIMIT 1", [input.frameValues.diagnosticId]);
    if (exists.rowCount) throw new DiagnosticFrameV2StateError("A v2 Diagnostic Frame already exists for this diagnostic.");
    const draft = createDiagnosticFrame(input.frameValues, { now });
    const approved = approveDiagnosticFrame(draft, input.approval, { now });
    const { frameId, frameVersion, diagnosticId, status, approval, createdAt, updatedAt, ...payload } = approved;
    const inserted = await query(
      `INSERT INTO app_private.diagnostic_frames_v2
        (id,workspace_id,diagnostic_id,frame_version,status,frame_payload,created_by_clerk_user_id,
         approved_by_clerk_user_id,approved_at,created_at,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$7,$8::timestamptz,$9::timestamptz,$10::timestamptz)
       RETURNING id,diagnostic_id,frame_version,status,frame_payload,approved_at,updated_at`,
      [frameId, workspaceId, diagnosticId, frameVersion, status, JSON.stringify(payload), userId, approval.approvedAt, createdAt, updatedAt]
    );
    await query(
      `INSERT INTO app_operations.audit_events
        (workspace_id,actor_clerk_user_id,action,target_type,target_id,metadata)
       VALUES ($1,$2,'diagnostic.frame-v2-approved','diagnostic-frame-v2',$3,$4::jsonb)`,
      [workspaceId, userId, frameId, JSON.stringify({ diagnosticId, frameVersion })]
    );
    return toPublicDiagnosticFrameV2(inserted.rows[0]);
  }, connectionString);
}

export const workspaceDiagnosticFrameV2Policy = Object.freeze({
  ...diagnosticFramePolicy,
  activeAdvisorAssignmentRequired: true,
  mutatesV1Records: false,
  clientVisible: false
});
