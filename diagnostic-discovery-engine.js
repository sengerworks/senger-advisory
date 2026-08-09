const DISCOVERY_VERSION = "1.0.0";

const ORGANIZATION_SIZE_BANDS = new Set(["under-25", "25-49", "50-149", "150-399", "400-plus"]);
const SPONSOR_PERSPECTIVES = new Set(["founder-ceo", "executive", "functional-leader", "people-operations", "board-advisor"]);
const LEADERSHIP_LEVELS = new Set(["enterprise", "functional", "operational", "frontline"]);
const EXECUTION_PROXIMITIES = new Set(["strategy", "coordination", "delivery"]);
const FUNCTIONAL_LENSES = new Set([
  "executive-leadership",
  "operations",
  "people",
  "finance",
  "commercial",
  "product-service",
  "technology",
  "frontline-delivery",
  "other"
]);

function nowIso(value) {
  const date = value instanceof Date ? value : new Date(value || Date.now());
  if (!Number.isFinite(date.getTime())) throw new Error("The timestamp is invalid.");
  return date.toISOString();
}

function requiredText(value, name, maximum) {
  const text = String(value || "").trim();
  if (!text) throw new Error(`${name} is required.`);
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

function textList(values, name, maximumItems, maximumLength) {
  if (!Array.isArray(values)) throw new Error(`${name} must be a list.`);
  if (values.length > maximumItems) throw new Error(`${name} can contain at most ${maximumItems} items.`);
  return values.map((value, index) => requiredText(value, `${name} item ${index + 1}`, maximumLength));
}

function enumValue(value, allowed, message) {
  const normalized = String(value || "");
  if (!allowed.has(normalized)) throw new Error(message);
  return normalized;
}

function enumList(values, allowed, name) {
  if (!Array.isArray(values) || values.length === 0) throw new Error(`${name} requires at least one perspective.`);
  const normalized = [...new Set(values.map((value) => String(value || "")))];
  if (normalized.some((value) => !allowed.has(value))) throw new Error(`${name} contains an unsupported perspective.`);
  return normalized;
}

export function createDiagnosticContextBrief(values, options = {}) {
  exactKeys(values, new Set([
    "diagnosticId",
    "organizationSizeBand",
    "sponsorPerspective",
    "organizationContext",
    "strategicPriority",
    "triggeringConcern",
    "decisionsAtRisk",
    "recentChanges",
    "priorInterventions",
    "knownSensitivities",
    "decisionNeeded"
  ]), "The context brief");

  const createdAt = nowIso(options.now);
  return {
    contextBriefId: options.id || crypto.randomUUID(),
    discoveryVersion: DISCOVERY_VERSION,
    diagnosticId: requiredText(values.diagnosticId, "Diagnostic ID", 100),
    status: "draft",
    organizationSizeBand: enumValue(values.organizationSizeBand, ORGANIZATION_SIZE_BANDS, "Select a valid organization size."),
    sponsorPerspective: enumValue(values.sponsorPerspective, SPONSOR_PERSPECTIVES, "Select a valid sponsor perspective."),
    organizationContext: requiredText(values.organizationContext, "Organization context", 1500),
    strategicPriority: requiredText(values.strategicPriority, "Strategic priority", 1000),
    triggeringConcern: requiredText(values.triggeringConcern, "Triggering concern", 1500),
    decisionsAtRisk: requiredText(values.decisionsAtRisk, "Decisions or outcomes at risk", 1000),
    recentChanges: textList(values.recentChanges || [], "Recent changes", 12, 600),
    priorInterventions: textList(values.priorInterventions || [], "Prior interventions", 12, 600),
    knownSensitivities: optionalText(values.knownSensitivities, "Known sensitivities", 1000),
    decisionNeeded: requiredText(values.decisionNeeded, "Leadership decision needed", 1000),
    createdAt,
    updatedAt: createdAt,
    approvedAt: null,
    approvalNote: ""
  };
}

export function approveDiagnosticContextBrief(brief, values = {}, options = {}) {
  if (brief.status !== "draft") throw new Error("Only a draft context brief can be approved.");
  return {
    ...brief,
    status: "approved",
    updatedAt: nowIso(options.now),
    approvedAt: nowIso(options.now),
    approvalNote: optionalText(values.approvalNote, "Approval note", 500)
  };
}

function participantSlot(value, index) {
  exactKeys(value, new Set(["slotId", "leadershipLevel", "executionProximity", "functionalLens"]), `Participant slot ${index + 1}`);
  return {
    slotId: requiredText(value.slotId, `Participant slot ${index + 1} ID`, 100),
    leadershipLevel: enumValue(value.leadershipLevel, LEADERSHIP_LEVELS, "Select a valid leadership level."),
    executionProximity: enumValue(value.executionProximity, EXECUTION_PROXIMITIES, "Select a valid execution proximity."),
    functionalLens: enumValue(value.functionalLens, FUNCTIONAL_LENSES, "Select a valid functional lens.")
  };
}

export function createParticipantPlan(values, options = {}) {
  exactKeys(values, new Set([
    "diagnosticId",
    "targetLeadershipLevels",
    "targetExecutionProximities",
    "targetFunctionalLenses",
    "participantSlots"
  ]), "The participant plan");

  if (!Array.isArray(values.participantSlots) || values.participantSlots.length === 0) {
    throw new Error("Add at least one participant slot to the proposed plan.");
  }
  if (values.participantSlots.length > 50) throw new Error("A participant plan can contain at most 50 slots.");
  const slots = values.participantSlots.map(participantSlot);
  if (new Set(slots.map((slot) => slot.slotId)).size !== slots.length) throw new Error("Participant slot IDs must be unique.");
  const createdAt = nowIso(options.now);
  return {
    participantPlanId: options.id || crypto.randomUUID(),
    discoveryVersion: DISCOVERY_VERSION,
    diagnosticId: requiredText(values.diagnosticId, "Diagnostic ID", 100),
    status: "draft",
    coverageObjectives: {
      leadershipLevels: enumList(values.targetLeadershipLevels, LEADERSHIP_LEVELS, "Leadership-level coverage"),
      executionProximities: enumList(values.targetExecutionProximities, EXECUTION_PROXIMITIES, "Execution-proximity coverage"),
      functionalLenses: enumList(values.targetFunctionalLenses, FUNCTIONAL_LENSES, "Functional-lens coverage")
    },
    participantSlots: slots,
    acceptedGaps: [],
    createdAt,
    updatedAt: createdAt,
    approvedAt: null,
    approvalNote: ""
  };
}

export function evaluatePerspectiveCoverage(plan) {
  const present = {
    leadershipLevels: new Set(plan.participantSlots.map((slot) => slot.leadershipLevel)),
    executionProximities: new Set(plan.participantSlots.map((slot) => slot.executionProximity)),
    functionalLenses: new Set(plan.participantSlots.map((slot) => slot.functionalLens))
  };
  const missing = [];
  for (const [dimension, objectives] of Object.entries(plan.coverageObjectives)) {
    for (const perspective of objectives) {
      if (!present[dimension].has(perspective)) missing.push(`${dimension}:${perspective}`);
    }
  }
  const accepted = new Set(plan.acceptedGaps.map((gap) => gap.gapId));
  return {
    covered: missing.length === 0,
    missing,
    unresolved: missing.filter((gapId) => !accepted.has(gapId)),
    accepted: missing.filter((gapId) => accepted.has(gapId))
  };
}

export function acceptPerspectiveGap(plan, values, options = {}) {
  if (plan.status !== "draft") throw new Error("Perspective gaps can be accepted only while the plan is a draft.");
  const coverage = evaluatePerspectiveCoverage(plan);
  const gapId = String(values.gapId || "");
  if (!coverage.missing.includes(gapId)) throw new Error("Select a current perspective-coverage gap.");
  if (plan.acceptedGaps.some((gap) => gap.gapId === gapId)) throw new Error("That perspective gap is already accepted.");
  return {
    ...plan,
    acceptedGaps: [
      ...plan.acceptedGaps,
      {
        gapId,
        reason: requiredText(values.reason, "A gap-acceptance reason", 500),
        acceptedAt: nowIso(options.now)
      }
    ],
    updatedAt: nowIso(options.now)
  };
}

export function approveParticipantPlan(plan, values = {}, options = {}) {
  if (plan.status !== "draft") throw new Error("Only a draft participant plan can be approved.");
  const coverage = evaluatePerspectiveCoverage(plan);
  if (coverage.unresolved.length) throw new Error("Resolve or explicitly accept every perspective-coverage gap before approval.");
  const approvedAt = nowIso(options.now);
  return {
    ...plan,
    status: "approved",
    updatedAt: approvedAt,
    approvedAt,
    approvalNote: optionalText(values.approvalNote, "Approval note", 500)
  };
}

export const diagnosticDiscovery = Object.freeze({
  version: DISCOVERY_VERSION,
  organizationSizeBands: Object.freeze([...ORGANIZATION_SIZE_BANDS]),
  sponsorPerspectives: Object.freeze([...SPONSOR_PERSPECTIVES]),
  leadershipLevels: Object.freeze([...LEADERSHIP_LEVELS]),
  executionProximities: Object.freeze([...EXECUTION_PROXIMITIES]),
  functionalLenses: Object.freeze([...FUNCTIONAL_LENSES])
});
