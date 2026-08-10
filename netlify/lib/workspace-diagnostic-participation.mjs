import { withNeonWorkspaceTransaction } from "./neon-workspace-database.mjs";
import { validateDiagnosticContextId } from "./workspace-diagnostic-context.mjs";

export const DIAGNOSTIC_NOTICE_VERSION = "2.0.0";
export class DiagnosticParticipationInputError extends Error {}
export class DiagnosticParticipationStateError extends Error {}

export function diagnosticCollectionRoute(row) {
  const version=row.v2_activation_id?"2.0.0":"1.0.0";
  const protocolId=version==="2.0.0"?row.v2_protocol_id:row.v1_protocol_id;
  const protocolVersion=version==="2.0.0"?row.v2_protocol_version:row.v1_protocol_version;
  const questions=version==="2.0.0"?row.v2_governed_questions:row.v1_governed_questions;
  if(!protocolId||!Array.isArray(questions))throw new DiagnosticParticipationStateError("The activated diagnostic protocol is not available.");
  return Object.freeze({interviewVersion:version,protocol:Object.freeze({id:protocolId,version:protocolVersion,questions:Object.freeze(questions)})});
}

export async function getDiagnosticParticipation(
  { workspaceId, userId, invitationId, diagnosticId }, connectionString
) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    const linked = await query(
      `UPDATE app_identity.diagnostic_participant_slots
       SET clerk_user_id = COALESCE(clerk_user_id, $3)
       WHERE diagnostic_id = $1 AND clerk_invitation_id = $2
         AND revoked_at IS NULL AND (clerk_user_id IS NULL OR clerk_user_id = $3)
       RETURNING id, notice_version, notice_accepted_at`,
      [diagnosticId, invitationId, userId]
    );
    if (linked.rowCount !== 1) throw new DiagnosticParticipationStateError("This diagnostic invitation is not available.");
    const result = await query(
      `SELECT diagnostic.delivery_route, activation.id AS v2_activation_id,
              protocol.id AS v1_protocol_id,protocol.protocol_version AS v1_protocol_version,
              protocol.governed_questions AS v1_governed_questions,
              protocol_v2.id AS v2_protocol_id,protocol_v2.protocol_version AS v2_protocol_version,
              protocol_v2.governed_questions AS v2_governed_questions
       FROM app_shared.diagnostics diagnostic
       LEFT JOIN app_shared.diagnostic_protocols protocol
         ON protocol.workspace_id = diagnostic.workspace_id AND protocol.diagnostic_id = diagnostic.id
       LEFT JOIN app_operations.diagnostic_v2_collection_activations activation
         ON activation.workspace_id=diagnostic.workspace_id AND activation.diagnostic_id=diagnostic.id AND activation.deactivated_at IS NULL
       LEFT JOIN app_shared.diagnostic_protocols_v2 protocol_v2
         ON protocol_v2.workspace_id=activation.workspace_id AND protocol_v2.diagnostic_id=activation.diagnostic_id AND protocol_v2.id=activation.protocol_id
       WHERE diagnostic.id = $1`,
      [diagnosticId]
    );
    if (result.rowCount !== 1) throw new DiagnosticParticipationStateError("The diagnostic protocol is not available.");
    const accepted = linked.rows[0].notice_version === DIAGNOSTIC_NOTICE_VERSION && linked.rows[0].notice_accepted_at !== null;
    const route=diagnosticCollectionRoute(result.rows[0]);
    return {
      state: accepted ? "ready" : "notice-required",
      diagnosticId,
      route: result.rows[0].delivery_route,
      noticeVersion: DIAGNOSTIC_NOTICE_VERSION,
      noticeAccepted: accepted,
      interviewVersion: route.interviewVersion,
      protocol: accepted ? route.protocol : null
    };
  }, connectionString);
}

export async function acceptDiagnosticNotice(
  { workspaceId, userId, diagnosticId, noticeVersion, now = new Date() }, connectionString
) {
  validateDiagnosticContextId(diagnosticId);
  if (noticeVersion !== DIAGNOSTIC_NOTICE_VERSION) throw new DiagnosticParticipationInputError("Accept the current diagnostic privacy notice.");
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    const result = await query(
      `UPDATE app_identity.diagnostic_participant_slots
       SET notice_version = $3, notice_accepted_at = $4
       WHERE diagnostic_id = $1 AND clerk_user_id = $2 AND revoked_at IS NULL
       RETURNING id`,
      [diagnosticId, userId, noticeVersion, now.toISOString()]
    );
    if (result.rowCount !== 1) throw new DiagnosticParticipationStateError("This diagnostic invitation is not available.");
    await query(
      `UPDATE app_shared.diagnostics SET state = 'collecting', updated_at = $2
       WHERE id = $1 AND state = 'protocol-review'`,
      [diagnosticId, now.toISOString()]
    );
    return { accepted: true };
  }, connectionString);
}
