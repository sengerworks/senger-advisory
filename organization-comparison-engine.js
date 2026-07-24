export const ORGANIZATION_COMPARISON_VERSION = "1.0.0";

const DOMAINS = ["leadership", "decisions", "rhythm", "alignment", "technology", "culture"];

function compatibleAggregate(value) {
  return (
    value
    && value.policy === "aggregate"
    && typeof value.assessmentVersion === "string"
    && typeof value.scoringVersion === "string"
    && Number.isInteger(value.overallIndex)
    && value.domainScores
    && DOMAINS.every(domain => Number.isInteger(value.domainScores[domain]?.mean))
  );
}

export function compareOrganizationRounds(baseline, followUp) {
  if (!compatibleAggregate(baseline) || !compatibleAggregate(followUp)) {
    return {
      policy: "unavailable",
      comparisonVersion: ORGANIZATION_COMPARISON_VERSION,
      reason: "Both collection rounds must meet the privacy threshold before comparison."
    };
  }
  const sameAssessment = baseline.assessmentVersion === followUp.assessmentVersion;
  const sameScoring = baseline.scoringVersion === followUp.scoringVersion;
  const base = {
    comparisonVersion: ORGANIZATION_COMPARISON_VERSION,
    baselineParticipantCount: baseline.participantCount,
    followUpParticipantCount: followUp.participantCount,
    baselineOverallIndex: baseline.overallIndex,
    followUpOverallIndex: followUp.overallIndex,
    baselineConstraintIds: baseline.primaryConstraintIds,
    followUpConstraintIds: followUp.primaryConstraintIds,
    constraintChanged:
      baseline.primaryConstraintIds.join("|") !== followUp.primaryConstraintIds.join("|"),
    interpretation:
      "Score movement is descriptive. It does not prove that an action caused the change."
  };
  if (!sameAssessment || !sameScoring) {
    return {
      ...base,
      policy: "side-by-side-only",
      reason: sameAssessment
        ? "The scoring method changed, so numeric deltas are not shown."
        : "The assessment changed, so numeric deltas are not shown."
    };
  }
  return {
    ...base,
    policy: "numeric-delta",
    overallDelta: followUp.overallIndex - baseline.overallIndex,
    domainDeltas: Object.fromEntries(DOMAINS.map(domain => [
      domain,
      {
        baseline: baseline.domainScores[domain].mean,
        followUp: followUp.domainScores[domain].mean,
        delta: followUp.domainScores[domain].mean - baseline.domainScores[domain].mean,
        baselinePattern: baseline.domainScores[domain].perspectivePattern,
        followUpPattern: followUp.domainScores[domain].perspectivePattern
      }
    ]))
  };
}
