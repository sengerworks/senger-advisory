const LIFECYCLE_VERSION = "1.0.0";

const ROUTES = new Set(["automated", "advisor-led"]);
const ENTITLEMENT_TYPES = new Set(["paid", "poc"]);
const REVIEW_STATES = new Set(["clear", "required", "in-review", "resolved"]);

const TRANSITIONS = Object.freeze({
  draft: ["discovery"],
  discovery: ["participant-design"],
  "participant-design": ["protocol-review", "discovery"],
  "protocol-review": ["collecting", "participant-design"],
  collecting: ["evidence-review", "protocol-review"],
  "evidence-review": ["synthesis", "collecting"],
  synthesis: ["leadership-validation", "evidence-review"],
  "leadership-validation": ["intervention-proposed", "synthesis"],
  "intervention-proposed": ["intervention-accepted", "leadership-validation"],
  "intervention-accepted": ["active-intervention"],
  "active-intervention": ["reassessment", "completed"],
  reassessment: ["active-intervention", "discovery", "completed"],
  completed: ["discovery"]
});

function isoNow(value) {
  const date = value instanceof Date ? value : new Date(value || Date.now());
  if (!Number.isFinite(date.getTime())) throw new Error("The diagnostic timestamp is invalid.");
  return date.toISOString();
}

function requiredText(value, name, maximum) {
  const text = String(value || "").trim();
  if (!text) throw new Error(`${name} is required.`);
  if (text.length > maximum) throw new Error(`${name} must be ${maximum} characters or fewer.`);
  return text;
}

function requireGate(gates, name, message) {
  if (gates?.[name] !== true) throw new Error(message);
}

function validateTransition(current, next, gates, humanReviewState) {
  if (!TRANSITIONS[current]?.includes(next)) {
    throw new Error(`The diagnostic cannot move from ${current} to ${next}.`);
  }

  if (next === "discovery" && current === "draft") {
    requireGate(gates, "entitlementActive", "An active paid or POC entitlement is required.");
  }
  if (next === "participant-design") {
    requireGate(gates, "contextBriefApproved", "Approve the Diagnostic Context Brief first.");
  }
  if (next === "protocol-review") {
    requireGate(gates, "participantPlanApproved", "Approve the participant plan first.");
    requireGate(gates, "perspectiveCoverageAccepted", "Resolve or explicitly accept perspective-coverage gaps first.");
  }
  if (next === "collecting") {
    requireGate(gates, "protocolApproved", "Approve the common diagnostic protocol first.");
    requireGate(gates, "participantNoticeApproved", "Approve the participant notice first.");
  }
  if (next === "evidence-review") {
    requireGate(gates, "collectionClosed", "Close confidential response collection first.");
    requireGate(gates, "participationPlanSatisfied", "The approved participation plan is not satisfied.");
  }
  if (next === "synthesis") {
    requireGate(gates, "deidentificationComplete", "Complete de-identification first.");
    requireGate(gates, "disclosureReviewComplete", "Complete disclosure-risk review first.");
    requireGate(gates, "evidenceQualityPassed", "The diagnostic evidence-quality gate has not passed.");
    if (["required", "in-review"].includes(humanReviewState)) {
      throw new Error("Required human review must be resolved before synthesis.");
    }
  }
  if (next === "leadership-validation") {
    requireGate(gates, "diagnosticRecordReady", "Complete the evidence-traceable diagnostic record first.");
  }
  if (next === "intervention-proposed") {
    requireGate(gates, "leadershipValidationComplete", "Complete leadership validation first.");
    requireGate(gates, "constraintHypothesisAccepted", "Resolve material objections to the constraint hypothesis first.");
  }
  if (next === "intervention-accepted") {
    requireGate(gates, "interventionScopeAccepted", "Accept the intervention scope first.");
    requireGate(gates, "commercialTermsAccepted", "Accept the intervention commercial terms first.");
    requireGate(gates, "interventionEntitlementActive", "An active intervention entitlement is required.");
  }
  if (next === "active-intervention") {
    requireGate(gates, "operatingBriefReady", "The Capacity Operating Brief must be ready.");
  }
  if (next === "reassessment") {
    requireGate(gates, "reviewDue", "A review or reassessment decision must be due.");
  }
  if (next === "completed") {
    requireGate(gates, "closureDecisionRecorded", "Record the intervention closure decision first.");
  }
}

export function createDiagnostic(values, options = {}) {
  const route = String(values.route || "");
  const entitlementType = String(values.entitlementType || "");
  if (!ROUTES.has(route)) throw new Error("Select a valid diagnostic delivery route.");
  if (!ENTITLEMENT_TYPES.has(entitlementType)) throw new Error("Select a valid diagnostic entitlement type.");
  const createdAt = isoNow(options.now);
  return {
    diagnosticId: options.id || crypto.randomUUID(),
    lifecycleVersion: LIFECYCLE_VERSION,
    workspaceId: requiredText(values.workspaceId, "Workspace ID", 100),
    route,
    entitlementType,
    state: "draft",
    humanReviewState: "clear",
    createdAt,
    updatedAt: createdAt,
    completedAt: null,
    transitionHistory: []
  };
}

export function transitionDiagnostic(diagnostic, nextState, gates = {}, options = {}) {
  const next = String(nextState || "");
  validateTransition(diagnostic.state, next, gates, diagnostic.humanReviewState);
  const updatedAt = isoNow(options.now);
  return {
    ...diagnostic,
    state: next,
    updatedAt,
    completedAt: next === "completed" ? updatedAt : null,
    transitionHistory: [
      ...diagnostic.transitionHistory,
      {
        from: diagnostic.state,
        to: next,
        at: updatedAt,
        reason: requiredText(options.reason, "A transition reason", 300)
      }
    ]
  };
}

export function setDiagnosticHumanReview(diagnostic, reviewState, options = {}) {
  const state = String(reviewState || "");
  if (!REVIEW_STATES.has(state)) throw new Error("Select a valid human-review state.");
  if (state === "clear" && diagnostic.humanReviewState !== "clear") {
    throw new Error("A raised human review must be resolved, not cleared.");
  }
  return {
    ...diagnostic,
    humanReviewState: state,
    updatedAt: isoNow(options.now)
  };
}

export const diagnosticLifecycle = Object.freeze({
  version: LIFECYCLE_VERSION,
  routes: Object.freeze([...ROUTES]),
  entitlementTypes: Object.freeze([...ENTITLEMENT_TYPES]),
  humanReviewStates: Object.freeze([...REVIEW_STATES]),
  transitions: TRANSITIONS
});
