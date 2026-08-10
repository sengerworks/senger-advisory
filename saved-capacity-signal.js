import { decryptSavedProfile, recoveryCredentialsFromUrl } from "./saved-results-crypto.js?v=capacity-signal-v2";
import { readPrivateResult } from "./private-results-api.js";

const app = document.querySelector("[data-saved-signal-app]");
if (app) {
  const demandSourceCopy = {
    "growth-scale": ["Growth or scale", "Growth is increasing the volume and complexity the organization must carry without losing execution quality."],
    "customer-retention-experience": ["Customer retention or experience", "Customer pressure raises the urgency of improving execution without creating additional disruption for the people delivering it."],
    "performance-recovery": ["Performance recovery", "A deteriorating result increases the urgency of restoring execution while distinguishing symptoms from the underlying operating condition."],
    "strategic-ambition": ["Strategic ambition", "The organization is being asked to translate a consequential ambition into coordinated execution."],
    "organizational-change": ["Organizational change", "Change is increasing the load on the operating system while roles, routines, and expectations are shifting."],
    "technology-ai": ["Technology or AI", "Technology change is creating new execution demands across decisions, workflows, capabilities, and adoption."],
    "acquisition-reorganization": ["Acquisition or reorganization", "Structural change is increasing interdependence while authority, information, and coordination are being reconfigured."],
    "regulation-environment": ["Regulation or external environment", "External conditions are increasing the speed, precision, or resilience required from the organization."],
    "operating-model-complexity": ["Operating-model complexity", "The operating model must carry greater interdependence without allowing coordination cost to overwhelm execution."],
    other: ["Another source", "A consequential change is increasing what the organization must be able to carry."]
  };
  const timeHorizonCopy = { now: "Now", "next-90-days": "Next 90 days", "next-12-months": "Next 12 months", "beyond-12-months": "Beyond 12 months" };
  const status = app.querySelector("[data-saved-signal-status]");
  const brief = app.querySelector("[data-saved-signal-brief]");
  const get = name => app.querySelector(`[data-saved-signal-${name}]`);
  const escapeHtml = value => String(value).replace(/[&<>\"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);
  const patterns = (values, empty) => values.length ? values.map(value => `<article><span>${escapeHtml(value.evidenceLevel)}</span><p>${escapeHtml(value.statement)}</p></article>`).join("") : `<p class="signal-empty">${escapeHtml(empty)}</p>`;

  try {
    const credentials = await recoveryCredentialsFromUrl(location.href);
    const stored = await readPrivateResult(credentials);
    const restored = await decryptSavedProfile(stored.envelope, location.href);
    if (restored.profile.schemaVersion !== "2.0.0" || !Array.isArray(restored.profile.signalInstances)) throw new Error("This recovery link belongs to a different saved-result version.");
    const result = restored.profile.signalInstances.at(-1);
    get("date").textContent = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" }).format(new Date(result.completedAt));
    get("priority").textContent = result.context.executionPriority;
    const driverCopy = demandSourceCopy[result.context.demandSource] || demandSourceCopy.other;
    get("driver").textContent = driverCopy[0];
    get("horizon").textContent = timeHorizonCopy[result.context.timeHorizon] || result.context.timeHorizon.replaceAll("-", " ");
    get("driver-meaning").textContent = driverCopy[1];
    get("demand").innerHTML = `<span>Execution-demand signal</span><strong>${escapeHtml(result.executionDemand.evidenceLevel)}</strong><p>${result.executionDemand.dimensionsObserved.length ? `Pronounced change appears in ${escapeHtml(result.executionDemand.dimensionsObserved.join(", ").replaceAll("-", " "))}.` : "No individual complexity dimension was consistently pronounced from this perspective."}</p>`;
    get("friction").innerHTML = patterns(result.frictionPatterns, "No pronounced friction pattern surfaced from this perspective.");
    get("compensation").innerHTML = patterns(result.compensationPatterns, "No pronounced compensation pattern surfaced from this perspective.");
    get("operating").innerHTML = patterns(result.operatingSignals, "No pronounced formal-versus-lived gap surfaced from this perspective.");
    get("questions").innerHTML = result.questionsRaised.map(value => `<li>${escapeHtml(value)}</li>`).join("");
    get("alternatives").innerHTML = result.alternativeExplanations.map(value => `<li>${escapeHtml(value)}</li>`).join("");
    get("boundary").textContent = result.boundary;
    get("risk-act").textContent = "Treating the visible pattern as the cause may reinforce the workarounds already carrying execution or shift pressure elsewhere in the system.";
    get("risk-wait").textContent = "If these signals persist, coordination demands and reliance on a small number of people may continue to increase.";
    get("action").textContent = result.boundedFirstAction;
    get("diagnostic").textContent = result.diagnosticNeed;
    status.hidden = true;
    brief.hidden = false;
  } catch (error) {
    status.textContent = error.message || "This encrypted Capacity Signal Brief could not be opened.";
  }

  get("print")?.addEventListener("click", () => window.print());
}
