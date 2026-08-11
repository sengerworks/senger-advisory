import { acceptPerspectiveGap, approveDiagnosticContextBrief, approveParticipantPlan, createDiagnosticContextBrief, createParticipantPlan, evaluatePerspectiveCoverage } from "./diagnostic-discovery-engine.js";

const root = document.querySelector("[data-diagnostic-process]");
const panels = [...root.querySelectorAll("[data-process-panel]")];
const steps = [...root.querySelectorAll("[data-process-step]")];
const contextForm = root.querySelector("[data-context-form]");
const participantForm = root.querySelector("[data-participant-form]");
const defaults = [
  ["enterprise", "strategy", "executive-leadership"],
  ["functional", "coordination", "operations"],
  ["operational", "delivery", "commercial"],
  ["functional", "coordination", "people"],
  ["functional", "coordination", "technology"]
];
const options = {
  leadershipLevel: [["enterprise", "Enterprise"], ["functional", "Functional"], ["operational", "Operational"], ["frontline", "Frontline"]],
  executionProximity: [["strategy", "Strategy"], ["coordination", "Coordination"], ["delivery", "Delivery"]],
  functionalLens: [["executive-leadership", "Executive leadership"], ["operations", "Operations"], ["people", "People"], ["finance", "Finance"], ["commercial", "Commercial"], ["product-service", "Product or service"], ["technology", "Technology"], ["frontline-delivery", "Frontline delivery"]]
};
let contextBrief = null;
let participantPlan = null;

function select(name, choices, selected) {
  return `<label><span>${name.replace(/([A-Z])/g, " $1")}</span><select name="${name}">${choices.map(([value, label]) => `<option value="${value}"${value === selected ? " selected" : ""}>${label}</option>`).join("")}</select></label>`;
}

root.querySelector("[data-participant-table]").innerHTML = `<div class="participant-row participant-row-heading" aria-hidden="true"><span>Perspective</span><span>Leadership level</span><span>Execution proximity</span><span>Functional lens</span></div>${defaults.map((values, index) => `<div class="participant-row" data-participant-row><strong>Perspective ${String(index + 1).padStart(2, "0")}</strong>${select("leadershipLevel", options.leadershipLevel, values[0])}${select("executionProximity", options.executionProximity, values[1])}${select("functionalLens", options.functionalLens, values[2])}</div>`).join("")}`;

function showStep(stepName) {
  panels.forEach(panel => { panel.hidden = panel.dataset.processPanel !== stepName; });
  steps.forEach(step => step.dataset.processStep === stepName ? step.setAttribute("aria-current", "step") : step.removeAttribute("aria-current"));
  root.scrollIntoView({ behavior: "smooth", block: "start" });
}
function unlock(stepName) { const step = steps.find(item => item.dataset.processStep === stepName); if (step) step.disabled = false; }
steps.forEach(step => step.addEventListener("click", () => { if (!step.disabled) showStep(step.dataset.processStep); }));

contextForm.addEventListener("submit", event => {
  event.preventDefault();
  const data = new FormData(contextForm);
  try {
    contextBrief = createDiagnosticContextBrief({ diagnosticId: "fictional-diagnostic", organizationSizeBand: data.get("organizationSizeBand"), sponsorPerspective: data.get("sponsorPerspective"), sponsorRoleTitle: "Executive sponsor", sponsorOrganizationalLevel: "enterprise", sponsorFunction: "enterprise-leadership", sponsorResponsibility: "Enterprise execution and the leadership decision framed in this walkthrough.", diagnosticScopeType: "cross-functional-system", diagnosticScopeName: "The priority execution system", diagnosticScopeBoundary: "The teams and work directly responsible for the stated strategic priority.", crossBoundaryDependencies: "The handoffs, decisions, information, and resources required across functions.", guidanceSessionScheduledFor: new Date(Date.now() + 86400000).toISOString(), guidanceSessionAcknowledged: true, organizationContext: data.get("organizationContext"), strategicPriority: data.get("strategicPriority"), triggeringConcern: data.get("triggeringConcern"), decisionsAtRisk: data.get("decisionsAtRisk"), recentChanges: data.get("recentChange")?.trim() ? [data.get("recentChange")] : [], priorInterventions: data.get("priorIntervention")?.trim() ? [data.get("priorIntervention")] : [], knownSensitivities: data.get("knownSensitivities"), decisionNeeded: data.get("decisionNeeded") }, { id: "fictional-context" });
    contextBrief = approveDiagnosticContextBrief(contextBrief, { approvalNote: "Sponsor approved this fictional context." });
    root.querySelector("[data-context-decision]").textContent = contextBrief.decisionNeeded;
    root.querySelector("[data-context-priority]").textContent = contextBrief.strategicPriority;
    root.querySelector("[data-context-concern]").textContent = contextBrief.triggeringConcern;
    root.querySelector("[data-context-risk]").textContent = contextBrief.decisionsAtRisk;
    root.querySelector("[data-approved-context]").hidden = false;
    contextForm.hidden = true;
    root.querySelector("[data-context-status]").textContent = "";
    unlock("participants");
  } catch (error) { root.querySelector("[data-context-status]").textContent = error.message; }
});
root.querySelector("[data-continue-participants]").addEventListener("click", () => showStep("participants"));

function slots() { return [...root.querySelectorAll("[data-participant-row]")].map((row, index) => ({ slotId: `fictional-slot-${index + 1}`, leadershipLevel: row.querySelector('[name="leadershipLevel"]').value, executionProximity: row.querySelector('[name="executionProximity"]').value, functionalLens: row.querySelector('[name="functionalLens"]').value })); }
function renderCoverage() {
  const coverage = evaluatePerspectiveCoverage(participantPlan);
  root.querySelector("[data-coverage-result]").hidden = false;
  root.querySelector("[data-coverage-ready]").hidden = coverage.unresolved.length > 0;
  root.querySelector("[data-coverage-gaps]").hidden = coverage.unresolved.length === 0;
  root.querySelector("[data-gap-list]").innerHTML = coverage.unresolved.map(gap => `<li>${gap.replace(":", " · ").replaceAll("-", " ")}</li>`).join("");
}
participantForm.addEventListener("submit", event => {
  event.preventDefault();
  try {
    participantPlan = createParticipantPlan({ diagnosticId: "fictional-diagnostic", targetLeadershipLevels: ["enterprise", "functional", "operational"], targetExecutionProximities: ["strategy", "coordination", "delivery"], targetFunctionalLenses: ["executive-leadership", "operations", "commercial", "people", "technology"], participantSlots: slots() }, { id: "fictional-plan" });
    root.querySelector("[data-participant-status]").textContent = "";
    renderCoverage();
  } catch (error) { root.querySelector("[data-participant-status]").textContent = error.message; }
});
root.querySelector("[data-accept-gaps]").addEventListener("click", () => { for (const gapId of evaluatePerspectiveCoverage(participantPlan).unresolved) participantPlan = acceptPerspectiveGap(participantPlan, { gapId, reason: "The fictional sponsor accepts this POC limitation and preserves it as a diagnostic blind spot." }); renderCoverage(); });
root.querySelector("[data-approve-plan]").addEventListener("click", () => { participantPlan = approveParticipantPlan(participantPlan, { approvalNote: "Fictional plan approved." }); root.querySelector("[data-ready-count]").textContent = `${participantPlan.participantSlots.length} slots`; unlock("ready"); showStep("ready"); });
root.querySelector("[data-restart-process]").addEventListener("click", () => location.reload());
