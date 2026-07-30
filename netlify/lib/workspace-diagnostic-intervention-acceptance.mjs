import { withNeonWorkspaceTransaction } from "./neon-workspace-database.mjs";

export class InterventionAcceptanceInputError extends Error {}
export class InterventionAcceptanceStateError extends Error {}

function safeProposal(row) {
  if (!row) return null;
  const proposal = row.proposal_payload;
  return Object.freeze({
    interventionId: row.id,
    status: row.status,
    serviceRoute: row.service_route,
    proposalVersion: row.proposal_version,
    objective: proposal.objective,
    rationale: proposal.rationale,
    scope: proposal.scope,
    operatingChanges: [...proposal.operatingChanges],
    commitments: proposal.commitments.map(item => Object.freeze({ action: item.action, ownerRole: item.ownerRole, timing: item.timing })),
    learningRequirements: [...proposal.learningRequirements],
    evidencePlan: proposal.evidencePlan.map(item => Object.freeze({ evidenceClass: item.evidenceClass, measure: item.measure, observationCadence: item.observationCadence })),
    reviewCadence: proposal.reviewCadence,
    duration: proposal.duration,
    commercialOfferRef: proposal.commercialOfferRef,
    acceptedAt: row.accepted_at ? new Date(row.accepted_at).toISOString() : null
  });
}

export function validateInterventionAcceptanceInput(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).sort().join(",") !== "commercialTermsAccepted,diagnosticId,scopeAccepted") throw new InterventionAcceptanceInputError("Submit the complete intervention acceptance.");
  if (value.scopeAccepted !== true) throw new InterventionAcceptanceInputError("Accept the intervention scope first.");
  if (value.commercialTermsAccepted !== true) throw new InterventionAcceptanceInputError("Accept the commercial terms first.");
  return Object.freeze({ diagnosticId: String(value.diagnosticId || ""), scopeAccepted: true, commercialTermsAccepted: true });
}

export async function getInterventionAcceptance({ workspaceId, diagnosticId }, connectionString) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    const result = await query(
      `SELECT intervention.id, intervention.proposal_version, intervention.service_route,
              intervention.proposal_payload, intervention.status, intervention.accepted_at,
              entitlement.entitlement_kind, entitlement.status AS entitlement_status
       FROM app_shared.diagnostic_interventions intervention
       JOIN app_shared.commercial_entitlements entitlement
         ON entitlement.workspace_id = intervention.workspace_id AND entitlement.id = intervention.entitlement_id
       WHERE intervention.diagnostic_id = $1 LIMIT 1`,
      [diagnosticId]
    );
    if (!result.rows[0]) return Object.freeze({ state: "blocked", reason: "intervention-proposal" });
    const row = result.rows[0];
    const canAccept = row.entitlement_status === "active" && ["poc", "intervention"].includes(row.entitlement_kind);
    return Object.freeze({ state: row.status === "proposed" ? "review" : "accepted", canAccept, paymentRequired: row.status === "proposed" && !canAccept, intervention: safeProposal(row) });
  }, connectionString);
}

export async function acceptDiagnosticIntervention({ workspaceId, userId, input, now = new Date() }, connectionString) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    const result = await query(
      `SELECT intervention.id, intervention.status, entitlement.entitlement_kind, entitlement.status AS entitlement_status
       FROM app_shared.diagnostic_interventions intervention
       JOIN app_shared.commercial_entitlements entitlement
         ON entitlement.workspace_id = intervention.workspace_id AND entitlement.id = intervention.entitlement_id
       WHERE intervention.diagnostic_id = $1 FOR UPDATE`,
      [input.diagnosticId]
    );
    const row = result.rows[0];
    if (!row || row.status !== "proposed") throw new InterventionAcceptanceStateError("No proposed intervention is available for acceptance.");
    if (row.entitlement_status !== "active" || !["poc", "intervention"].includes(row.entitlement_kind)) throw new InterventionAcceptanceStateError("Payment and intervention access must be verified before acceptance.");
    await query(`UPDATE app_shared.diagnostic_interventions SET status = 'accepted', accepted_at = $2::timestamptz, updated_at = $2::timestamptz WHERE id = $1`, [row.id, now.toISOString()]);
    await query(`UPDATE app_shared.diagnostics SET state = 'intervention-accepted', updated_at = $2::timestamptz WHERE id = $1`, [input.diagnosticId, now.toISOString()]);
    await query(
      `INSERT INTO app_operations.audit_events (workspace_id, actor_clerk_user_id, action, target_type, target_id, metadata)
       VALUES ($1, $2, 'diagnostic.intervention-accepted', 'diagnostic', $3, $4::jsonb)`,
      [workspaceId, userId, input.diagnosticId, JSON.stringify({ scopeAccepted: true, commercialTermsAccepted: true, entitlementKind: row.entitlement_kind })]
    );
    return Object.freeze({ interventionId: row.id, status: "accepted", acceptedAt: now.toISOString() });
  }, connectionString);
}

