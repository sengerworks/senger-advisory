import { actionCycleState } from "./action-cycle-engine.js";

export function profileJourney(profile, now = new Date()) {
  const assessment = profile.assessmentInstances.at(-1);
  const cycles = profile.actionCycles || [];
  const currentAction = [...cycles].reverse().find(cycle => !["completed", "stopped"].includes(cycle.status))
    || cycles.at(-1)
    || null;
  const latestOutcome = profile.outcomeSnapshots.at(-1) || null;
  return {
    currentFocus: {
      constraintDomainIds: assessment.primaryConstraintIds,
      action: currentAction,
      actionState: currentAction ? actionCycleState(currentAction, now) : "not-started",
      latestOutcome,
      nextStep: !currentAction
        ? "Define an action hypothesis"
        : !latestOutcome
          ? "Capture an operating observation"
          : profile.assessmentInstances.length < 2
            ? "Reassess after the review window"
            : "Review the latest evidence"
    },
    steps: [
      { id: "diagnose", label: "Diagnose", state: "complete", detail: `${profile.assessmentInstances.length} capacity observation${profile.assessmentInstances.length === 1 ? "" : "s"}` },
      { id: "prioritize", label: "Prioritize", state: "complete", detail: `${assessment.primaryConstraintIds.length} current constraint signal${assessment.primaryConstraintIds.length === 1 ? "" : "s"}` },
      { id: "act", label: "Act", state: currentAction ? "complete" : "next", detail: currentAction ? `${currentAction.status} action cycle` : "Define an action cycle" },
      { id: "observe", label: "Observe", state: latestOutcome ? "complete" : currentAction ? "next" : "pending", detail: latestOutcome ? `${profile.outcomeSnapshots.length} operating observation${profile.outcomeSnapshots.length === 1 ? "" : "s"}` : "Capture operating evidence" },
      { id: "reassess", label: "Reassess", state: profile.assessmentInstances.length > 1 ? "complete" : latestOutcome ? "next" : "pending", detail: profile.assessmentInstances.length > 1 ? `${profile.assessmentInstances.length - 1} follow-up${profile.assessmentInstances.length === 2 ? "" : "s"}` : "Repeat the assessment" }
    ]
  };
}
