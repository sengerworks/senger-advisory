const DOMAINS = ["leadership", "decisions", "rhythm", "alignment", "technology", "culture"];

function daysBetween(first, second) {
  return Math.max(0, Math.round((Date.parse(second) - Date.parse(first)) / 86400000));
}

export function formatScoreDelta(value) {
  if (value > 0) return `+${value}`;
  return String(value);
}

export function compareAssessmentInstances(baseline, current) {
  if (!baseline || !current) return { policy: "unavailable" };
  const sameAssessment = baseline.assessmentVersion === current.assessmentVersion;
  const sameScoring = baseline.scoringVersion === current.scoringVersion;
  const base = {
    baseline,
    current,
    elapsedDays: daysBetween(baseline.completedAt, current.completedAt),
    constraintChanged: baseline.primaryConstraintIds.join("|") !== current.primaryConstraintIds.join("|")
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
    overallDelta: current.overallIndex - baseline.overallIndex,
    domainDeltas: Object.fromEntries(DOMAINS.map(domain => [
      domain,
      current.domainScores[domain] - baseline.domainScores[domain]
    ]))
  };
}

export function comparisonForProfile(profile) {
  if (!profile?.assessmentInstances || profile.assessmentInstances.length < 2) {
    return { policy: "unavailable" };
  }
  return compareAssessmentInstances(profile.assessmentInstances[0], profile.assessmentInstances.at(-1));
}
