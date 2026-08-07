import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { aggregateCapacitySignalSubmissions, capacitySignalAggregationPolicy, validateCapacitySignalSubmission } from "../capacity-signal-aggregation-engine.js";

function submission(index, overrides = {}) {
  return {
    submissionId: `123e4567-e89b-42d3-a456-42661417400${index}`,
    completedAt: "2026-08-08T00:00:00.000Z",
    assessmentVersion: "2.0.0",
    demandLevel: "pronounced",
    complexityDimensions: ["interdependence", "rate-of-change"],
    frictionPatternIds: ["coordination-overhead", "decision-delay"],
    compensationPatternIds: ["senior-escalation", "meeting-load"],
    operatingSignalIds: ["formal-lived-authority"],
    ...overrides
  };
}

test("withholds every organizational signal below five submissions", () => {
  const result = aggregateCapacitySignalSubmissions([submission(0), submission(1), submission(2), submission(3)]);
  assert.deepEqual(Object.keys(result), ["state", "policy", "participantCount", "requiredCount", "assessmentVersion", "aggregationVersion"]);
  assert.equal(result.state, "withheld");
  assert.equal(JSON.stringify(result).includes("friction"), false);
});

test("aggregates convergence without averaging or declaring a constraint", () => {
  const result = aggregateCapacitySignalSubmissions([
    submission(0), submission(1), submission(2),
    submission(3, { frictionPatternIds: ["decision-delay"] }),
    submission(4, { compensationPatternIds: ["manual-workarounds"] })
  ]);
  assert.equal(result.state, "available");
  assert.ok(result.frictionPatterns.some(value => value.patternId === "decision-delay" && value.pattern === "widespread"));
  assert.ok(result.compensationPatterns.some(value => value.patternId === "senior-escalation" && value.pattern === "widespread"));
  assert.match(result.interpretation, /does not measure Organizational Capacity/);
  assert.equal("overallIndex" in result, false);
  assert.equal("mechanismScores" in result, false);
  assert.equal("primaryConstraintIds" in result, false);
});

test("rejects answers, identity, duplicate submissions, and legacy versions", () => {
  assert.equal(validateCapacitySignalSubmission({ ...submission(0), answers: {} }), false);
  assert.equal(validateCapacitySignalSubmission({ ...submission(0), assessmentVersion: "1.0.0" }), false);
  assert.throws(() => aggregateCapacitySignalSubmissions(Array.from({ length: 5 }, () => submission(0))), /Duplicate/);
});

test("aggregation policy preserves the diagnostic boundary", () => {
  assert.equal(capacitySignalAggregationPolicy.privacyThreshold, 5);
  assert.equal(capacitySignalAggregationPolicy.individualAnswersAccepted, false);
  assert.equal(capacitySignalAggregationPolicy.numericCapacityScoresProduced, false);
  assert.equal(capacitySignalAggregationPolicy.crossVersionComparisonAllowed, false);
  assert.equal(capacitySignalAggregationPolicy.constraintDeclared, false);
});

test("machine-readable minimized submission contract matches the aggregation policy", async () => {
  const contract = JSON.parse(await readFile(new URL("../schemas/capacity-signal-submission.json", import.meta.url), "utf8"));
  assert.equal(contract.assessmentVersion, "2.0.0");
  assert.equal(contract.privacyThreshold, capacitySignalAggregationPolicy.privacyThreshold);
  assert.ok(contract.prohibitedFields.includes("answers"));
  assert.ok(contract.prohibitedFields.includes("mechanismScores"));
  assert.equal(contract.crossVersionComparisonAllowed, false);
});
