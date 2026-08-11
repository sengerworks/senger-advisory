import { withNeonWorkspaceTransaction } from "./neon-workspace-database.mjs";
import { requireAdvisorAssignment } from "./workspace-diagnostic-evidence-review.mjs";

export const POC_BRIEF_ACCESS_DAYS = 30;
export class ExecutiveBriefReleaseStateError extends Error {}

const iso = value => value ? new Date(value).toISOString() : null;
const isPaid = row => row.entitlement_type === "paid" || Boolean(row.paid_entitlement_active);

function publicBrief(row, now = new Date()) {
  if (!row || row.status !== "released") return Object.freeze({ state: "withheld", reason: "steward-release" });
  const permanent = row.access_mode === "permanent";
  const expiresAt = iso(row.access_expires_at);
  if (!permanent && (!expiresAt || new Date(expiresAt).getTime() <= now.getTime())) {
    return Object.freeze({ state: "expired", access: Object.freeze({ mode: "poc-window", expiresAt, permanent: false, downloadAvailable: false }) });
  }
  return Object.freeze({
    state: "available",
    brief: row.brief_payload,
    releasedAt: iso(row.released_at),
    access: Object.freeze({ mode: row.access_mode, expiresAt, permanent, downloadAvailable: true }),
    confidentiality: Object.freeze({ deidentified: true, thresholdProtected: true, participantResponsesExcluded: true, revelationGuideExcluded: true })
  });
}

async function selectBrief(query, diagnosticId) {
  const result = await query(
    `SELECT brief.*, diagnostic.entitlement_type,
            EXISTS (
              SELECT 1 FROM app_shared.commercial_entitlements entitlement
              WHERE entitlement.diagnostic_id=brief.diagnostic_id
                AND entitlement.status='active'
                AND entitlement.entitlement_kind IN ('diagnostic','intervention')
            ) AS paid_entitlement_active
     FROM app_shared.diagnostic_executive_briefs brief
     JOIN app_shared.diagnostics diagnostic
       ON diagnostic.workspace_id=brief.workspace_id AND diagnostic.id=brief.diagnostic_id
     WHERE brief.diagnostic_id=$1 LIMIT 1`,
    [diagnosticId]
  );
  return result.rows[0] || null;
}

export async function getReleasedExecutiveBrief({ workspaceId, diagnosticId, now = new Date() }, connectionString) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    let row = await selectBrief(query, diagnosticId);
    if (row?.status === "released" && row.access_mode !== "permanent" && isPaid(row)) {
      await query(
        `UPDATE app_shared.diagnostic_executive_briefs
         SET access_mode='permanent',access_expires_at=NULL,updated_at=$2::timestamptz
         WHERE diagnostic_id=$1 AND status='released'`,
        [diagnosticId, now.toISOString()]
      );
      row = await selectBrief(query, diagnosticId);
    }
    return publicBrief(row, now);
  }, connectionString);
}

export async function releaseExecutiveBrief({ workspaceId, userId, diagnosticId, now = new Date() }, connectionString) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    await requireAdvisorAssignment(query, { diagnosticId, userId, now });
    const row = await selectBrief(query, diagnosticId);
    if (!row) throw new ExecutiveBriefReleaseStateError("Prepare both governed outputs before release.");
    if (row.status === "released") return publicBrief(row, now);
    if (row.advisor_review_status !== "approved") throw new ExecutiveBriefReleaseStateError("Approve the Executive Capacity Brief before release.");
    const guide = await query(
      `SELECT advisor_review_status FROM app_private.diagnostic_revelation_guides WHERE diagnostic_id=$1 LIMIT 1`,
      [diagnosticId]
    );
    if (guide.rows[0]?.advisor_review_status !== "approved") throw new ExecutiveBriefReleaseStateError("Approve the private Revelation Guide before release.");
    const revelation = await query(
      `SELECT status FROM app_operations.diagnostic_steward_sessions
       WHERE diagnostic_id=$1 AND session_type='revelation' LIMIT 1`,
      [diagnosticId]
    );
    if (!revelation.rowCount || revelation.rows[0].status === "cancelled") throw new ExecutiveBriefReleaseStateError("Schedule the Revelation Session before releasing the Brief.");
    const progress = await query(
      `SELECT count(*) FILTER (WHERE slot.clerk_user_id IS NOT NULL AND slot.revoked_at IS NULL)::integer AS assigned,
              count(*) FILTER (WHERE slot.clerk_user_id IS NOT NULL AND slot.revoked_at IS NULL
                AND COALESCE(v2.status,v1.status) IN ('submitted','review-required','evidence-ready'))::integer AS completed
       FROM app_identity.diagnostic_participant_slots slot
       LEFT JOIN app_private.diagnostic_interviews v1 ON v1.workspace_id=slot.workspace_id AND v1.diagnostic_id=slot.diagnostic_id AND v1.participant_slot_id=slot.id
       LEFT JOIN app_private.diagnostic_interviews_v2 v2 ON v2.workspace_id=slot.workspace_id AND v2.diagnostic_id=slot.diagnostic_id AND v2.participant_slot_id=slot.id
       WHERE slot.diagnostic_id=$1`,
      [diagnosticId]
    );
    const pending = await query(`SELECT count(*)::integer AS count FROM app_private.diagnostic_evidence WHERE diagnostic_id=$1 AND review_status='pending'`, [diagnosticId]);
    const { assigned, completed } = progress.rows[0];
    if (assigned < 5 || completed !== assigned || pending.rows[0].count > 0) throw new ExecutiveBriefReleaseStateError("Complete every assigned perspective and disclosure review before release.");
    const permanent = isPaid(row);
    const expiresAt = permanent ? null : new Date(now.getTime() + POC_BRIEF_ACCESS_DAYS * 86400000).toISOString();
    await query(
      `UPDATE app_shared.diagnostic_executive_briefs
       SET status='released',released_by_clerk_user_id=$2,released_at=$3::timestamptz,
           access_mode=$4,access_expires_at=$5::timestamptz,
           sponsor_notification_status='ready-for-delivery',updated_at=$3::timestamptz
       WHERE diagnostic_id=$1 AND status='locked'`,
      [diagnosticId, userId, now.toISOString(), permanent ? "permanent" : "poc-window", expiresAt]
    );
    await query(
      `INSERT INTO app_operations.audit_events(workspace_id,actor_clerk_user_id,action,target_type,target_id,metadata)
       VALUES($1,$2,'diagnostic.executive-brief-released','diagnostic',$3,$4::jsonb)`,
      [workspaceId, userId, diagnosticId, JSON.stringify({ accessMode: permanent ? "permanent" : "poc-window", accessExpiresAt: expiresAt, sponsorNotificationStatus: "ready-for-delivery", revelationGuideReleased: false })]
    );
    return publicBrief(await selectBrief(query, diagnosticId), now);
  }, connectionString);
}

export function executiveBriefHtml(payload) {
  const escape = value => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  const list = values => `<ul>${(values || []).map(value => `<li>${escape(typeof value === "string" ? value : value.title || value.statement || JSON.stringify(value))}</li>`).join("")}</ul>`;
  const themes = (payload.themes || []).map(theme => `<section><h2>${escape(theme.title)}</h2><p>${escape(theme.summary)}</p><small>${escape(theme.confidence)} confidence</small></section>`).join("");
  const directions=(payload.interventionDirections?.options||[]).map(option=>`<section><h2>${option.recommended?"Recommended first move: ":"Alternative: "}${escape(option.title)}</h2><p>${escape(option.proposedMechanism)}</p><p><strong>Priority:</strong> ${escape(option.weighting?.weightedPriority)}/100 · decision support, not probability of success</p><p><strong>Signal:</strong> ${escape(option.timeToObservableSignal)}</p><p><strong>Effort:</strong> ${escape(option.effort)}</p><p><strong>What would change this recommendation:</strong></p>${list(option.evidenceThatWouldChangeRecommendation)}</section>`).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Executive Capacity Brief</title><style>body{font-family:Arial,sans-serif;color:#10233d;max-width:860px;margin:0 auto;padding:48px;line-height:1.55}header{border-bottom:4px solid #bd582c;margin-bottom:32px}h1{font-size:40px;margin:0 0 8px}h2{margin-top:30px;color:#17375e}section{break-inside:avoid}small{color:#59697c}.notice{background:#f2eee7;padding:18px;border-left:4px solid #bd582c}@media print{body{padding:18px}}</style></head><body><header><p>SENGER <strong>ADVISORY</strong></p><h1>${escape(payload.title || "Executive Capacity Brief")}</h1></header><section><h2>Capacity for what?</h2><p>${escape(payload.capacityForWhat?.commitment)}</p><p><strong>Success:</strong> ${escape(payload.capacityForWhat?.successDefinition)}</p><p><strong>Exposure:</strong> ${escape(payload.capacityForWhat?.failureExposure)}</p></section><section><h2>Current capacity fit</h2><p>${escape(payload.currentCapacityFit?.statement)}</p><small>${escape(payload.currentCapacityFit?.confidence)} confidence · ${escape(payload.currentCapacityFit?.confidenceBasis)}</small></section>${themes}<section><h2>Business exposure</h2>${list(payload.businessExposure)}</section><section><h2>Evidence-informed Intervention Directions</h2><p>${escape(payload.interventionDirections?.positioning)}</p></section>${directions}<p class="notice">${escape(payload.interventionDirections?.commercialBoundary)}</p><section><h2>Uncertainty retained</h2><p>${escape(payload.uncertainty?.statement)}</p></section><p class="notice">${escape(payload.confidentialityStatement)}</p></body></html>`;
}

export const executiveBriefReleasePolicy = Object.freeze({ pocAccessDays: POC_BRIEF_ACCESS_DAYS, paidAccess: "permanent", revelationGuideSponsorVisible: false, sponsorNotification: "ready-for-delivery" });
