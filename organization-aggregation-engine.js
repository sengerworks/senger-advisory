export const ORGANIZATION_AGGREGATION_VERSION = "1.0.0";
export const MINIMUM_ORGANIZATION_COHORT = 5;

const DOMAINS = ["leadership", "decisions", "rhythm", "alignment", "technology", "culture"];
const BANDS = new Set(["Constrained", "Strained", "Developing", "Enabling"]);

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isScore(value) {
  return Number.isInteger(value) && value >= 0 && value <= 100;
}

function isUuid(value) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function validateOrganizationSubmission(submission) {
  if (!isObject(submission)) return false;
  const keys = ["submissionId", "completedAt", "assessmentVersion", "scoringVersion", "domainScores", "overallIndex", "interpretationBand", "primaryConstraintIds"];
  if (Object.keys(submission).length !== keys.length || !keys.every(key => Object.hasOwn(submission, key))) return false;
  if (!isUuid(submission.submissionId) || !Number.isFinite(Date.parse(submission.completedAt))) return false;
  if (![submission.assessmentVersion, submission.scoringVersion].every(value => /^\d+\.\d+\.\d+$/.test(value))) return false;
  if (!isObject(submission.domainScores) || Object.keys(submission.domainScores).length !== DOMAINS.length) return false;
  if (!DOMAINS.every(domain => isScore(submission.domainScores[domain]))) return false;
  if (!isScore(submission.overallIndex) || !BANDS.has(submission.interpretationBand)) return false;
  return Array.isArray(submission.primaryConstraintIds)
    && submission.primaryConstraintIds.length >= 1
    && submission.primaryConstraintIds.length <= DOMAINS.length
    && submission.primaryConstraintIds.every(domain => DOMAINS.includes(domain))
    && new Set(submission.primaryConstraintIds).size === submission.primaryConstraintIds.length;
}

function mean(values) {
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function dispersion(values) {
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const deviation = Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length);
  if (deviation < 8) return "closely-aligned";
  if (deviation < 16) return "varied";
  return "widely-varied";
}

export function aggregateOrganization(submissions, options = {}) {
  if (!Array.isArray(submissions) || submissions.length > 500 || !submissions.every(validateOrganizationSubmission)) {
    throw new Error("Organizational submissions do not match the supported aggregate contract.");
  }
  const minimumRequired = options.minimumRequired || MINIMUM_ORGANIZATION_COHORT;
  if (!Number.isInteger(minimumRequired) || minimumRequired < MINIMUM_ORGANIZATION_COHORT) {
    throw new Error(`The organizational privacy threshold cannot be lower than ${MINIMUM_ORGANIZATION_COHORT}.`);
  }
  const ids = submissions.map(submission => submission.submissionId);
  if (new Set(ids).size !== ids.length) throw new Error("Duplicate organizational submissions are not allowed.");
  const participantCount = submissions.length;
  if (participantCount < minimumRequired) {
    return {
      policy: "suppressed",
      aggregationVersion: ORGANIZATION_AGGREGATION_VERSION,
      participantCount,
      minimumRequired,
      remaining: minimumRequired - participantCount,
      reason: "Organizational results remain hidden until the privacy threshold is met."
    };
  }
  const assessmentVersions = new Set(submissions.map(submission => submission.assessmentVersion));
  const scoringVersions = new Set(submissions.map(submission => submission.scoringVersion));
  if (assessmentVersions.size !== 1 || scoringVersions.size !== 1) {
    return {
      policy: "incompatible-versions",
      aggregationVersion: ORGANIZATION_AGGREGATION_VERSION,
      participantCount,
      reason: "Organizational scores cannot be combined across assessment or scoring versions."
    };
  }
  const domainScores = Object.fromEntries(DOMAINS.map(domain => {
    const values = submissions.map(submission => submission.domainScores[domain]);
    return [domain, { mean: mean(values), perspectivePattern: dispersion(values) }];
  }));
  const lowest = Math.min(...DOMAINS.map(domain => domainScores[domain].mean));
  return {
    policy: "aggregate",
    aggregationVersion: ORGANIZATION_AGGREGATION_VERSION,
    participantCount,
    assessmentVersion: submissions[0].assessmentVersion,
    scoringVersion: submissions[0].scoringVersion,
    domainScores,
    overallIndex: mean(submissions.map(submission => submission.overallIndex)),
    primaryConstraintIds: DOMAINS.filter(domain => domainScores[domain].mean === lowest),
    constraintPolicy: "lowest-aggregate-domain-mean",
    interpretation: "Perspective patterns describe response dispersion, not accuracy, conflict, or statistical significance."
  };
}

export const organizationAggregationDomains = Object.freeze([...DOMAINS]);
