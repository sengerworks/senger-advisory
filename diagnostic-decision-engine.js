const DIAGNOSTIC_RECORD_VERSION = "1.0.0";
const INTERVENTION_PROPOSAL_VERSION = "1.0.0";
const CONFIDENCE_LEVELS = new Set(["limited", "moderate", "strong"]);
const RESONANCE = new Set(["supports", "partially-supports", "challenges"]);
const COMPLETENESS = new Set(["complete-enough", "material-gaps"]);
const VALIDATION_DECISIONS = new Set(["accepted", "revision-required"]);
const EVIDENCE_CLASSES = new Set(["delivery", "operating-change", "capacity-change"]);

function nowIso(value) {
  const date = value instanceof Date ? value : new Date(value || Date.now());
  if (!Number.isFinite(date.getTime())) throw new Error("The timestamp is invalid.");
  return date.toISOString();
}

function requiredText(value, name, maximum, minimum = 1) {
  const text = String(value || "").trim();
  if (text.length < minimum) throw new Error(`${name} must be at least ${minimum} characters.`);
  if (text.length > maximum) throw new Error(`${name} must be ${maximum} characters or fewer.`);
  return text;
}

function optionalText(value, name, maximum) {
  const text = String(value || "").trim();
  if (text.length > maximum) throw new Error(`${name} must be ${maximum} characters or fewer.`);
  return text;
}

function exactKeys(value, allowed, name) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${name} is required.`);
  const unexpected = Object.keys(value).filter((key) => !allowed.has(key));
  if (unexpected.length) throw new Error(`${name} contains unsupported fields: ${unexpected.join(", ")}.`);
}

function enumValue(value, allowed, message) {
  const normalized = String(value || "");
  if (!allowed.has(normalized)) throw new Error(message);
  return normalized;
}

function textList(values, name, maximumItems, maximumLength, minimumItems = 0) {
  if (!Array.isArray(values) || values.length < minimumItems) throw new Error(`${name} requires at least ${minimumItems} item(s).`);
  if (values.length > maximumItems) throw new Error(`${name} can contain at most ${maximumItems} items.`);
  const normalized = values.map((value, index) => requiredText(value, `${name} item ${index + 1}`, maximumLength));
  if (new Set(normalized).size !== normalized.length) throw new Error(`${name} cannot contain duplicates.`);
  return normalized;
}

export function createDiagnosticRecord(values, hypothesis, themes, options = {}) {
  exactKeys(values, new Set([
    "diagnosticId",
    "contextBriefId",
    "executiveFinding",
    "whyNow",
    "strategicExposure",
    "operatingSymptoms",
    "alternativeInterventionsConsidered"
  ]), "The diagnostic record");
  if (!hypothesis || hypothesis.diagnosticId !== values.diagnosticId) throw new Error("A matching constraint hypothesis is required.");
  if (!Array.isArray(themes) || themes.length === 0) throw new Error("Evidence themes are required.");
  const themeIds = new Set(themes.map((theme) => theme.themeId));
  for (const themeId of [...hypothesis.supportingThemeIds, ...hypothesis.weakeningThemeIds]) {
    if (!themeIds.has(themeId)) throw new Error("The diagnostic record must include every theme referenced by the hypothesis.");
  }
  const createdAt = nowIso(options.now);
  return {
    diagnosticRecordId: options.id || crypto.randomUUID(),
    diagnosticRecordVersion: DIAGNOSTIC_RECORD_VERSION,
    diagnosticId: requiredText(values.diagnosticId, "Diagnostic ID", 100),
    contextBriefId: requiredText(values.contextBriefId, "Context Brief ID", 100),
    hypothesisId: hypothesis.hypothesisId,
    executiveFinding: requiredText(values.executiveFinding, "Executive finding", 1200, 40),
    whyNow: requiredText(values.whyNow, "Why this matters now", 1000, 40),
    strategicExposure: requiredText(values.strategicExposure, "Strategic exposure", 1000, 40),
    operatingSymptoms: textList(values.operatingSymptoms, "Operating symptoms", 12, 300, 2),
    themeIds: themes.map((theme) => theme.themeId),
    competingExplanations: hypothesis.competingExplanations,
    blindSpots: hypothesis.blindSpots,
    confidence: enumValue(hypothesis.confidence, CONFIDENCE_LEVELS, "Select a valid diagnostic confidence."),
    confidenceBasis: hypothesis.confidenceBasis,
    interventionDirection: hypothesis.interventionDirection,
    alternativeInterventionsConsidered: textList(values.alternativeInterventionsConsidered, "Alternative interventions considered", 8, 500, 1),
    status: "draft",
    createdAt,
    validatedAt: null
  };
}

function validationResponse(value, index) {
  exactKeys(value, new Set([
    "validationResponseRef",
    "resonance",
    "completeness",
    "surprised",
    "missingEvidence",
    "materialObjection",
    "objection"
  ]), `Leadership validation response ${index + 1}`);
  if (typeof value.surprised !== "boolean" || typeof value.materialObjection !== "boolean") {
    throw new Error("Leadership validation flags must be explicit.");
  }
  const objection = optionalText(value.objection, "Material objection", 1000);
  if (value.materialObjection && !objection) throw new Error("A material objection requires an explanation.");
  return {
    validationResponseRef: requiredText(value.validationResponseRef, "Validation response reference", 100),
    resonance: enumValue(value.resonance, RESONANCE, "Select a valid resonance response."),
    completeness: enumValue(value.completeness, COMPLETENESS, "Select a valid completeness response."),
    surprised: value.surprised,
    missingEvidence: optionalText(value.missingEvidence, "Missing evidence", 1000),
    materialObjection: value.materialObjection,
    objection
  };
}

export function createLeadershipValidation(record, responses, options = {}) {
  if (record.status !== "draft") throw new Error("Only a draft diagnostic record can enter leadership validation.");
  if (!Array.isArray(responses) || responses.length === 0) throw new Error("At least one leadership validation response is required.");
  if (responses.length > 20) throw new Error("Leadership validation can contain at most 20 responses.");
  const normalized = responses.map(validationResponse);
  if (new Set(normalized.map((response) => response.validationResponseRef)).size !== normalized.length) {
    throw new Error("Leadership validation response references must be unique.");
  }
  return {
    leadershipValidationId: options.id || crypto.randomUUID(),
    diagnosticRecordVersion: DIAGNOSTIC_RECORD_VERSION,
    diagnosticRecordId: record.diagnosticRecordId,
    status: "pending-decision",
    responses: normalized,
    materialObjectionCount: normalized.filter((response) => response.materialObjection).length,
    decision: null,
    objectionResolutions: [],
    decisionNote: "",
    createdAt: nowIso(options.now),
    decidedAt: null
  };
}

function objectionResolution(value, index) {
  exactKeys(value, new Set(["validationResponseRef", "resolution"]), `Objection resolution ${index + 1}`);
  return {
    validationResponseRef: requiredText(value.validationResponseRef, "Validation response reference", 100),
    resolution: requiredText(value.resolution, "Objection resolution", 1000, 20)
  };
}

export function decideLeadershipValidation(validation, values, options = {}) {
  if (validation.status !== "pending-decision") throw new Error("Leadership validation already has a decision.");
  exactKeys(values, new Set(["decision", "objectionResolutions", "decisionNote"]), "The leadership validation decision");
  const decision = enumValue(values.decision, VALIDATION_DECISIONS, "Select a valid leadership validation decision.");
  const resolutions = Array.isArray(values.objectionResolutions)
    ? values.objectionResolutions.map(objectionResolution)
    : [];
  const materialRefs = new Set(validation.responses.filter((response) => response.materialObjection).map((response) => response.validationResponseRef));
  if (decision === "accepted") {
    const resolvedRefs = new Set(resolutions.map((resolution) => resolution.validationResponseRef));
    const unresolved = [...materialRefs].filter((reference) => !resolvedRefs.has(reference));
    if (unresolved.length) throw new Error("Resolve every material objection before accepting the diagnostic record.");
  }
  for (const resolution of resolutions) {
    if (!materialRefs.has(resolution.validationResponseRef)) throw new Error("Resolve only documented material objections.");
  }
  return {
    ...validation,
    status: "decided",
    decision,
    objectionResolutions: resolutions,
    decisionNote: requiredText(values.decisionNote, "Leadership validation decision note", 1000, 20),
    decidedAt: nowIso(options.now)
  };
}

export function validateDiagnosticRecord(record, validation, options = {}) {
  if (record.status !== "draft") throw new Error("Only a draft diagnostic record can be validated.");
  if (validation.diagnosticRecordId !== record.diagnosticRecordId || validation.decision !== "accepted") {
    throw new Error("An accepted matching leadership validation is required.");
  }
  return {
    ...record,
    status: "validated",
    validatedAt: nowIso(options.now)
  };
}

function commitment(value, index) {
  exactKeys(value, new Set(["action", "ownerRole", "timing"]), `Intervention commitment ${index + 1}`);
  return {
    action: requiredText(value.action, `Intervention commitment ${index + 1}`, 500, 20),
    ownerRole: requiredText(value.ownerRole, `Intervention commitment ${index + 1} owner role`, 120),
    timing: requiredText(value.timing, `Intervention commitment ${index + 1} timing`, 120)
  };
}

function evidencePlanItem(value, index) {
  exactKeys(value, new Set(["evidenceClass", "measure", "observationCadence"]), `Evidence plan ${index + 1}`);
  return {
    evidenceClass: enumValue(value.evidenceClass, EVIDENCE_CLASSES, "Select a valid evidence class."),
    measure: requiredText(value.measure, `Evidence plan ${index + 1} measure`, 500, 20),
    observationCadence: requiredText(value.observationCadence, `Evidence plan ${index + 1} cadence`, 120)
  };
}

export function createInterventionProposal(record, values, options = {}) {
  if (record.status !== "validated") throw new Error("A leadership-validated diagnostic record is required.");
  exactKeys(values, new Set([
    "objective",
    "rationale",
    "scope",
    "operatingChanges",
    "commitments",
    "learningRequirements",
    "evidencePlan",
    "reviewCadence",
    "duration",
    "commercialOfferRef"
  ]), "The intervention proposal");
  if (!Array.isArray(values.commitments) || values.commitments.length === 0) throw new Error("Add at least one intervention commitment.");
  if (!Array.isArray(values.evidencePlan) || values.evidencePlan.length === 0) throw new Error("Add an intervention evidence plan.");
  const normalizedEvidencePlan = values.evidencePlan.map(evidencePlanItem);
  const includedClasses = new Set(normalizedEvidencePlan.map((item) => item.evidenceClass));
  const missingClasses = [...EVIDENCE_CLASSES].filter((evidenceClass) => !includedClasses.has(evidenceClass));
  if (missingClasses.length) throw new Error(`The evidence plan is missing: ${missingClasses.join(", ")}.`);
  const createdAt = nowIso(options.now);
  return {
    interventionProposalId: options.id || crypto.randomUUID(),
    interventionProposalVersion: INTERVENTION_PROPOSAL_VERSION,
    diagnosticRecordId: record.diagnosticRecordId,
    objective: requiredText(values.objective, "Intervention objective", 800, 40),
    rationale: requiredText(values.rationale, "Intervention rationale", 1200, 40),
    scope: requiredText(values.scope, "Intervention scope", 1200, 40),
    operatingChanges: textList(values.operatingChanges, "Operating changes", 12, 500, 1),
    commitments: values.commitments.map(commitment),
    learningRequirements: textList(values.learningRequirements || [], "Learning requirements", 12, 500),
    evidencePlan: normalizedEvidencePlan,
    reviewCadence: requiredText(values.reviewCadence, "Review cadence", 200),
    duration: requiredText(values.duration, "Intervention duration", 120),
    commercialOfferRef: requiredText(values.commercialOfferRef, "Commercial offer reference", 120),
    status: "proposed",
    createdAt,
    acceptedAt: null
  };
}

export function acceptInterventionProposal(proposal, values, options = {}) {
  if (proposal.status !== "proposed") throw new Error("Only a proposed intervention can be accepted.");
  exactKeys(values, new Set(["scopeAccepted", "commercialTermsAccepted", "entitlementActive"]), "The intervention acceptance");
  if (values.scopeAccepted !== true) throw new Error("Accept the intervention scope first.");
  if (values.commercialTermsAccepted !== true) throw new Error("Accept the commercial terms first.");
  if (values.entitlementActive !== true) throw new Error("An active intervention entitlement is required.");
  return {
    ...proposal,
    status: "accepted",
    acceptedAt: nowIso(options.now)
  };
}

export const diagnosticDecision = Object.freeze({
  diagnosticRecordVersion: DIAGNOSTIC_RECORD_VERSION,
  interventionProposalVersion: INTERVENTION_PROPOSAL_VERSION,
  evidenceClasses: Object.freeze([...EVIDENCE_CLASSES]),
  validationDecisions: Object.freeze([...VALIDATION_DECISIONS])
});
