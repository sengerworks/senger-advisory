export const CONSENT_VERSION = "1.0.0";
export const EVIDENCE_SCHEMA_VERSION = "1.0.0";

const DOMAINS = ["leadership", "decisions", "rhythm", "alignment", "technology", "culture"];
const BANDS = new Set(["Constrained", "Strained", "Developing", "Enabling"]);
const CONTEXT = {
  organizationSize: new Set(["", "Fewer than 25 people", "25–49 people", "50–149 people", "150–399 people", "400 or more people"]),
  respondentRole: new Set(["", "CEO or founder", "Executive leader", "Functional leader", "People or operations leader", "Advisor or board member"]),
  growthPressure: new Set(["", "Stable", "Increasing", "High", "Transformational change"])
};
const CHANGE_CATEGORIES = new Set(["leadership", "decision-rights", "operating-cadence", "structure", "process", "technology", "talent", "culture", "strategy", "external-event", "other"]);
const isObject = value => value !== null && typeof value === "object" && !Array.isArray(value);
const isUuid = value => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const isTimestamp = value => typeof value === "string" && Number.isFinite(Date.parse(value));
const isSemver = value => typeof value === "string" && /^\d+\.\d+\.\d+$/.test(value);
const isCapability = value => typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value);
const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;

function exact(value, keys) {
  return isObject(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
}

function assessment(value) {
  const keys = ["completedAt", "assessmentVersion", "scoringVersion", "reportVersion", "contextVersion", "context", "domainScores", "overallIndex", "interpretationBand", "primaryConstraintIds"];
  if (!exact(value, keys) || !isTimestamp(value.completedAt)) return false;
  if (![value.assessmentVersion, value.scoringVersion, value.reportVersion, value.contextVersion].every(isSemver)) return false;
  if (!exact(value.context, Object.keys(CONTEXT)) || !Object.entries(value.context).every(([key, item]) => CONTEXT[key].has(item))) return false;
  if (!exact(value.domainScores, DOMAINS) || !DOMAINS.every(domain => integer(value.domainScores[domain], 0, 100))) return false;
  return integer(value.overallIndex, 0, 100)
    && BANDS.has(value.interpretationBand)
    && Array.isArray(value.primaryConstraintIds)
    && value.primaryConstraintIds.length >= 1
    && value.primaryConstraintIds.length <= 6
    && value.primaryConstraintIds.every(domain => DOMAINS.includes(domain))
    && new Set(value.primaryConstraintIds).size === value.primaryConstraintIds.length;
}

function outcome(value) {
  const keys = ["observedAt", "outcomeMeasureVersion", "observationWindow", "decisionPace", "leadershipEscalationLoad", "crossFunctionalCoordinationLoad", "executionReliability", "changeAbsorption", "evidenceSource"];
  return exact(value, keys)
    && isTimestamp(value.observedAt)
    && isSemver(value.outcomeMeasureVersion)
    && ["30-days", "90-days"].includes(value.observationWindow)
    && [value.decisionPace, value.leadershipEscalationLoad, value.crossFunctionalCoordinationLoad, value.executionReliability, value.changeAbsorption].every(item => integer(item, 1, 5))
    && ["self-report", "operating-measure", "mixed"].includes(value.evidenceSource);
}

function change(value) {
  const keys = ["startedAt", "endedAt", "category", "targetDomainIds", "magnitude", "status"];
  return exact(value, keys)
    && isTimestamp(value.startedAt)
    && (value.endedAt === null || isTimestamp(value.endedAt))
    && CHANGE_CATEGORIES.has(value.category)
    && Array.isArray(value.targetDomainIds)
    && value.targetDomainIds.length <= 6
    && value.targetDomainIds.every(domain => DOMAINS.includes(domain))
    && new Set(value.targetDomainIds).size === value.targetDomainIds.length
    && ["limited", "material", "enterprise-wide"].includes(value.magnitude)
    && ["planned", "active", "completed", "discontinued"].includes(value.status);
}

function projection(value) {
  const keys = ["evidenceSchemaVersion", "assessments", "outcomes", "changes"];
  return exact(value, keys)
    && value.evidenceSchemaVersion === EVIDENCE_SCHEMA_VERSION
    && Array.isArray(value.assessments) && value.assessments.length >= 1 && value.assessments.length <= 24 && value.assessments.every(assessment)
    && Array.isArray(value.outcomes) && value.outcomes.length <= 24 && value.outcomes.every(outcome)
    && Array.isArray(value.changes) && value.changes.length <= 100 && value.changes.every(change);
}

export function validateLongitudinalPayload(payload) {
  if (!isObject(payload) || payload.website) return { ok: false, error: "Invalid request." };
  if (!["grant", "contribute", "withdraw"].includes(payload.action)) return { ok: false, error: "Invalid action." };
  const common = ["action", "subjectId", "withdrawalCapability", "website"];
  const allowed = {
    grant: [...common, "consentVersion", "productVersion"],
    contribute: [...common, "consentVersion", "eventId", "projection"],
    withdraw: common
  }[payload.action];
  if (!exact(payload, allowed) || !isUuid(payload.subjectId) || !isCapability(payload.withdrawalCapability)) {
    return { ok: false, error: "Invalid research credentials." };
  }
  if (payload.action === "grant" && (payload.consentVersion !== CONSENT_VERSION || !isSemver(payload.productVersion))) {
    return { ok: false, error: "Unsupported consent version." };
  }
  if (payload.action === "contribute") {
    if (payload.consentVersion !== CONSENT_VERSION || !isUuid(payload.eventId) || !projection(payload.projection)) {
      return { ok: false, error: "Invalid longitudinal evidence." };
    }
  }
  const clean = { ...payload };
  delete clean.website;
  return { ok: true, value: clean };
}
