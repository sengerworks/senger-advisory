import { createInterventionProposal } from "../../diagnostic-decision-engine.js";
import { withNeonWorkspaceTransaction } from "./neon-workspace-database.mjs";
import { requireAdvisorAssignment } from "./workspace-diagnostic-evidence-review.mjs";

export class DiagnosticInterventionInputError extends Error {}
export class DiagnosticInterventionStateError extends Error {}

function publicProposal(row) {
  if (!row) return null;
  return Object.freeze({
    interventionId: row.id,
    proposalVersion: row.proposal_version,
    serviceRoute: row.service_route,
    status: row.status,
    proposal: row.proposal_payload,
    createdAt: new Date(row.created_at).toISOString()
  });
}

export function validateInterventionInput(value) {
  const allowed = new Set(["diagnosticId", "serviceRoute", "objective", "rationale", "scope", "operatingChanges", "commitments", "learningRequirements", "evidencePlan", "reviewCadence", "duration", "commercialOfferRef"]);
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length !== allowed.size || Object.keys(value).some(key => !allowed.has(key))) throw new DiagnosticInterventionInputError("Submit the complete intervention proposal.");
  if (!["platform-guided", "advisor-guided"].includes(value.serviceRoute)) throw new DiagnosticInterventionInputError("Choose a governed intervention service route.");
  try {
    const proposal = createInterventionProposal({ status: "validated", diagnosticRecordId: "pending-finding" }, {
      objective: value.objective, rationale: value.rationale, scope: value.scope,
      operatingChanges: value.operatingChanges, commitments: value.commitments,
      learningRequirements: value.learningRequirements, evidencePlan: value.evidencePlan,
      reviewCadence: value.reviewCadence, duration: value.duration, commercialOfferRef: value.commercialOfferRef
    });
    return Object.freeze({ diagnosticId: String(value.diagnosticId || ""), serviceRoute: value.serviceRoute, proposal });
  } catch (error) {
    throw new DiagnosticInterventionInputError(error.message);
  }
}

export async function getDiagnosticIntervention({ workspaceId, userId, diagnosticId, now = new Date() }, connectionString) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    await requireAdvisorAssignment(query, { diagnosticId, userId, now });
    const finding = await query(`SELECT id, status, record_payload FROM app_shared.diagnostic_findings WHERE diagnostic_id = $1 LIMIT 1`, [diagnosticId]);
    if (!finding.rows[0] || finding.rows[0].status !== "validated") return Object.freeze({ state: "blocked", reason: "leadership-validation" });
    const result = await query(`SELECT id, proposal_version, service_route, proposal_payload, status, created_at FROM app_shared.diagnostic_interventions WHERE diagnostic_id = $1 LIMIT 1`, [diagnosticId]);
    return Object.freeze({
      state: result.rows[0] ? "proposed" : "ready",
      finding: Object.freeze({ statement: finding.rows[0].record_payload.hypothesis.statement, interventionDirection: finding.rows[0].record_payload.hypothesis.interventionDirection }),
      intervention: publicProposal(result.rows[0])
    });
  }, connectionString);
}

export async function createDiagnosticIntervention({ workspaceId, userId, input, now = new Date() }, connectionString) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    await requireAdvisorAssignment(query, { diagnosticId: input.diagnosticId, userId, now });
    const finding = await query(`SELECT id, status FROM app_shared.diagnostic_findings WHERE diagnostic_id = $1 FOR UPDATE`, [input.diagnosticId]);
    if (!finding.rows[0] || finding.rows[0].status !== "validated") throw new DiagnosticInterventionStateError("Leadership must validate the finding before intervention design.");
    const access = await query(
      `SELECT id,entitlement_kind FROM app_shared.commercial_entitlements
       WHERE diagnostic_id = $1 AND status = 'active' AND entitlement_kind IN ('diagnostic','poc')
       ORDER BY CASE entitlement_kind WHEN 'poc' THEN 0 ELSE 1 END LIMIT 1`,
      [input.diagnosticId]
    );
    if (!access.rows[0]) throw new DiagnosticInterventionStateError("Active diagnostic access is required before intervention design.");
    let entitlementId = access.rows[0].id;
    if (access.rows[0].entitlement_kind !== "poc") {
      const interventionEntitlement = await query(
        `INSERT INTO app_shared.commercial_entitlements
          (workspace_id,diagnostic_id,entitlement_kind,offer_ref,status,created_at,updated_at)
         VALUES ($1,$2,'intervention',$3,'pending',$4::timestamptz,$4::timestamptz)
         ON CONFLICT (workspace_id,diagnostic_id,entitlement_kind)
         DO UPDATE SET offer_ref=EXCLUDED.offer_ref,updated_at=EXCLUDED.updated_at
         WHERE app_shared.commercial_entitlements.status='pending'
         RETURNING id`,
        [workspaceId,input.diagnosticId,input.proposal.commercialOfferRef,now.toISOString()]
      );
      if (!interventionEntitlement.rows[0]) throw new DiagnosticInterventionStateError("The intervention entitlement is no longer available for proposal.");
      entitlementId = interventionEntitlement.rows[0].id;
    }
    const proposal = { ...input.proposal, diagnosticRecordId: finding.rows[0].id };
    let inserted;
    try {
      inserted = await query(
        `INSERT INTO app_shared.diagnostic_interventions
          (workspace_id, diagnostic_id, finding_id, entitlement_id, proposal_version, service_route, proposal_payload, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, 'proposed', $8::timestamptz, $8::timestamptz)
         RETURNING id, proposal_version, service_route, proposal_payload, status, created_at`,
        [workspaceId, input.diagnosticId, finding.rows[0].id, entitlementId, proposal.interventionProposalVersion, input.serviceRoute, JSON.stringify(proposal), now.toISOString()]
      );
    } catch (error) {
      if (error?.code === "23505") throw new DiagnosticInterventionStateError("An intervention proposal already exists.");
      throw error;
    }
    await query(`UPDATE app_shared.diagnostics SET state = 'intervention-proposed', updated_at = $2::timestamptz WHERE id = $1`, [input.diagnosticId, now.toISOString()]);
    await query(
      `INSERT INTO app_operations.audit_events (workspace_id, actor_clerk_user_id, action, target_type, target_id, metadata)
       VALUES ($1, $2, 'diagnostic.intervention-proposed', 'diagnostic', $3, $4::jsonb)`,
      [workspaceId, userId, input.diagnosticId, JSON.stringify({ proposalVersion: proposal.interventionProposalVersion, serviceRoute: input.serviceRoute, evidenceClasses: proposal.evidencePlan.map(item => item.evidenceClass) })]
    );
    return publicProposal(inserted.rows[0]);
  }, connectionString);
}
