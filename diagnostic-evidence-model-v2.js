export const DIAGNOSTIC_EVIDENCE_MODEL_VERSION = "2.0.0";

const MECHANISMS = new Set(["priority-attention", "authority-accountability", "information-sensemaking", "coordination", "resource-capability-deployment"]);
const COMPLEXITY_DIMENSIONS = new Set(["volume", "variety", "interdependence", "uncertainty", "rate-of-change"]);
const CONFIDENCE_LEVELS = new Set(["limited", "moderate", "strong"]);
const PERSPECTIVE_PATTERNS = new Set(["convergent", "mixed", "minority-signal", "unknown"]);
const FRICTION_TYPES = new Set(["decision-delay", "priority-churn", "information-reconstruction", "coordination-overhead", "resource-displacement", "rework", "handoff-breakdown", "execution-delay", "other"]);
const COMPENSATION_TYPES = new Set(["heroics", "senior-escalation", "redundancy", "manual-system", "excess-coordination", "key-person-dependency", "longer-hours", "shadow-process", "other"]);
const CONDITION_TYPES = new Set(["leadership", "culture", "incentive", "formal-governance", "risk-requirement", "external-condition", "other"]);
const EVIDENCE_TYPES = new Set(["mechanism", "friction", "compensation", "formal-lived", "cross-cutting"]);

function exactKeys(value, keys, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} is required.`);
  const unexpected = Object.keys(value).filter(key => !keys.has(key));
  if (unexpected.length) throw new Error(`${label} contains unsupported fields: ${unexpected.join(", ")}.`);
}

function text(value, label, minimum, maximum) {
  const clean = String(value || "").trim().replace(/\s+/g, " ");
  if (clean.length < minimum || clean.length > maximum) throw new Error(`${label} must be between ${minimum} and ${maximum} characters.`);
  return clean;
}

function optionalText(value, label, maximum) {
  const clean = String(value || "").trim().replace(/\s+/g, " ");
  if (clean.length > maximum) throw new Error(`${label} must be ${maximum} characters or fewer.`);
  return clean;
}

function enumValue(value, allowed, label) {
  if (!allowed.has(value)) throw new Error(`Select a valid ${label}.`);
  return value;
}

function uniqueList(values, label, minimum, maximum, itemMaximum = 120) {
  if (!Array.isArray(values)) throw new Error(`${label} must be a list.`);
  const list = [...new Set(values.map((value, index) => text(value, `${label} item ${index + 1}`, 1, itemMaximum)))];
  if (list.length < minimum || list.length > maximum) throw new Error(`${label} requires ${minimum}–${maximum} unique items.`);
  return list;
}

function enumList(values, allowed, label, minimum, maximum) {
  const list = uniqueList(values, label, minimum, maximum, 80);
  if (list.some(value => !allowed.has(value))) throw new Error(`Select valid ${label}.`);
  return list;
}

function nowIso(value) {
  const date = value instanceof Date ? value : new Date(value || Date.now());
  if (!Number.isFinite(date.getTime())) throw new Error("The timestamp is invalid.");
  return date.toISOString();
}

function approvedEvidence(evidenceRecords) {
  if (!Array.isArray(evidenceRecords)) throw new Error("Approved de-identified evidence is required.");
  return new Map(evidenceRecords.filter(record => record.reviewStatus === "approved").map(record => [record.evidenceId, record]));
}

function evidenceReferences(values, evidenceRecords) {
  const approved = approvedEvidence(evidenceRecords);
  const supportingEvidenceIds = uniqueList(values.supportingEvidenceIds, "Supporting evidence", 1, 30);
  const weakeningEvidenceIds = uniqueList(values.weakeningEvidenceIds || [], "Weakening evidence", 0, 20);
  [...supportingEvidenceIds, ...weakeningEvidenceIds].forEach(evidenceId => {
    if (!approved.has(evidenceId)) throw new Error("Typed evidence may reference only approved de-identified evidence.");
  });
  return { supportingEvidenceIds, weakeningEvidenceIds };
}

function base(values, evidenceRecords, type, options) {
  const references = evidenceReferences(values, evidenceRecords);
  return {
    typedEvidenceId: options.id || crypto.randomUUID(),
    evidenceModelVersion: DIAGNOSTIC_EVIDENCE_MODEL_VERSION,
    evidenceType: enumValue(type, EVIDENCE_TYPES, "evidence type"),
    diagnosticId: text(values.diagnosticId, "Diagnostic ID", 1, 100),
    frameId: text(values.frameId, "Diagnostic Frame ID", 1, 100),
    statement: text(values.statement, "Evidence statement", 30, 1500),
    consequence: text(values.consequence, "Performance consequence", 20, 1000),
    perspectivePattern: enumValue(values.perspectivePattern, PERSPECTIVE_PATTERNS, "perspective pattern"),
    ...references,
    confidence: enumValue(values.confidence, CONFIDENCE_LEVELS, "confidence"),
    confidenceBasis: text(values.confidenceBasis, "Confidence basis", 20, 1000),
    status: "draft",
    createdAt: nowIso(options.now)
  };
}

const commonKeys = ["diagnosticId", "frameId", "statement", "consequence", "perspectivePattern", "supportingEvidenceIds", "weakeningEvidenceIds", "confidence", "confidenceBasis"];

export function createMechanismEvidence(values, evidenceRecords, options = {}) {
  exactKeys(values, new Set([...commonKeys, "mechanismIds", "complexityDimensions", "interactionStatement"]), "Mechanism evidence");
  return Object.freeze({
    ...base(values, evidenceRecords, "mechanism", options),
    mechanismIds: Object.freeze(enumList(values.mechanismIds, MECHANISMS, "mechanisms", 1, 5)),
    complexityDimensions: Object.freeze(enumList(values.complexityDimensions || [], COMPLEXITY_DIMENSIONS, "complexity dimensions", 0, 5)),
    interactionStatement: text(values.interactionStatement, "Mechanism interaction statement", 20, 1000)
  });
}

export function createFrictionObservation(values, evidenceRecords, options = {}) {
  exactKeys(values, new Set([...commonKeys, "frictionType", "workflowLocation", "frequency", "duration", "affectedDemandRef"]), "Friction observation");
  return Object.freeze({
    ...base(values, evidenceRecords, "friction", options),
    frictionType: enumValue(values.frictionType, FRICTION_TYPES, "friction type"),
    workflowLocation: text(values.workflowLocation, "Workflow location", 5, 500),
    frequency: text(values.frequency, "Friction frequency", 2, 200),
    duration: optionalText(values.duration, "Friction duration", 200),
    affectedDemandRef: text(values.affectedDemandRef, "Affected execution-demand reference", 1, 100)
  });
}

export function createCompensationObservation(values, evidenceRecords, options = {}) {
  exactKeys(values, new Set([...commonKeys, "compensationType", "performancePreserved", "mechanismIds", "sustainabilityRisk", "concentrationRisk", "leadershipRecognition"]), "Compensation observation");
  return Object.freeze({
    ...base(values, evidenceRecords, "compensation", options),
    compensationType: enumValue(values.compensationType, COMPENSATION_TYPES, "compensation type"),
    performancePreserved: text(values.performancePreserved, "Performance preserved", 20, 1000),
    mechanismIds: Object.freeze(enumList(values.mechanismIds, MECHANISMS, "mechanisms", 1, 5)),
    sustainabilityRisk: text(values.sustainabilityRisk, "Sustainability risk", 20, 800),
    concentrationRisk: optionalText(values.concentrationRisk, "Concentration risk", 800),
    leadershipRecognition: enumValue(values.leadershipRecognition, new Set(["recognized", "partially-recognized", "not-recognized", "unknown"]), "leadership-recognition state")
  });
}

export function createFormalLivedEvidence(values, evidenceRecords, options = {}) {
  exactKeys(values, new Set([...commonKeys, "mechanismIds", "formalExpectation", "observedBehavior", "rewardOrConsequence", "divergence"]), "Formal-versus-lived evidence");
  return Object.freeze({
    ...base(values, evidenceRecords, "formal-lived", options),
    mechanismIds: Object.freeze(enumList(values.mechanismIds, MECHANISMS, "mechanisms", 1, 5)),
    formalExpectation: text(values.formalExpectation, "Formal expectation", 20, 1000),
    observedBehavior: text(values.observedBehavior, "Observed behavior", 20, 1000),
    rewardOrConsequence: text(values.rewardOrConsequence, "Reward or consequence", 10, 800),
    divergence: enumValue(values.divergence, new Set(["aligned", "partial", "material", "unknown"]), "formal-versus-lived divergence")
  });
}

export function createCrossCuttingCondition(values, evidenceRecords, options = {}) {
  exactKeys(values, new Set([...commonKeys, "conditionType", "mechanismIds", "effect", "formalOrLived"]), "Cross-cutting condition");
  return Object.freeze({
    ...base(values, evidenceRecords, "cross-cutting", options),
    conditionType: enumValue(values.conditionType, CONDITION_TYPES, "condition type"),
    mechanismIds: Object.freeze(enumList(values.mechanismIds, MECHANISMS, "mechanisms", 1, 5)),
    effect: text(values.effect, "Condition effect", 20, 1000),
    formalOrLived: enumValue(values.formalOrLived, new Set(["formal", "lived", "both", "unknown"]), "formal-or-lived state")
  });
}

export function approveTypedEvidence(record, values, options = {}) {
  if (record.status !== "draft") throw new Error("Only draft typed evidence can be approved.");
  exactKeys(values, new Set(["reviewNote", "methodReviewerType"]), "Typed evidence review");
  const approvedAt = nowIso(options.now);
  return Object.freeze({
    ...record,
    status: "approved",
    methodReview: Object.freeze({
      methodReviewerType: enumValue(values.methodReviewerType, new Set(["automated", "human"]), "method reviewer type"),
      reviewNote: text(values.reviewNote, "Review note", 10, 800),
      approvedAt
    })
  });
}

export const diagnosticEvidenceModelPolicy = Object.freeze({
  evidenceModelVersion: DIAGNOSTIC_EVIDENCE_MODEL_VERSION,
  mechanisms: Object.freeze([...MECHANISMS]),
  evidenceTypes: Object.freeze([...EVIDENCE_TYPES]),
  leadershipIsMechanism: false,
  cultureIsMechanism: false,
  technologyIsMechanism: false,
  mechanismScoresProduced: false,
  approvedDeidentifiedEvidenceRequired: true
});
