import { withNeonWorkspaceTransaction } from "./neon-workspace-database.mjs";
import { validateDiagnosticContextId } from "./workspace-diagnostic-context.mjs";

export const DIAGNOSTIC_NOTICE_VERSION = "1.0.0";
export class DiagnosticParticipationInputError extends Error {}
export class DiagnosticParticipationStateError extends Error {}

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
      `SELECT diagnostic.delivery_route, protocol.id AS protocol_id,
              protocol.protocol_version, protocol.governed_questions
       FROM app_shared.diagnostics diagnostic
       JOIN app_shared.diagnostic_protocols protocol
         ON protocol.workspace_id = diagnostic.workspace_id AND protocol.diagnostic_id = diagnostic.id
       WHERE diagnostic.id = $1`,
      [diagnosticId]
    );
    if (result.rowCount !== 1) throw new DiagnosticParticipationStateError("The diagnostic protocol is not available.");
    const accepted = linked.rows[0].notice_version === DIAGNOSTIC_NOTICE_VERSION && linked.rows[0].notice_accepted_at !== null;
    return {
      state: accepted ? "ready" : "notice-required",
      diagnosticId,
      route: result.rows[0].delivery_route,
      noticeVersion: DIAGNOSTIC_NOTICE_VERSION,
      noticeAccepted: accepted,
      protocol: accepted ? {
        id: result.rows[0].protocol_id,
        version: result.rows[0].protocol_version,
        questions: result.rows[0].governed_questions
      } : null
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
