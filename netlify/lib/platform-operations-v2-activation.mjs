import { withNeonWorkspaceTransaction } from "./neon-workspace-database.mjs";
import { validateDiagnosticContextId } from "./workspace-diagnostic-context.mjs";

export class DiagnosticV2ActivationInputError extends Error {}
export class DiagnosticV2ActivationStateError extends Error {}

export function validateDiagnosticV2Activation(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).sort().join(",") !== "activationNote,diagnosticId") throw new DiagnosticV2ActivationInputError("Only the diagnostic and activation note are accepted.");
  let diagnosticId;
  try { diagnosticId = validateDiagnosticContextId(value.diagnosticId); } catch (error) { throw new DiagnosticV2ActivationInputError(error.message); }
  const activationNote = String(value.activationNote || "").trim().replace(/\s+/g, " ");
  if (activationNote.length < 40 || activationNote.length > 1000) throw new DiagnosticV2ActivationInputError("Record a 40–1000 character reason for activating Protocol v2.");
  return Object.freeze({ diagnosticId, activationNote });
}

export async function activateDiagnosticV2Collection({ workspaceId, userId, input, now = new Date() }, connectionString) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    const source = await query(
      `SELECT diagnostic.id,frame.id AS frame_id,protocol.id AS protocol_id,activation.id AS activation_id,
              count(DISTINCT interview.id)::integer + count(DISTINCT interview_v2.id)::integer AS interview_count
       FROM app_shared.diagnostics diagnostic
       LEFT JOIN app_private.diagnostic_frames_v2 frame ON frame.workspace_id=diagnostic.workspace_id AND frame.diagnostic_id=diagnostic.id AND frame.status='approved'
       LEFT JOIN app_shared.diagnostic_protocols_v2 protocol ON protocol.workspace_id=diagnostic.workspace_id AND protocol.diagnostic_id=diagnostic.id AND protocol.frame_id=frame.id
       LEFT JOIN app_operations.diagnostic_v2_collection_activations activation ON activation.workspace_id=diagnostic.workspace_id AND activation.diagnostic_id=diagnostic.id AND activation.deactivated_at IS NULL
       LEFT JOIN app_private.diagnostic_interviews interview ON interview.workspace_id=diagnostic.workspace_id AND interview.diagnostic_id=diagnostic.id
       LEFT JOIN app_private.diagnostic_interviews_v2 interview_v2 ON interview_v2.workspace_id=diagnostic.workspace_id AND interview_v2.diagnostic_id=diagnostic.id
       WHERE diagnostic.id=$1 GROUP BY diagnostic.id,frame.id,protocol.id,activation.id LIMIT 1`, [input.diagnosticId]
    );
    const row = source.rows[0];
    if (!row) throw new DiagnosticV2ActivationStateError("That diagnostic is not available in this workspace.");
    if (row.activation_id) throw new DiagnosticV2ActivationStateError("Protocol v2 is already active for this diagnostic.");
    if (!row.frame_id || !row.protocol_id) throw new DiagnosticV2ActivationStateError("Approve the v2 Diagnostic Frame and protocol before activation.");
    if (Number(row.interview_count) > 0) throw new DiagnosticV2ActivationStateError("Protocol version cannot change after participant collection has begun.");
    const inserted = await query(
      `INSERT INTO app_operations.diagnostic_v2_collection_activations
        (workspace_id,diagnostic_id,frame_id,protocol_id,interview_version,activation_note,activated_by_clerk_user_id,activated_at)
       VALUES ($1,$2,$3,$4,'2.0.0',$5,$6,$7) RETURNING id,diagnostic_id,interview_version,activation_note,activated_at`,
      [workspaceId,input.diagnosticId,row.frame_id,row.protocol_id,input.activationNote,userId,now]
    );
    await query(
      `INSERT INTO app_operations.audit_events (workspace_id,actor_clerk_user_id,action,target_type,target_id,metadata)
       VALUES ($1,$2,'diagnostic.collection-v2-activated','diagnostic',$3,$4::jsonb)`,
      [workspaceId,userId,input.diagnosticId,JSON.stringify({ frameId: row.frame_id, protocolId: row.protocol_id, interviewVersion: "2.0.0", activationNote: input.activationNote })]
    );
    const activation = inserted.rows[0];
    return Object.freeze({ activationId: activation.id, diagnosticId: activation.diagnostic_id, interviewVersion: activation.interview_version, activationNote: activation.activation_note, activatedAt: new Date(activation.activated_at).toISOString() });
  }, connectionString);
}

export const diagnosticV2ActivationPolicy = Object.freeze({ explicitPlatformOperatorActionRequired: true, approvedFrameRequired: true, approvedProtocolRequired: true, collectionMustNotHaveBegun: true, auditable: true });
