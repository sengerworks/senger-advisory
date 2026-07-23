import test from "node:test";
import assert from "node:assert/strict";
import {
  compareAssessmentInstances,
  comparisonForProfile,
  formatScoreDelta
} from "../comparison-engine.js";

function assessment(overrides = {}) {
  return {
    completedAt: "2026-01-01T12:00:00.000Z",
    assessmentVersion: "1.0.0",
    scoringVersion: "0.1.0",
    overallIndex: 50,
    domainScores: {
      leadership: 50,
      decisions: 50,
      rhythm: 50,
      alignment: 50,
      technology: 50,
      culture: 50
    },
    primaryConstraintIds: ["leadership"],
    ...overrides
  };
}

test("compares same-version baseline and current results with neutral deltas", () => {
  const baseline = assessment();
  const current = assessment({
    completedAt: "2026-04-01T12:00:00.000Z",
    overallIndex: 55,
    domainScores: { ...baseline.domainScores, leadership: 75, technology: 25 },
    primaryConstraintIds: ["technology"]
  });
  const comparison = compareAssessmentInstances(baseline, current);
  assert.equal(comparison.policy, "numeric-delta");
  assert.equal(comparison.elapsedDays, 90);
  assert.equal(comparison.overallDelta, 5);
  assert.equal(comparison.domainDeltas.leadership, 25);
  assert.equal(comparison.domainDeltas.technology, -25);
  assert.equal(comparison.constraintChanged, true);
});

test("suppresses numeric deltas when the scoring version changes", () => {
  const comparison = compareAssessmentInstances(assessment(), assessment({
    completedAt: "2026-02-01T12:00:00.000Z",
    scoringVersion: "0.2.0",
    overallIndex: 75
  }));
  assert.equal(comparison.policy, "side-by-side-only");
  assert.equal("overallDelta" in comparison, false);
  assert.match(comparison.reason, /scoring method changed/);
});

test("uses the first and latest assessments in a profile", () => {
  const first = assessment();
  const middle = assessment({ completedAt: "2026-02-01T12:00:00.000Z", overallIndex: 60 });
  const latest = assessment({ completedAt: "2026-03-01T12:00:00.000Z", overallIndex: 70 });
  const comparison = comparisonForProfile({ assessmentInstances: [first, middle, latest] });
  assert.equal(comparison.baseline, first);
  assert.equal(comparison.current, latest);
  assert.equal(comparison.overallDelta, 20);
});

test("reports an unavailable comparison for a single assessment", () => {
  assert.equal(comparisonForProfile({ assessmentInstances: [assessment()] }).policy, "unavailable");
  assert.equal(formatScoreDelta(4), "+4");
  assert.equal(formatScoreDelta(0), "0");
  assert.equal(formatScoreDelta(-3), "-3");
});
