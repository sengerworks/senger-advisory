export const OUTCOME_MEASURE_VERSION = "1.0.0";

export const outcomeMeasures = Object.freeze([
  {
    id: "decisionPace",
    name: "Decision pace",
    prompt: "Important decisions are completed at the pace execution requires.",
    anchors: [
      "Decisions routinely remain open long enough to delay execution.",
      "Important decisions are often completed after work needs them.",
      "Decision pace is mixed; some choices keep up and others create delay.",
      "Important decisions are usually completed before they constrain execution.",
      "Decision timing consistently supports execution without avoidable waiting."
    ]
  },
  {
    id: "leadershipEscalationLoad",
    name: "Leadership escalation load",
    prompt: "Routine ambiguity is resolved without depending on senior leaders.",
    anchors: [
      "Routine ambiguity regularly depends on senior leaders to move.",
      "Senior leaders are often pulled into issues that should resolve elsewhere.",
      "Escalation load is mixed and varies by team or situation.",
      "Routine ambiguity usually resolves before reaching senior leaders.",
      "Senior attention is rarely required for routine ambiguity."
    ]
  },
  {
    id: "crossFunctionalCoordinationLoad",
    name: "Cross-functional coordination load",
    prompt: "Cross-functional work advances without disproportionate coordination effort.",
    anchors: [
      "Cross-functional work depends on persistent meetings, translation, or rescue.",
      "Coordination effort often exceeds the value of the work it enables.",
      "Coordination load is mixed across initiatives and organizational boundaries.",
      "Cross-functional work usually advances with proportionate coordination.",
      "Cross-functional work advances reliably with minimal avoidable coordination."
    ]
  },
  {
    id: "executionReliability",
    name: "Execution reliability",
    prompt: "Priority commitments are delivered without avoidable delay, reversal, or rescue.",
    anchors: [
      "Priority commitments routinely require delay, reversal, or rescue.",
      "Execution frequently depends on intervention to recover commitments.",
      "Reliability is mixed; delivery varies across priorities.",
      "Priority commitments are usually delivered without avoidable recovery work.",
      "Priority commitments are delivered consistently with little avoidable rescue."
    ]
  },
  {
    id: "changeAbsorption",
    name: "Change absorption",
    prompt: "The organization adapts without overwhelming ongoing execution.",
    anchors: [
      "Change regularly overwhelms ongoing work and destabilizes execution.",
      "Adaptation often creates substantial disruption or accumulated fatigue.",
      "The organization absorbs some changes well and struggles with others.",
      "The organization usually adapts while sustaining ongoing execution.",
      "The organization consistently absorbs change without destabilizing execution."
    ]
  }
]);

function validScore(value) {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

export function createOutcomeSnapshot(values, options = {}) {
  const now = options.now instanceof Date ? options.now : new Date(options.now || Date.now());
  const uuid = options.uuid || globalThis.crypto?.randomUUID?.bind(globalThis.crypto);
  if (!Number.isFinite(now.getTime()) || typeof uuid !== "function") throw new Error("Outcome snapshot could not be created.");
  if (!["30-days", "90-days"].includes(values.observationWindow)) throw new Error("Select an observation window.");
  if (!["self-report", "operating-measure", "mixed"].includes(values.evidenceSource)) throw new Error("Select the evidence used for this snapshot.");
  const scores = Object.fromEntries(outcomeMeasures.map(measure => [measure.id, Number(values[measure.id])]));
  if (!Object.values(scores).every(validScore)) throw new Error("Rate every operating observation.");
  return {
    outcomeSnapshotId: uuid(),
    observedAt: now.toISOString(),
    outcomeMeasureVersion: OUTCOME_MEASURE_VERSION,
    observationWindow: values.observationWindow,
    ...scores,
    evidenceSource: values.evidenceSource
  };
}

export function compareOutcomeSnapshots(baseline, current) {
  if (!baseline || !current) return { policy: "unavailable" };
  const elapsedDays = Math.max(0, Math.round((Date.parse(current.observedAt) - Date.parse(baseline.observedAt)) / 86400000));
  if (baseline.outcomeMeasureVersion !== current.outcomeMeasureVersion) {
    return {
      policy: "side-by-side-only",
      baseline,
      current,
      elapsedDays,
      reason: "The outcome measure changed, so ordinal movement is not shown."
    };
  }
  return {
    policy: "ordinal-movement",
    baseline,
    current,
    elapsedDays,
    movements: Object.fromEntries(outcomeMeasures.map(measure => [
      measure.id,
      current[measure.id] - baseline[measure.id]
    ]))
  };
}

export function outcomeComparisonForProfile(profile) {
  if (!profile?.outcomeSnapshots || profile.outcomeSnapshots.length < 2) return { policy: "unavailable" };
  return compareOutcomeSnapshots(profile.outcomeSnapshots[0], profile.outcomeSnapshots.at(-1));
}

export function anchorFor(measureId, value) {
  const measure = outcomeMeasures.find(item => item.id === measureId);
  return measure && validScore(value) ? measure.anchors[value - 1] : "";
}
