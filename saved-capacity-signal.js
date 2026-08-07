import { decryptSavedProfile, recoveryCredentialsFromUrl } from "./saved-results-crypto.js?v=capacity-signal-v2";
import { readPrivateResult } from "./private-results-api.js";

const app = document.querySelector("[data-saved-signal-app]");
if (app) {
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
    get("context").textContent = `${result.context.demandSource.replaceAll("-", " ")} · ${result.context.timeHorizon.replaceAll("-", " ")}`;
    get("demand").innerHTML = `<span>Execution-demand signal</span><strong>${escapeHtml(result.executionDemand.evidenceLevel)}</strong><p>${result.executionDemand.dimensionsObserved.length ? `Pronounced change appears in ${escapeHtml(result.executionDemand.dimensionsObserved.join(", ").replaceAll("-", " "))}.` : "No individual complexity dimension was consistently pronounced from this perspective."}</p>`;
    get("friction").innerHTML = patterns(result.frictionPatterns, "No pronounced friction pattern surfaced from this perspective.");
    get("compensation").innerHTML = patterns(result.compensationPatterns, "No pronounced compensation pattern surfaced from this perspective.");
    get("operating").innerHTML = patterns(result.operatingSignals, "No pronounced formal-versus-lived gap surfaced from this perspective.");
    get("questions").innerHTML = result.questionsRaised.map(value => `<li>${escapeHtml(value)}</li>`).join("");
    get("alternatives").innerHTML = result.alternativeExplanations.map(value => `<li>${escapeHtml(value)}</li>`).join("");
    get("boundary").textContent = result.boundary;
    get("action").textContent = result.boundedFirstAction;
    get("diagnostic").textContent = result.diagnosticNeed;
    status.hidden = true;
    brief.hidden = false;
  } catch (error) {
    status.textContent = error.message || "This encrypted Capacity Signal Brief could not be opened.";
  }

  get("print")?.addEventListener("click", () => window.print());
}
