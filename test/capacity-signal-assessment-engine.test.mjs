import test from "node:test";
import assert from "node:assert/strict";
import {
  CAPACITY_SIGNAL_ASSESSMENT_VERSION,
  capacitySignalAssessmentPolicy,
  capacitySignalQuestionnaire,
  createCapacitySignalAssessment
} from "../capacity-signal-assessment-engine.js";

const questionnaire = capacitySignalQuestionnaire();

function input(response = 3) {
  return {
    context: {
      demandSource: "strategic-ambition",
      executionPriority: "Launch a second market while protecting service quality and current client delivery.",
      timeHorizon: "next-12-months",
      organizationSize: "150–399 people",
      respondentRole: "CEO or founder"
    },
    responses: Object.fromEntries(questionnaire.items.map(item => [item.id, response]))
  };
}

test("v2 gathers eighteen signals across four evidence lenses", () => {
  assert.equal(CAPACITY_SIGNAL_ASSESSMENT_VERSION, "2.0.0");
  assert.equal(questionnaire.items.length, 18);
  assert.deepEqual([...new Set(questionnaire.items.map(item => item.lens))], [
    "execution-demand",
    "friction",
    "capacity-compensation",
    "formal-lived-signal"
  ]);
});

test("creates a Capacity Signal Brief without capacity or mechanism scores", () => {
  const values = input(3);
  values.responses["friction-decision-delay"] = 5;
  values.responses["compensation-senior-escalation"] = 5;
  values.responses["behavior-authority-practice"] = 1;
  const result = createCapacitySignalAssessment(values, {
    id: "signal-result",
    completedAt: "2026-08-08T00:00:00.000Z"
  });

  assert.equal(result.resultId, "signal-result");
  assert.equal(result.executionDemand.evidenceLevel, "emerging");
  assert.equal(result.frictionPatterns[0].patternId, "decision-delay");
  assert.equal(result.compensationPatterns[0].patternId, "senior-escalation");
  assert.equal(result.operatingSignals[0].patternId, "formal-lived-authority");
  assert.ok(result.questionsRaised.some(question => question.includes("formal decision authority")));
  assert.match(result.boundary, /does not measure Organizational Capacity/);
  assert.equal("overallIndex" in result, false);
  assert.equal("scores" in result, false);
  assert.equal("primaryConstraint" in result, false);
});

test("preserves a useful low-signal result without declaring sufficient capacity", () => {
  const values = input(1);
  values.responses["behavior-priority-tradeoffs"] = 5;
  values.responses["behavior-authority-practice"] = 5;
  values.responses["behavior-information-timing"] = 5;
  values.responses["behavior-resource-fit"] = 5;
  const result = createCapacitySignalAssessment(values, { id: "low-signal" });

  assert.deepEqual(result.frictionPatterns, []);
  assert.deepEqual(result.compensationPatterns, []);
  assert.deepEqual(result.operatingSignals, []);
  assert.match(result.diagnosticNeed, /did not surface a pronounced pattern/);
  assert.doesNotMatch(JSON.stringify(result), /sufficient capacity/i);
});

test("rejects incomplete responses and unsupported context", () => {
  const incomplete = input();
  delete incomplete.responses[questionnaire.items[0].id];
  assert.throws(() => createCapacitySignalAssessment(incomplete), /Answer all 18/);

  const unsupported = input();
  unsupported.context.demandSource = "leadership";
  assert.throws(() => createCapacitySignalAssessment(unsupported), /Select what is changing/);

  const extra = input();
  extra.responses.secret = 5;
  assert.throws(() => createCapacitySignalAssessment(extra), /unsupported fields/);
});

test("accepts focused customer-retention and performance-recovery demand drivers", () => {
  for (const demandSource of ["customer-retention-experience", "performance-recovery"]) {
    const values = input();
    values.context.demandSource = demandSource;
    assert.equal(createCapacitySignalAssessment(values).context.demandSource, demandSource);
  }
});

test("policy forbids the conventional assessment outputs", () => {
  assert.equal(capacitySignalAssessmentPolicy.capacityScoreProduced, false);
  assert.equal(capacitySignalAssessmentPolicy.mechanismScoresProduced, false);
  assert.equal(capacitySignalAssessmentPolicy.constraintDeclared, false);
  assert.equal(capacitySignalAssessmentPolicy.interventionPrescribed, false);
  assert.equal(capacitySignalAssessmentPolicy.legacyComparisonAllowed, false);
});

test("machine-readable v2 assessment contract matches the engine", async () => {
  const contract = JSON.parse(await (await import("node:fs/promises")).readFile(new URL("../schemas/capacity-signal-assessment.json", import.meta.url), "utf8"));
  assert.equal(contract.assessmentVersion, CAPACITY_SIGNAL_ASSESSMENT_VERSION);
  assert.equal(contract.itemCount, capacitySignalAssessmentPolicy.itemCount);
  assert.deepEqual(contract.lenses, capacitySignalAssessmentPolicy.lenses);
  assert.ok(contract.prohibitedOutputs.includes("mechanismScores"));
  assert.equal(contract.legacyComparisonAllowed, false);
});
