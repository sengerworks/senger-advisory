export const CAPACITY_SIGNAL_AGGREGATION_VERSION = "2.0.0";
export const CAPACITY_SIGNAL_PRIVACY_THRESHOLD = 5;

const ASSESSMENT_VERSION = "2.0.0";
const DEMAND_LEVELS = new Set(["limited", "emerging", "pronounced"]);
const COMPLEXITY_DIMENSIONS = new Set(["volume", "variety", "interdependence", "uncertainty", "rate-of-change"]);
const PATTERN_IDS = new Set([
  "priority-churn", "decision-delay", "information-reconstruction", "coordination-overhead", "resource-displacement",
  "senior-escalation", "meeting-load", "key-person-dependency", "manual-workarounds", "extraordinary-effort",
  "priority-tradeoffs", "formal-lived-authority", "information-timing", "resource-fit"
]);

function isObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function exactKeys(value, keys) { return isObject(value) && Object.keys(value).length === keys.length && Object.keys(value).every(key => keys.includes(key)); }
function isUuid(value) { return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }
function uniqueAllowed(values, allowed, maximum) { return Array.isArray(values) && values.length <= maximum && new Set(values).size === values.length && values.every(value => allowed.has(value)); }

export function createCapacitySignalSubmission(result) {
  if (!isObject(result) || result.assessmentVersion !== ASSESSMENT_VERSION) throw new Error("A Capacity Signal Assessment v2 result is required.");
  return Object.freeze({
    submissionId: crypto.randomUUID(),
    completedAt: result.completedAt,
    assessmentVersion: result.assessmentVersion,
    demandLevel: result.executionDemand.evidenceLevel,
    complexityDimensions: Object.freeze([...result.executionDemand.dimensionsObserved]),
    frictionPatternIds: Object.freeze(result.frictionPatterns.map(pattern => pattern.patternId)),
    compensationPatternIds: Object.freeze(result.compensationPatterns.map(pattern => pattern.patternId)),
    operatingSignalIds: Object.freeze(result.operatingSignals.map(pattern => pattern.patternId))
  });
}

export function validateCapacitySignalSubmission(value) {
  const keys = ["submissionId", "completedAt", "assessmentVersion", "demandLevel", "complexityDimensions", "frictionPatternIds", "compensationPatternIds", "operatingSignalIds"];
  if (!exactKeys(value, keys) || !isUuid(value.submissionId) || !Number.isFinite(Date.parse(value.completedAt))) return false;
  return value.assessmentVersion === ASSESSMENT_VERSION
    && DEMAND_LEVELS.has(value.demandLevel)
    && uniqueAllowed(value.complexityDimensions, COMPLEXITY_DIMENSIONS, 5)
    && uniqueAllowed(value.frictionPatternIds, PATTERN_IDS, 3)
    && uniqueAllowed(value.compensationPatternIds, PATTERN_IDS, 3)
    && uniqueAllowed(value.operatingSignalIds, PATTERN_IDS, 3);
}

function convergence(values, participantCount) {
  const counts = new Map();
  values.flat().forEach(value => counts.set(value, (counts.get(value) || 0) + 1));
  return [...counts.entries()]
    .map(([patternId, count]) => ({ patternId, pattern: count / participantCount >= .6 ? "widespread" : count / participantCount >= .4 ? "mixed" : "limited" }))
    .filter(entry => entry.pattern !== "limited")
    .sort((left, right) => left.pattern === right.pattern ? left.patternId.localeCompare(right.patternId) : left.pattern === "widespread" ? -1 : 1)
    .map(entry => Object.freeze(entry));
}

export function aggregateCapacitySignalSubmissions(submissions, options = {}) {
  if (!Array.isArray(submissions)) throw new Error("Submissions are required.");
  if (submissions.some(value => !validateCapacitySignalSubmission(value))) throw new Error("Every submission must match the v2 minimized contract.");
  if (new Set(submissions.map(value => value.submissionId)).size !== submissions.length) throw new Error("Duplicate submissions are not allowed.");
  if (submissions.length < CAPACITY_SIGNAL_PRIVACY_THRESHOLD) {
    return Object.freeze({
      state: "withheld",
      policy: "minimum-five",
      participantCount: submissions.length,
      requiredCount: CAPACITY_SIGNAL_PRIVACY_THRESHOLD,
      assessmentVersion: ASSESSMENT_VERSION,
      aggregationVersion: CAPACITY_SIGNAL_AGGREGATION_VERSION
    });
  }

  const demandDistribution = Object.fromEntries([...DEMAND_LEVELS].map(level => [level, submissions.filter(value => value.demandLevel === level).length]));
  return Object.freeze({
    state: "available",
    policy: "minimum-five",
    participantCount: submissions.length,
    assessmentVersion: ASSESSMENT_VERSION,
    aggregationVersion: CAPACITY_SIGNAL_AGGREGATION_VERSION,
    demandDistribution: Object.freeze(demandDistribution),
    complexityDimensionPatterns: Object.freeze(convergence(submissions.map(value => value.complexityDimensions), submissions.length)),
    frictionPatterns: Object.freeze(convergence(submissions.map(value => value.frictionPatternIds), submissions.length)),
    compensationPatterns: Object.freeze(convergence(submissions.map(value => value.compensationPatternIds), submissions.length)),
    operatingSignals: Object.freeze(convergence(submissions.map(value => value.operatingSignalIds), submissions.length)),
    interpretation: "This organizational view shows convergence and divergence in directional signals. It does not measure Organizational Capacity or identify a constrained mechanism."
  });
}

export const capacitySignalAggregationPolicy = Object.freeze({
  privacyThreshold: CAPACITY_SIGNAL_PRIVACY_THRESHOLD,
  individualAnswersAccepted: false,
  numericCapacityScoresProduced: false,
  crossVersionComparisonAllowed: false,
  constraintDeclared: false
});
