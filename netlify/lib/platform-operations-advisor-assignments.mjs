import { withNeonWorkspaceTransaction } from "./neon-workspace-database.mjs";
import { validateDiagnosticContextId } from "./workspace-diagnostic-context.mjs";

export class PlatformAdvisorAssignmentInputError extends Error {}
export class PlatformAdvisorAssignmentStateError extends Error {}

const clerkUserId = value => {
  const id = String(value || "").trim();
  if (!/^user_[A-Za-z0-9]+$/.test(id)) throw new PlatformAdvisorAssignmentInputError("Enter a valid Clerk advisor user ID.");
  return id;
};

export function validatePlatformAdvisorAssignment(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new PlatformAdvisorAssignmentInputError("Enter a valid advisor assignment.");
  const keys = Object.keys(value).sort().join(",");
  if (value.action === "assign" && keys !== "action,advisorClerkUserId,diagnosticId,durationDays,purpose") throw new PlatformAdvisorAssignmentInputError("Enter only the supported assignment fields.");
  if (value.action === "revoke" && keys !== "action,assignmentId,diagnosticId,reason") throw new PlatformAdvisorAssignmentInputError("Enter only the supported revocation fields.");
  const diagnosticId = validateDiagnosticContextId(value.diagnosticId);
  if (value.action === "assign") {
    const purpose = String(value.purpose || "").trim();
    const durationDays = Number(value.durationDays);
    if (purpose.length < 20 || purpose.length > 500) throw new PlatformAdvisorAssignmentInputError("Describe the assignment purpose in 20 to 500 characters.");
    if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 30) throw new PlatformAdvisorAssignmentInputError("Choose an assignment duration from 1 to 30 days.");
    return Object.freeze({ action: "assign", diagnosticId, advisorClerkUserId: clerkUserId(value.advisorClerkUserId), purpose, durationDays });
  }
  if (value.action === "revoke") {
    const reason = String(value.reason || "").trim();
    if (!/^[0-9a-f-]{36}$/i.test(String(value.assignmentId || ""))) throw new PlatformAdvisorAssignmentInputError("Choose a valid advisor assignment.");
    if (reason.length < 20 || reason.length > 500) throw new PlatformAdvisorAssignmentInputError("Describe the revocation reason in 20 to 500 characters.");
    return Object.freeze({ action: "revoke", diagnosticId, assignmentId: value.assignmentId, reason });
  }
  throw new PlatformAdvisorAssignmentInputError("Choose assign or revoke.");
}

const publicAssignment = row => Object.freeze({
  assignmentId: row.id,
  diagnosticId: row.diagnostic_id,
  advisorClerkUserId: row.advisor_clerk_user_id,
  purpose: row.purpose,
  startsAt: new Date(row.starts_at).toISOString(),
  expiresAt: new Date(row.expires_at).toISOString(),
  active: !row.revoked_at && new Date(row.expires_at) > new Date()
});

export async function listPlatformAdvisorAssignments(workspaceId, connectionString) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    const result = await query(
      `SELECT id, diagnostic_id, advisor_clerk_user_id, purpose, starts_at, expires_at, revoked_at
       FROM app_operations.diagnostic_advisor_assignments
       ORDER BY created_at DESC`, []
    );
    return result.rows.map(publicAssignment);
  }, connectionString);
}

export async function changePlatformAdvisorAssignment({ workspaceId, actorUserId, input, now = new Date() }, connectionString) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    const diagnostic = await query(`SELECT id FROM app_shared.diagnostics WHERE id = $1`, [input.diagnosticId]);
    if (diagnostic.rowCount !== 1) throw new PlatformAdvisorAssignmentStateError("That diagnostic is not available in this client organization.");
    if (input.action === "revoke") {
      const result = await query(
        `UPDATE app_operations.diagnostic_advisor_assignments SET revoked_at = $3::timestamptz
         WHERE id = $1 AND diagnostic_id = $2 AND revoked_at IS NULL RETURNING advisor_clerk_user_id`,
        [input.assignmentId, input.diagnosticId, now.toISOString()]
      );
      if (result.rowCount !== 1) throw new PlatformAdvisorAssignmentStateError("That assignment is no longer active.");
      await query(
        `INSERT INTO app_operations.audit_events (workspace_id, actor_clerk_user_id, action, target_type, target_id, metadata)
         VALUES ($1, $2, 'diagnostic.advisor-revoked', 'diagnostic', $3, $4::jsonb)`,
        [workspaceId, actorUserId, input.diagnosticId, JSON.stringify({ assignmentId: input.assignmentId, advisorClerkUserId: result.rows[0].advisor_clerk_user_id, reason: input.reason })]
      );
      return Object.freeze({ action: "revoked", assignmentId: input.assignmentId });
    }
    await query(
      `UPDATE app_operations.diagnostic_advisor_assignments SET revoked_at = $3::timestamptz
       WHERE diagnostic_id = $1 AND advisor_clerk_user_id = $2 AND revoked_at IS NULL AND expires_at <= $3::timestamptz`,
      [input.diagnosticId, input.advisorClerkUserId, now.toISOString()]
    );
    const expiresAt = new Date(now.getTime() + input.durationDays * 86400000);
    const result = await query(
      `INSERT INTO app_operations.diagnostic_advisor_assignments
        (workspace_id, diagnostic_id, advisor_clerk_user_id, purpose, assigned_by_clerk_user_id, starts_at, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6::timestamptz, $7::timestamptz)
       ON CONFLICT (workspace_id, diagnostic_id, advisor_clerk_user_id) WHERE revoked_at IS NULL
       DO UPDATE SET purpose = EXCLUDED.purpose, expires_at = EXCLUDED.expires_at, assigned_by_clerk_user_id = EXCLUDED.assigned_by_clerk_user_id
       RETURNING id, diagnostic_id, advisor_clerk_user_id, purpose, starts_at, expires_at, revoked_at`,
      [workspaceId, input.diagnosticId, input.advisorClerkUserId, input.purpose, actorUserId, now.toISOString(), expiresAt.toISOString()]
    );
    await query(
      `INSERT INTO app_operations.audit_events (workspace_id, actor_clerk_user_id, action, target_type, target_id, metadata)
       VALUES ($1, $2, 'diagnostic.advisor-assigned', 'diagnostic', $3, $4::jsonb)`,
      [workspaceId, actorUserId, input.diagnosticId, JSON.stringify({ assignmentId: result.rows[0].id, advisorClerkUserId: input.advisorClerkUserId, purpose: input.purpose, expiresAt: expiresAt.toISOString() })]
    );
    return publicAssignment(result.rows[0]);
  }, connectionString);
}
