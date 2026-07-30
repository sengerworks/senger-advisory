INSERT INTO app_shared.commercial_entitlements
  (workspace_id,diagnostic_id,entitlement_kind,offer_ref,status,created_at,updated_at)
SELECT intervention.workspace_id,intervention.diagnostic_id,'intervention',
       left(intervention.proposal_payload->>'commercialOfferRef',120),'pending',now(),now()
FROM app_shared.diagnostic_interventions intervention
JOIN app_shared.commercial_entitlements existing
  ON existing.workspace_id=intervention.workspace_id AND existing.id=intervention.entitlement_id
WHERE existing.entitlement_kind='diagnostic'
ON CONFLICT (workspace_id,diagnostic_id,entitlement_kind) DO NOTHING;

UPDATE app_shared.diagnostic_interventions intervention
SET entitlement_id=replacement.id,updated_at=now()
FROM app_shared.commercial_entitlements current_entitlement,
     app_shared.commercial_entitlements replacement
WHERE current_entitlement.workspace_id=intervention.workspace_id
  AND current_entitlement.id=intervention.entitlement_id
  AND current_entitlement.entitlement_kind='diagnostic'
  AND replacement.workspace_id=intervention.workspace_id
  AND replacement.diagnostic_id=intervention.diagnostic_id
  AND replacement.entitlement_kind='intervention';
