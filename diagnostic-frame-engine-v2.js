export const DIAGNOSTIC_FRAME_VERSION = "2.0.0";

const COMPLEXITY_DIMENSIONS = new Set(["volume", "variety", "interdependence", "uncertainty", "rate-of-change"]);
const COMPLEXITY_CLASSIFICATIONS = new Set(["necessary", "unnecessary", "mixed", "undetermined"]);
const COMPLEXITY_STATES = new Set(["current", "anticipated", "current-and-anticipated"]);
const CONFIDENCE_LEVELS = new Set(["limited", "moderate", "strong"]);
const EVIDENCE_SOURCES = new Set(["sponsor-discovery", "participant-interview", "survey-instrument", "formal-artifact", "operating-data", "prior-intervention", "leadership-validation"]);
const LEADERSHIP_LEVELS = new Set(["enterprise", "functional", "operational", "frontline"]);
const EXECUTION_PROXIMITIES = new Set(["strategy", "coordination", "delivery"]);
const FUNCTIONAL_LENSES = new Set(["executive-leadership", "operations", "people", "finance", "commercial", "product-service", "technology", "frontline-delivery", "other"]);

function object(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} is required.`);
  return value;
}

function exactKeys(value, allowed, label) {
  object(value, label);
  const unexpected = Object.keys(value).filter(key => !allowed.has(key));
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
  const clean = String(value || "");
  if (!allowed.has(clean)) throw new Error(`Select a valid ${label}.`);
  return clean;
}

function uniqueEnums(values, allowed, label, minimum = 1, maximum = allowed.size) {
  if (!Array.isArray(values)) throw new Error(`${label} must be a list.`);
  const unique = [...new Set(values)];
  if (unique.length < minimum || unique.length > maximum || unique.some(value => !allowed.has(value))) throw new Error(`Select valid ${label}.`);
  return unique;
}

function timestamp(value) {
  const date = value instanceof Date ? value : new Date(value || Date.now());
  if (!Number.isFinite(date.getTime())) throw new Error("The timestamp is invalid.");
  return date.toISOString();
}

function complexityObservation(value, index) {
  exactKeys(value, new Set(["observationId", "source", "description", "dimensions", "state", "classification", "classificationRationale", "evidenceRefs", "confidence", "confidenceBasis"]), `Complexity observation ${index + 1}`);
  const evidenceRefs = Array.isArray(value.evidenceRefs) ? [...new Set(value.evidenceRefs.map((entry, evidenceIndex) => text(entry, `Complexity observation ${index + 1} evidence ${evidenceIndex + 1}`, 1, 120)))] : [];
  if (evidenceRefs.length > 20) throw new Error("A complexity observation can cite at most 20 evidence references.");
  const classification = enumValue(value.classification, COMPLEXITY_CLASSIFICATIONS, "complexity classification");
  if (classification !== "undetermined" && !String(value.classificationRationale || "").trim()) throw new Error("A classified complexity observation requires a rationale.");
  return Object.freeze({
    observationId: text(value.observationId, `Complexity observation ${index + 1} ID`, 1, 100),
    source: text(value.source, `Complexity observation ${index + 1} source`, 2, 120),
    description: text(value.description, `Complexity observation ${index + 1} description`, 20, 1200),
    dimensions: Object.freeze(uniqueEnums(value.dimensions, COMPLEXITY_DIMENSIONS, "complexity dimensions", 1, 5)),
    state: enumValue(value.state, COMPLEXITY_STATES, "complexity state"),
    classification,
    classificationRationale: optionalText(value.classificationRationale, "Complexity classification rationale", 1000),
    evidenceRefs: Object.freeze(evidenceRefs),
    confidence: enumValue(value.confidence, CONFIDENCE_LEVELS, "complexity confidence"),
    confidenceBasis: text(value.confidenceBasis, "Complexity confidence basis", 20, 800)
  });
}

function participantSlot(value, index) {
  exactKeys(value, new Set(["slotId", "leadershipLevel", "executionProximity", "functionalLens"]), `Participant slot ${index + 1}`);
  return Object.freeze({
    slotId: text(value.slotId, `Participant slot ${index + 1} ID`, 1, 100),
    leadershipLevel: enumValue(value.leadershipLevel, LEADERSHIP_LEVELS, "leadership level"),
    executionProximity: enumValue(value.executionProximity, EXECUTION_PROXIMITIES, "execution proximity"),
    functionalLens: enumValue(value.functionalLens, FUNCTIONAL_LENSES, "functional lens")
  });
}

function evidencePlan(value) {
  exactKeys(value, new Set(["sourceTypes", "participantSlots", "formalArtifactsRequested", "operatingDataRequested", "acceptedCoverageGaps"]), "Evidence plan");
  const participantSlots = (value.participantSlots || []).map(participantSlot);
  if (participantSlots.length < 5 || participantSlots.length > 50) throw new Error("The diagnostic evidence plan requires 5–50 participant slots.");
  if (new Set(participantSlots.map(slot => slot.slotId)).size !== participantSlots.length) throw new Error("Participant slot IDs must be unique.");
  const list = (values, label, maximum, itemMaximum) => {
    if (!Array.isArray(values) || values.length > maximum) throw new Error(`${label} must be a list of at most ${maximum} items.`);
    return [...new Set(values.map((entry, index) => text(entry, `${label} item ${index + 1}`, 2, itemMaximum)))];
  };
  const acceptedCoverageGaps = list(value.acceptedCoverageGaps || [], "Accepted coverage gaps", 20, 500);
  return Object.freeze({
    sourceTypes: Object.freeze(uniqueEnums(value.sourceTypes, EVIDENCE_SOURCES, "evidence source types", 2, EVIDENCE_SOURCES.size)),
    participantSlots: Object.freeze(participantSlots),
    formalArtifactsRequested: Object.freeze(list(value.formalArtifactsRequested || [], "Formal artifacts", 20, 300)),
    operatingDataRequested: Object.freeze(list(value.operatingDataRequested || [], "Operating data requests", 20, 300)),
    acceptedCoverageGaps: Object.freeze(acceptedCoverageGaps)
  });
}

function boundedList(values, label, maximum, minimumLength, maximumLength) {
  if (!Array.isArray(values) || values.length > maximum) throw new Error(`${label} must be a list of at most ${maximum} items.`);
  return [...new Set(values.map((entry, index) => text(entry, `${label} item ${index + 1}`, minimumLength, maximumLength)))];
}

export function createDiagnosticFrame(values, options = {}) {
  exactKeys(values, new Set(["diagnosticId", "organizationContext", "executionDemand", "diagnosticQuestion", "leadershipDecision", "performanceConsequences", "complexityObservations", "evidencePlan", "outOfScope", "knownSensitivities"]), "Diagnostic Frame");
  exactKeys(values.executionDemand, new Set(["commitment", "successDefinition", "failureExposure", "timeHorizon"]), "Execution demand");
  if (!Array.isArray(values.complexityObservations) || values.complexityObservations.length < 1 || values.complexityObservations.length > 20) throw new Error("Add 1–20 complexity observations.");
  const observations = values.complexityObservations.map(complexityObservation);
  if (new Set(observations.map(observation => observation.observationId)).size !== observations.length) throw new Error("Complexity observation IDs must be unique.");
  const createdAt = timestamp(options.now);
  return Object.freeze({
    frameId: options.id || crypto.randomUUID(),
    frameVersion: DIAGNOSTIC_FRAME_VERSION,
    diagnosticId: text(values.diagnosticId, "Diagnostic ID", 1, 100),
    status: "draft",
    organizationContext: text(values.organizationContext, "Organization context", 40, 2000),
    executionDemand: Object.freeze({
      commitment: text(values.executionDemand.commitment, "Execution commitment", 40, 1200),
      successDefinition: text(values.executionDemand.successDefinition, "Execution success definition", 40, 1200),
      failureExposure: text(values.executionDemand.failureExposure, "Execution failure exposure", 40, 1200),
      timeHorizon: text(values.executionDemand.timeHorizon, "Execution time horizon", 2, 120)
    }),
    diagnosticQuestion: text(values.diagnosticQuestion, "Diagnostic question", 40, 1000),
    leadershipDecision: text(values.leadershipDecision, "Leadership decision", 40, 1000),
    performanceConsequences: Object.freeze(boundedList(values.performanceConsequences || [], "Performance consequences", 12, 10, 500)),
    complexityProfile: Object.freeze({
      observations: Object.freeze(observations),
      dimensionsRepresented: Object.freeze([...new Set(observations.flatMap(observation => observation.dimensions))]),
      classificationState: observations.some(observation => observation.classification === "undetermined") ? "provisional" : "classified"
    }),
    evidencePlan: evidencePlan(values.evidencePlan),
    outOfScope: Object.freeze(boundedList(values.outOfScope || [], "Out-of-scope items", 20, 5, 500)),
    knownSensitivities: optionalText(values.knownSensitivities, "Known sensitivities", 1200),
    approval: null,
    createdAt,
    updatedAt: createdAt
  });
}

export function evaluateDiagnosticFrame(frame) {
  const dimensions = new Set(frame.complexityProfile.dimensionsRepresented);
  const missingDimensions = [...COMPLEXITY_DIMENSIONS].filter(dimension => !dimensions.has(dimension));
  const hasInterviews = frame.evidencePlan.sourceTypes.includes("participant-interview");
  const hasSponsorDiscovery = frame.evidencePlan.sourceTypes.includes("sponsor-discovery");
  const hasExecutionEvidence = frame.performanceConsequences.length > 0 || frame.evidencePlan.sourceTypes.includes("operating-data");
  const blockers = [];
  if (!hasSponsorDiscovery) blockers.push("sponsor-discovery-required");
  if (!hasInterviews) blockers.push("participant-interviews-required");
  if (!hasExecutionEvidence) blockers.push("execution-consequence-evidence-required");
  const acceptedGapIds = new Set(frame.evidencePlan.acceptedCoverageGaps.map(gap => gap.split(":", 1)[0]));
  const unresolvedDimensions = missingDimensions.filter(dimension => !acceptedGapIds.has(`complexity-dimension-${dimension}`));
  if (unresolvedDimensions.length) blockers.push("complexity-dimension-gaps-unresolved");
  return Object.freeze({
    ready: blockers.length === 0,
    blockers: Object.freeze(blockers),
    missingComplexityDimensions: Object.freeze(missingDimensions),
    unresolvedComplexityDimensions: Object.freeze(unresolvedDimensions),
    provisionalComplexityClassifications: frame.complexityProfile.observations.filter(observation => observation.classification === "undetermined").length
  });
}

export function approveDiagnosticFrame(frame, values, options = {}) {
  if (frame.status !== "draft") throw new Error("Only a draft Diagnostic Frame can be approved.");
  exactKeys(values, new Set(["approvalNote", "confirmedExecutionDemand", "acceptedEvidencePlan"]), "Diagnostic Frame approval");
  if (values.confirmedExecutionDemand !== true || values.acceptedEvidencePlan !== true) throw new Error("Approval requires confirmation of the execution demand and evidence plan.");
  const readiness = evaluateDiagnosticFrame(frame);
  if (!readiness.ready) throw new Error(`Resolve Diagnostic Frame blockers before approval: ${readiness.blockers.join(", ")}.`);
  const approvedAt = timestamp(options.now);
  return Object.freeze({
    ...frame,
    status: "approved",
    approval: Object.freeze({ approvalNote: text(values.approvalNote, "Approval note", 20, 800), approvedAt }),
    updatedAt: approvedAt
  });
}

export const diagnosticFramePolicy = Object.freeze({
  frameVersion: DIAGNOSTIC_FRAME_VERSION,
  complexityDimensions: Object.freeze([...COMPLEXITY_DIMENSIONS]),
  complexityClassifications: Object.freeze([...COMPLEXITY_CLASSIFICATIONS]),
  capacityForWhatRequired: true,
  necessaryUnnecessaryClassificationIsHypothesis: true,
  sponsorClassificationIsFinal: false,
  minimumParticipants: 5,
  maximumParticipants: 50
});
