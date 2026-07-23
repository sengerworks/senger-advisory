import test from "node:test";
import assert from "node:assert/strict";
import {
  OUTCOME_MEASURE_VERSION,
  anchorFor,
  compareOutcomeSnapshots,
  createOutcomeSnapshot,
  outcomeComparisonForProfile
} from "../outcome-engine.js";

const values = {
  observationWindow: "30-days",
  decisionPace: 3,
  leadershipEscalationLoad: 3,
  crossFunctionalCoordinationLoad: 3,
  executionReliability: 3,
  changeAbsorption: 3,
  evidenceSource: "self-report"
};

const uuid = () => "123e4567-e89b-42d3-a456-426614174000";

test("creates a versioned outcome snapshot from all five observations", () => {
  const snapshot = createOutcomeSnapshot(values, { now: new Date("2026-07-23T12:00:00.000Z"), uuid });
  assert.equal(snapshot.outcomeMeasureVersion, OUTCOME_MEASURE_VERSION);
  assert.equal(snapshot.outcomeSnapshotId, uuid());
  assert.equal(snapshot.decisionPace, 3);
  assert.equal(snapshot.evidenceSource, "self-report");
});

test("rejects incomplete scores, windows, and evidence sources", () => {
  assert.throws(() => createOutcomeSnapshot({ ...values, decisionPace: "" }, { uuid }), /Rate every/);
  assert.throws(() => createOutcomeSnapshot({ ...values, observationWindow: "forever" }, { uuid }), /window/);
  assert.throws(() => createOutcomeSnapshot({ ...values, evidenceSource: "unknown" }, { uuid }), /evidence/);
});

test("compares ordinal movement without creating a composite score", () => {
  const baseline = createOutcomeSnapshot(values, { now: new Date("2026-01-01T12:00:00.000Z"), uuid });
  const current = createOutcomeSnapshot({ ...values, decisionPace: 5, changeAbsorption: 2 }, {
    now: new Date("2026-04-01T12:00:00.000Z"),
    uuid
  });
  const comparison = compareOutcomeSnapshots(baseline, current);
  assert.equal(comparison.policy, "ordinal-movement");
  assert.equal(comparison.elapsedDays, 90);
  assert.equal(comparison.movements.decisionPace, 2);
  assert.equal(comparison.movements.changeAbsorption, -1);
  assert.equal("overall" in comparison, false);
});

test("suppresses movement across outcome measure versions", () => {
  const baseline = createOutcomeSnapshot(values, { uuid });
  const current = { ...baseline, outcomeMeasureVersion: "2.0.0" };
  const comparison = compareOutcomeSnapshots(baseline, current);
  assert.equal(comparison.policy, "side-by-side-only");
  assert.equal("movements" in comparison, false);
});

test("compares the first and latest snapshots and exposes behavioral anchors", () => {
  const first = createOutcomeSnapshot(values, { now: new Date("2026-01-01T12:00:00.000Z"), uuid });
  const middle = createOutcomeSnapshot({ ...values, decisionPace: 4 }, { now: new Date("2026-02-01T12:00:00.000Z"), uuid });
  const latest = createOutcomeSnapshot({ ...values, decisionPace: 5 }, { now: new Date("2026-03-01T12:00:00.000Z"), uuid });
  assert.equal(outcomeComparisonForProfile({ outcomeSnapshots: [first, middle, latest] }).movements.decisionPace, 2);
  assert.match(anchorFor("decisionPace", 5), /consistently/);
});
