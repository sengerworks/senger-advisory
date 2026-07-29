import { createDiagnostic, diagnosticLifecycle } from "../../diagnostic-lifecycle-engine.js";
import { withNeonWorkspaceTransaction } from "./neon-workspace-database.mjs";

const METHOD_VERSION = "1.0.0";
const MAX_DIAGNOSTICS_RETURNED = 20;

export class DiagnosticInputError extends Error {}

function publicDiagnostic(row) {
  return Object.freeze({
    id: row.id,
    route: row.delivery_route,
    entitlementType: row.entitlement_type,
    entitlementStatus: row.entitlement_status,
    state: row.state,
    humanReviewState: row.human_review_status,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString()
  });
}

export function validateDiagnosticDraft(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new DiagnosticInputError("Choose the diagnostic route and entitlement type.");
  }
  if (Object.keys(value).sort().join(",") !== "entitlementType,route") {
    throw new DiagnosticInputError("Only the diagnostic route and entitlement type are accepted.");
  }
  try {
    const diagnostic = createDiagnostic({
      workspaceId: "validation-workspace",
      route: value.route,
      entitlementType: value.entitlementType
    }, { id: "validation-diagnostic", now: new Date(0) });
    return Object.freeze({ route: diagnostic.route, entitlementType: diagnostic.entitlementType });
  } catch (error) {
    throw new DiagnosticInputError(error.message);
  }
}

export async function listWorkspaceDiagnostics(workspaceId, connectionString) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    const result = await query(
      `SELECT diagnostic.id, diagnostic.delivery_route, diagnostic.entitlement_type,
              diagnostic.state, diagnostic.human_review_status, diagnostic.created_at,
              diagnostic.updated_at, entitlement.status AS entitlement_status
       FROM app_shared.diagnostics diagnostic
       LEFT JOIN app_shared.commercial_entitlements entitlement
         ON entitlement.workspace_id = diagnostic.workspace_id
        AND entitlement.diagnostic_id = diagnostic.id
        AND entitlement.entitlement_kind IN ('diagnostic', 'poc')
       ORDER BY diagnostic.created_at DESC
       LIMIT $1`,
      [MAX_DIAGNOSTICS_RETURNED]
    );
    return result.rows.map(publicDiagnostic);
  }, connectionString);
}

export async function createWorkspaceDiagnostic(
  { workspaceId, actorUserId, draft },
  connectionString
) {
  const diagnostic = createDiagnostic({
    workspaceId,
    route: draft.route,
    entitlementType: draft.entitlementType
  });
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    const inserted = await query(
      `INSERT INTO app_shared.diagnostics
        (id, workspace_id, lifecycle_version, method_version, delivery_route,
         entitlement_type, state, human_review_status, created_by_clerk_user_id,
         created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
       RETURNING id, delivery_route, entitlement_type, state, human_review_status,
                 created_at, updated_at`,
      [
        diagnostic.diagnosticId,
        workspaceId,
        diagnostic.lifecycleVersion,
        METHOD_VERSION,
        diagnostic.route,
        diagnostic.entitlementType,
        diagnostic.state,
        diagnostic.humanReviewState,
        actorUserId,
        diagnostic.createdAt
      ]
    );
    const entitlementStatus = diagnostic.entitlementType === "poc" ? "active" : "pending";
    await query(
      `INSERT INTO app_shared.commercial_entitlements
        (workspace_id, diagnostic_id, entitlement_kind, offer_ref, status, active_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        workspaceId,
        diagnostic.diagnosticId,
        diagnostic.entitlementType === "poc" ? "poc" : "diagnostic",
        diagnostic.entitlementType === "poc" ? "POC-DIAGNOSTIC" : "PENDING-DIAGNOSTIC-OFFER",
        entitlementStatus,
        entitlementStatus === "active" ? diagnostic.createdAt : null
      ]
    );
    await query(
      `INSERT INTO app_operations.audit_events
        (workspace_id, actor_clerk_user_id, action, target_type, target_id, metadata)
       VALUES ($1, $2, 'diagnostic.created', 'diagnostic', $3, $4::jsonb)`,
      [workspaceId, actorUserId, diagnostic.diagnosticId, JSON.stringify({
        route: diagnostic.route,
        entitlementType: diagnostic.entitlementType,
        entitlementStatus
      })]
    );
    return publicDiagnostic({ ...inserted.rows[0], entitlement_status: entitlementStatus });
  }, connectionString);
}

export const workspaceDiagnosticPolicy = Object.freeze({
  lifecycleVersion: diagnosticLifecycle.version,
  methodVersion: METHOD_VERSION,
  routes: diagnosticLifecycle.routes,
  entitlementTypes: diagnosticLifecycle.entitlementTypes
});
