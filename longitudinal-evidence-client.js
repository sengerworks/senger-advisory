export const LONGITUDINAL_CONSENT_VERSION = "1.0.0";
export const LONGITUDINAL_PRODUCT_VERSION = "0.1.0";
export const LONGITUDINAL_EVIDENCE_SCHEMA_VERSION = "1.0.0";

const endpoint = "/api/longitudinal-evidence";
const local = ["localhost", "127.0.0.1", "::1"].includes(globalThis.location?.hostname || "");
const prefix = "senger-longitudinal-evidence-mvp:";

function base64url(bytes) {
  let binary = "";
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function createResearchParticipation(now = new Date()) {
  const capability = new Uint8Array(32);
  crypto.getRandomValues(capability);
  return {
    subjectId: crypto.randomUUID(),
    withdrawalCapability: base64url(capability),
    consentVersion: LONGITUDINAL_CONSENT_VERSION,
    grantedAt: now.toISOString(),
    lastContributedAt: null
  };
}

export function longitudinalProjection(profile) {
  return {
    evidenceSchemaVersion: LONGITUDINAL_EVIDENCE_SCHEMA_VERSION,
    assessments: profile.assessmentInstances.map(instance => ({
      completedAt: instance.completedAt,
      assessmentVersion: instance.assessmentVersion,
      scoringVersion: instance.scoringVersion,
      reportVersion: instance.reportVersion,
      contextVersion: instance.contextVersion,
      context: instance.context,
      domainScores: instance.domainScores,
      overallIndex: instance.overallIndex,
      interpretationBand: instance.interpretationBand,
      primaryConstraintIds: instance.primaryConstraintIds
    })),
    outcomes: profile.outcomeSnapshots.map(snapshot => ({
      observedAt: snapshot.observedAt,
      outcomeMeasureVersion: snapshot.outcomeMeasureVersion,
      observationWindow: snapshot.observationWindow,
      decisionPace: snapshot.decisionPace,
      leadershipEscalationLoad: snapshot.leadershipEscalationLoad,
      crossFunctionalCoordinationLoad: snapshot.crossFunctionalCoordinationLoad,
      executionReliability: snapshot.executionReliability,
      changeAbsorption: snapshot.changeAbsorption,
      evidenceSource: snapshot.evidenceSource
    })),
    changes: profile.changeRecords.map(record => ({
      startedAt: record.startedAt,
      endedAt: record.endedAt,
      category: record.category,
      targetDomainIds: record.targetDomainIds,
      magnitude: record.magnitude,
      status: record.status
    }))
  };
}

function localKey(subjectId) {
  return `${prefix}${subjectId}`;
}

function localRequest(payload) {
  const current = JSON.parse(localStorage.getItem(localKey(payload.subjectId)) || "null");
  if (payload.action === "grant") {
    if (current) throw new Error("Longitudinal participation already exists.");
    localStorage.setItem(localKey(payload.subjectId), JSON.stringify({ capability: payload.withdrawalCapability, active: true, events: [] }));
    return { granted: true, grantedAt: new Date().toISOString(), local: true };
  }
  if (!current || !current.active || current.capability !== payload.withdrawalCapability) {
    throw new Error("Longitudinal participation unavailable.");
  }
  if (payload.action === "contribute") {
    current.events.push({ eventId: payload.eventId, projection: payload.projection });
    localStorage.setItem(localKey(payload.subjectId), JSON.stringify(current));
    return { accepted: true, receivedAt: new Date().toISOString(), local: true };
  }
  localStorage.removeItem(localKey(payload.subjectId));
  return { withdrawn: true, deleted: true, withdrawnAt: new Date().toISOString(), local: true };
}

async function send(payload) {
  if (local) return localRequest(payload);
  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ website: "", ...payload })
    });
  } catch {
    throw new Error("Longitudinal evidence storage is unavailable. Try again shortly.");
  }
  let body = {};
  try { body = await response.json(); } catch { /* fallback below */ }
  if (!response.ok) throw new Error(body.error || "Longitudinal evidence request failed.");
  return body;
}

export function grantLongitudinalConsent(participation) {
  return send({
    action: "grant",
    subjectId: participation.subjectId,
    withdrawalCapability: participation.withdrawalCapability,
    consentVersion: participation.consentVersion,
    productVersion: LONGITUDINAL_PRODUCT_VERSION
  });
}

export function contributeLongitudinalEvidence(participation, profile) {
  return send({
    action: "contribute",
    subjectId: participation.subjectId,
    withdrawalCapability: participation.withdrawalCapability,
    consentVersion: participation.consentVersion,
    eventId: crypto.randomUUID(),
    projection: longitudinalProjection(profile)
  });
}

export function withdrawLongitudinalConsent(participation) {
  return send({
    action: "withdraw",
    subjectId: participation.subjectId,
    withdrawalCapability: participation.withdrawalCapability
  });
}

export const longitudinalEvidenceEnvironment = Object.freeze({ localDevelopment: local });
