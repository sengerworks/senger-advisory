import { withNeonWorkspaceTransaction } from "./neon-workspace-database.mjs";
import { validateDiagnosticContextId } from "./workspace-diagnostic-context.mjs";

export class DiagnosticAdvisorAssignmentInputError extends Error {}
export class DiagnosticAdvisorAssignmentStateError extends Error {}

export function validateDevelopmentAdvisorAssignment(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)
    || Object.keys(value).sort().join(",") !== "diagnosticId,purpose") {
    throw new DiagnosticAdvisorAssignmentInputError("Choose one diagnostic and assignment purpose.");
  }
  const purpose = String(value.purpose || "").trim();
  if (purpose.length < 20 || purpose.length > 500) throw new DiagnosticAdvisorAssignmentInputError("Describe the advisor assignment purpose in 20 to 500 characters.");
  return Object.freeze({ diagnosticId: validateDiagnosticContextId(value.diagnosticId), purpose });
}

function publicAssignment(row) {
  return Object.freeze({
    assignmentId: row.id,
    diagnosticId: row.diagnostic_id,
    diagnosticRoute: row.delivery_route,
    diagnosticState: row.diagnostic_state,
    purpose: row.purpose,
    startsAt: new Date(row.starts_at).toISOString(),
    expiresAt: new Date(row.expires_at).toISOString()
  });
}

export async function listActiveDiagnosticAdvisorAssignments(
  { workspaceId, userId, now = new Date() }, connectionString
) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    const result = await query(
      `SELECT assignment.id, assignment.diagnostic_id, assignment.purpose,
              assignment.starts_at, assignment.expires_at,
              diagnostic.delivery_route, diagnostic.state AS diagnostic_state
       FROM app_operations.diagnostic_advisor_assignments assignment
       JOIN app_shared.diagnostics diagnostic
         ON diagnostic.workspace_id = assignment.workspace_id
        AND diagnostic.id = assignment.diagnostic_id
       WHERE assignment.advisor_clerk_user_id = $1
         AND assignment.revoked_at IS NULL
         AND assignment.starts_at <= $2::timestamptz
         AND assignment.expires_at > $2::timestamptz
       ORDER BY assignment.created_at DESC`,
      [userId, now.toISOString()]
    );
    return result.rows.map(publicAssignment);
  }, connectionString);
}

export async function createDevelopmentAdvisorAssignment(
  { workspaceId, userId, input, now = new Date() }, connectionString
) {
  if (process.env.WORKSPACE_ENVIRONMENT !== "development") {
    throw new DiagnosticAdvisorAssignmentStateError("Development advisor self-assignment is disabled outside the local POC environment.");
  }
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    const diagnostic = await query(`SELECT id FROM app_shared.diagnostics WHERE id = $1`, [input.diagnosticId]);
    if (diagnostic.rowCount !== 1) throw new DiagnosticAdvisorAssignmentStateError("That diagnostic is not available in this workspace.");
    await query(
      `UPDATE app_operations.diagnostic_advisor_assignments
       SET revoked_at = $3::timestamptz
       WHERE diagnostic_id = $1 AND advisor_clerk_user_id = $2
         AND revoked_at IS NULL AND expires_at <= $3::timestamptz`,
      [input.diagnosticId, userId, now.toISOString()]
    );
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const result = await query(
      `INSERT INTO app_operations.diagnostic_advisor_assignments
        (workspace_id, diagnostic_id, advisor_clerk_user_id, purpose,
         assigned_by_clerk_user_id, starts_at, expires_at)
       VALUES ($1, $2, $3, $4, $3, $5::timestamptz, $6::timestamptz)
       ON CONFLICT (workspace_id, diagnostic_id, advisor_clerk_user_id)
         WHERE revoked_at IS NULL
       DO UPDATE SET purpose = EXCLUDED.purpose, expires_at = EXCLUDED.expires_at
       RETURNING id, diagnostic_id, purpose, starts_at, expires_at`,
      [workspaceId, input.diagnosticId, userId, input.purpose, now.toISOString(), expiresAt.toISOString()]
    );
    const joined = await query(
      `SELECT $1::uuid AS id, $2::uuid AS diagnostic_id, $3::text AS purpose,
              $4::timestamptz AS starts_at, $5::timestamptz AS expires_at,
              diagnostic.delivery_route, diagnostic.state AS diagnostic_state
       FROM app_shared.diagnostics diagnostic WHERE diagnostic.id = $2`,
      [result.rows[0].id, input.diagnosticId, result.rows[0].purpose, result.rows[0].starts_at, result.rows[0].expires_at]
    );
    await query(
      `INSERT INTO app_operations.audit_events
        (workspace_id, actor_clerk_user_id, action, target_type, target_id, metadata)
       VALUES ($1, $2, 'diagnostic.advisor-development-assigned', 'diagnostic', $3, $4::jsonb)`,
      [workspaceId, userId, input.diagnosticId, JSON.stringify({ expiresAt: expiresAt.toISOString(), developmentOnly: true })]
    );
    return publicAssignment(joined.rows[0]);
  }, connectionString);
}
