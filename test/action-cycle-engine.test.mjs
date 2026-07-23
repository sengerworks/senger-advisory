import test from "node:test";
import assert from "node:assert/strict";
import { actionCycleState, createActionCycle, updateActionCycle } from "../action-cycle-engine.js";

const now = new Date("2026-07-23T12:00:00.000Z");
const values = {
  constraintDomainId: "decisions",
  hypothesis: "If decision rights are explicit, routine approvals should move faster.",
  commitment: "Publish decision owners and thresholds for the three highest-volume approvals.",
  evidenceMeasureId: "decisionPace",
  evidenceDescription: "Median elapsed time for the three approval types.",
  reviewDate: "2026-08-23",
  status: "active"
};

test("creates a bounded, versioned action hypothesis", () => {
  const cycle = createActionCycle(values, {
    now,
    id: "123e4567-e89b-42d3-a456-426614174000"
  });
  assert.equal(cycle.actionCycleVersion, "1.0.0");
  assert.equal(cycle.constraintDomainId, "decisions");
  assert.equal(cycle.status, "active");
  assert.equal(cycle.closedAt, null);
});

test("rejects missing content, invalid domains, and past review dates", () => {
  assert.throws(() => createActionCycle({ ...values, hypothesis: "" }, { now }), /hypothesis/);
  assert.throws(() => createActionCycle({ ...values, constraintDomainId: "finance" }, { now }), /constraint/);
  assert.throws(() => createActionCycle({ ...values, reviewDate: "2026-07-22" }, { now }), /past/);
});

test("closes and reopens a cycle with explicit timestamps", () => {
  const cycle = createActionCycle(values, { now, id: "123e4567-e89b-42d3-a456-426614174000" });
  const completed = updateActionCycle(cycle, { status: "completed", reviewNote: "Approval time fell; continue observing." }, { now: new Date("2026-08-23T12:00:00.000Z") });
  assert.equal(completed.status, "completed");
  assert.equal(completed.closedAt, "2026-08-23T12:00:00.000Z");
  assert.equal(actionCycleState(completed, now), "closed");
  const reopened = updateActionCycle(completed, { status: "active", reviewNote: "Reopened for another cycle." }, { now: new Date("2026-08-24T12:00:00.000Z") });
  assert.equal(reopened.closedAt, null);
});

test("identifies upcoming, due, and overdue reviews without judging results", () => {
  const cycle = createActionCycle(values, { now, id: "123e4567-e89b-42d3-a456-426614174000" });
  assert.equal(actionCycleState(cycle, new Date("2026-08-22T12:00:00.000Z")), "active");
  assert.equal(actionCycleState(cycle, new Date("2026-08-23T12:00:00.000Z")), "due");
  assert.equal(actionCycleState(cycle, new Date("2026-08-24T12:00:00.000Z")), "overdue");
});
