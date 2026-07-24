import test from "node:test";
import assert from "node:assert/strict";
import { compareOrganizationRounds } from "../organization-comparison-engine.js";

const domains = {
  leadership: { mean: 60, perspectivePattern: "closely-aligned" },
  decisions: { mean: 45, perspectivePattern: "widely-varied" },
  rhythm: { mean: 55, perspectivePattern: "varied" },
  alignment: { mean: 58, perspectivePattern: "varied" },
  technology: { mean: 62, perspectivePattern: "closely-aligned" },
  culture: { mean: 57, perspectivePattern: "varied" }
};

const baseline = {
  policy: "aggregate",
  participantCount: 5,
  assessmentVersion: "1.0.0",
  scoringVersion: "0.1.0",
  domainScores: domains,
  overallIndex: 56,
  primaryConstraintIds: ["decisions"]
};

test("compares threshold-qualified organizational rounds with neutral deltas", () => {
  const followUp = {
    ...baseline,
    participantCount: 6,
    overallIndex: 61,
    domainScores: {
      ...domains,
      decisions: { mean: 55, perspectivePattern: "varied" }
    },
    primaryConstraintIds: ["rhythm"]
  };
  const result = compareOrganizationRounds(baseline, followUp);
  assert.equal(result.policy, "numeric-delta");
  assert.equal(result.overallDelta, 5);
  assert.equal(result.domainDeltas.decisions.delta, 10);
  assert.equal(result.constraintChanged, true);
  assert.match(result.interpretation, /does not prove/);
});

test("suppresses comparison without two aggregates and numeric deltas across versions", () => {
  assert.equal(compareOrganizationRounds(baseline, null).policy, "unavailable");
  const changedVersion = compareOrganizationRounds(
    baseline,
    { ...baseline, scoringVersion: "0.2.0" }
  );
  assert.equal(changedVersion.policy, "side-by-side-only");
  assert.equal("overallDelta" in changedVersion, false);
});
