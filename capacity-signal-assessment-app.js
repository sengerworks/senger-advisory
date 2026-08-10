import {
  capacitySignalQuestionnaire,
  createCapacitySignalAssessment
} from "./capacity-signal-assessment-engine.js?v=capacity-signal-v6";
import { encryptSavedProfile } from "./saved-results-crypto.js?v=capacity-signal-v2";
import { createPrivateResult, privateResultsEnvironment } from "./private-results-api.js";

(() => {
  const parameters = new URLSearchParams(location.search);
  if (parameters.has("workspaceRound") || location.hash.startsWith("#recovery=v1.")) return;

  const main = document.querySelector("main.assessment-page");
  if (!main) return;

  const questionnaire = capacitySignalQuestionnaire();
  const lensOrder = ["execution-demand", "friction", "capacity-compensation", "formal-lived-signal"];
  const lensCopy = {
    "execution-demand": {
      eyebrow: "01 · Execution demand",
      title: "What is the organization being asked to carry?",
      description: "Notice how the volume, variety, interdependence, uncertainty, and pace of demand are changing."
    },
    friction: {
      eyebrow: "02 · Friction",
      title: "Where is execution becoming disproportionately harder?",
      description: "These are observable signals. They do not, by themselves, reveal the underlying constraint."
    },
    "capacity-compensation": {
      eyebrow: "03 · Capacity Compensation",
      title: "Where are people carrying what the system cannot?",
      description: "Strong performance can conceal strain when meetings, escalation, workarounds, or extraordinary effort preserve results."
    },
    "formal-lived-signal": {
      eyebrow: "04 · Formal and lived system",
      title: "Does the operating system work in practice?",
      description: "Formal roles and processes matter only if people can use them as intended."
    }
  };

  main.innerHTML = `
    <section class="assessment-intro signal-assessment-intro">
      <div>
        <p class="eyebrow">Free Capacity Signal Assessment</p>
        <h1>See what your organization may be carrying beneath the surface.</h1>
        <p class="page-lede">In about five minutes, identify possible execution demand, friction, and Capacity Compensation. You will receive a Capacity Signal Brief—not a score or diagnosis.</p>
      </div>
      <aside class="assessment-expectation" aria-label="Assessment details">
        <span>18 observable signals</span><span>4 evidence lenses</span><span>About 5 minutes</span>
        <a href="diagnostic.html">How the Diagnostic goes deeper</a>
      </aside>
    </section>

    <section class="assessment-shell capacity-signal-shell" data-capacity-signal-app>
      <div class="assessment-progress" aria-label="Assessment progress">
        <div class="assessment-progress-copy"><span data-signal-progress-label>Context</span><strong data-signal-progress-name>Capacity for what?</strong></div>
        <div class="assessment-progress-track" aria-hidden="true"><span data-signal-progress-bar></span></div>
      </div>

      <form class="assessment-form" data-signal-form novalidate>
        <section class="signal-context" data-signal-context>
          <div class="report-section-heading"><p class="eyebrow">Capacity for what?</p><h2>Begin with the execution demand.</h2><p>Capacity is relational. The result only becomes meaningful when it is anchored to what the organization must accomplish.</p></div>
          <div class="signal-context-grid">
            <label class="signal-priority-field"><span class="signal-field-title">What must the organization execute?</span><span>Describe one consequential priority, change, or outcome. Focus on what must become true—not every issue surrounding it.</span><textarea name="executionPriority" minlength="40" maxlength="500" rows="6" required placeholder="For example: Integrate a newly acquired business without disrupting customer delivery or losing critical talent."></textarea></label>
            <div class="signal-context-selects">
              <div class="signal-context-selects-heading"><h3>Define the demand</h3><p>Two selections are required. The others simply sharpen the context.</p></div>
              <label><span>What is changing the demand?</span>
                <select name="demandSource" required>
                  <option value="">Choose driver</option><option value="growth-scale">Growth or scale</option><option value="customer-retention-experience">Customer retention or experience</option><option value="performance-recovery">Performance recovery</option><option value="strategic-ambition">Strategic ambition</option><option value="organizational-change">Organizational change</option><option value="technology-ai">Technology or AI</option><option value="acquisition-reorganization">Acquisition or reorganization</option><option value="regulation-environment">Regulation or external environment</option><option value="operating-model-complexity">Operating-model complexity</option><option value="other">Another source</option>
                </select>
              </label>
              <label><span>Time horizon</span>
                <select name="timeHorizon" required><option value="">Choose horizon</option><option value="now">Now</option><option value="next-90-days">Next 90 days</option><option value="next-12-months">Next 12 months</option><option value="beyond-12-months">Beyond 12 months</option></select>
              </label>
              <label><span>Organization size <small>Optional</small></span>
                <select name="organizationSize"><option value="">Choose size</option><option>Fewer than 25 people</option><option>25–49 people</option><option>50–149 people</option><option>150–399 people</option><option>400 or more people</option></select>
              </label>
              <label><span>Your perspective <small>Optional</small></span>
                <select name="respondentRole"><option value="">Choose perspective</option><option>CEO or founder</option><option>Executive leader</option><option>Functional leader</option><option>People or operations leader</option><option>Advisor or board member</option></select>
              </label>
            </div>
          </div>
        </section>

        <fieldset class="signal-question-panel" data-signal-question-panel hidden><legend data-signal-lens-title></legend><p class="assessment-domain-description" data-signal-lens-description></p><div data-signal-questions></div></fieldset>
        <p class="assessment-error" data-signal-error role="alert" hidden></p>
        <div class="assessment-controls"><button class="button secondary" type="button" data-signal-previous disabled>Previous</button><button class="button primary" type="button" data-signal-next>Begin the assessment</button></div>
      </form>

      <section class="assessment-results capacity-signal-results" data-signal-results hidden tabindex="-1">
        <div class="report-masthead"><span>Senger Advisory</span><div><strong>Capacity Signal Brief</strong><span data-signal-report-date></span></div></div>
        <div class="signal-result-hero"><p class="eyebrow">Capacity for what?</p><h2 data-signal-priority></h2><p data-signal-context-summary></p></div>
        <div class="signal-level" data-signal-demand-level></div>

        <section class="report-section"><div class="report-section-heading"><p class="eyebrow">What may be happening</p><h3>Signals visible from your perspective.</h3><p>These patterns describe what may be occurring. They do not identify the cause.</p></div><div class="signal-pattern-columns"><div><h4>Friction</h4><div data-signal-friction></div></div><div><h4>Capacity Compensation</h4><div data-signal-compensation></div></div><div><h4>Formal versus lived system</h4><div data-signal-operating></div></div></div></section>

        <section class="report-section"><div class="report-section-heading"><p class="eyebrow">Questions the evidence raises</p><h3>Where the operating system needs investigation.</h3><p>The five mechanisms organize inquiry. They are not five independent scores.</p></div><ol class="leadership-questions" data-signal-questions-raised></ol></section>

        <section class="report-section diagnostic-boundary"><div class="report-section-heading"><p class="eyebrow">Competing explanations</p><h3>Similar signals can have different causes.</h3></div><ul data-signal-alternatives></ul><p data-signal-boundary></p></section>

        <section class="report-section next-step-section"><div class="report-section-heading"><p class="eyebrow">Bounded first action</p><h3>Observe before prescribing.</h3></div><p data-signal-action></p></section>
        <section class="report-section"><div class="report-section-heading"><p class="eyebrow">What the Diagnostic adds</p><h3>Move from a signal to a defensible organizational finding.</h3></div><p data-signal-diagnostic-need></p></section>

        <section class="private-save-panel" aria-labelledby="signal-save-title">
          <div class="report-section-heading"><p class="eyebrow">Private Saved Brief</p><h3 id="signal-save-title">Keep this brief without creating an account.</h3><p>The brief is encrypted in this browser before storage. Senger Advisory receives only ciphertext and cannot recover the brief or recovery link.</p></div>
          <ul><li>Individual assessment responses are not included.</li><li>The recovery link is required to reopen the brief.</li><li>The encrypted brief expires 12 months after it is saved.</li><li>Legacy score-based profiles remain separate and are not comparable.</li></ul>
          <label class="private-save-acknowledgement"><input type="checkbox" data-signal-save-ack/><span>I understand that anyone with the recovery link can open this brief, and Senger Advisory cannot restore a lost link.</span></label>
          <div class="private-save-actions"><button class="button primary" type="button" data-signal-save disabled>Create private recovery link</button><p data-signal-save-status role="status" aria-live="polite"></p></div>
          <div class="private-save-result" data-signal-save-result hidden><label>Private recovery link<span>Copy and store this link somewhere safe.</span><div><input type="text" readonly autocomplete="off" spellcheck="false" data-signal-save-link/><button type="button" data-signal-copy>Copy</button></div></label><a class="button secondary" data-signal-open href="saved-capacity-signal.html">Open saved brief</a></div>
        </section>

        <p class="assessment-method-note">This brief is directional evidence from one perspective. It does not measure Organizational Capacity, identify a constrained mechanism, establish causality, benchmark the organization, or prescribe an intervention. Legacy six-domain assessments are not comparable with this version.</p>
        <div class="assessment-controls results-controls"><button class="button secondary" type="button" data-signal-retake>Retake assessment</button><button class="button secondary" type="button" data-signal-print>Save or print brief</button><a class="button primary" href="diagnostic.html">Explore the Diagnostic</a></div>
      </section>
    </section>`;

  const app = main.querySelector("[data-capacity-signal-app]");
  const form = app.querySelector("[data-signal-form]");
  const elements = Object.fromEntries([
    "context", "question-panel", "lens-title", "lens-description", "questions", "error", "previous", "next", "results", "report-date", "priority", "context-summary", "demand-level", "friction", "compensation", "operating", "questions-raised", "alternatives", "boundary", "action", "diagnostic-need", "retake", "print", "progress-label", "progress-name", "progress-bar", "save-ack", "save", "save-status", "save-result", "save-link", "copy", "open"
  ].map(name => [name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()), app.querySelector(`[data-signal-${name}]`)]));
  const responses = {};
  let step = -1;
  let lastResult = null;
  let saved = false;

  const escapeHtml = value => String(value).replace(/[&<>\"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);

  function itemsForStep() { return questionnaire.items.filter(item => item.lens === lensOrder[step]); }

  function renderStep(scroll = false) {
    const copy = lensCopy[lensOrder[step]];
    const items = itemsForStep();
    elements.context.hidden = true;
    elements.questionPanel.hidden = false;
    elements.lensTitle.textContent = copy.title;
    elements.lensDescription.textContent = copy.description;
    elements.progressLabel.textContent = copy.eyebrow;
    elements.progressName.textContent = copy.title;
    elements.progressBar.style.width = `${((step + 1) / lensOrder.length) * 100}%`;
    elements.previous.disabled = false;
    elements.next.textContent = step === lensOrder.length - 1 ? "Create my Capacity Signal Brief" : "Continue";
    elements.questions.innerHTML = items.map((item, index) => `<div class="assessment-question"><p><span>${index + 1}</span>${escapeHtml(item.prompt)}</p><div class="assessment-scale" role="radiogroup" aria-label="${escapeHtml(item.prompt)}">${questionnaire.responseScale.map(option => `<label><input type="radio" name="${item.id}" value="${option.value}" ${responses[item.id] === option.value ? "checked" : ""}/><span><strong>${option.value}</strong><small>${option.label}</small></span></label>`).join("")}</div></div>`).join("");
    elements.error.hidden = true;
    if (scroll) elements.questionPanel.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }

  function validContext() {
    const data = new FormData(form);
    const priority = String(data.get("executionPriority") || "").trim();
    if (!data.get("demandSource") || !data.get("timeHorizon") || priority.length < 40) {
      elements.error.textContent = "Select the demand source and time horizon, then describe what the organization must execute in at least 40 characters.";
      elements.error.hidden = false;
      return false;
    }
    return true;
  }

  function captureStep() {
    let complete = true;
    itemsForStep().forEach(item => {
      const input = form.querySelector(`input[name="${item.id}"]:checked`);
      if (!input) complete = false;
      else responses[item.id] = Number(input.value);
    });
    if (!complete) {
      elements.error.textContent = "Respond to every signal in this section before continuing.";
      elements.error.hidden = false;
    }
    return complete;
  }

  function contextValues() {
    const data = new FormData(form);
    return {
      demandSource: data.get("demandSource"), executionPriority: data.get("executionPriority"), timeHorizon: data.get("timeHorizon"), organizationSize: data.get("organizationSize"), respondentRole: data.get("respondentRole")
    };
  }

  function patternMarkup(patterns, empty) {
    return patterns.length ? patterns.map(pattern => `<article><span>${escapeHtml(pattern.evidenceLevel)}</span><p>${escapeHtml(pattern.statement)}</p></article>`).join("") : `<p class="signal-empty">${escapeHtml(empty)}</p>`;
  }

  function showResults() {
    const result = createCapacitySignalAssessment({ context: contextValues(), responses });
    lastResult = result;
    form.hidden = true;
    app.querySelector(".assessment-progress").hidden = true;
    elements.results.hidden = false;
    elements.reportDate.textContent = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" }).format(new Date(result.completedAt));
    elements.priority.textContent = result.context.executionPriority;
    elements.contextSummary.textContent = `${result.context.demandSource.replaceAll("-", " ")} · ${result.context.timeHorizon.replaceAll("-", " ")}`;
    elements.demandLevel.innerHTML = `<span>Execution-demand signal</span><strong>${escapeHtml(result.executionDemand.evidenceLevel)}</strong><p>${result.executionDemand.dimensionsObserved.length ? `Pronounced change appears in ${escapeHtml(result.executionDemand.dimensionsObserved.join(", ").replaceAll("-", " "))}.` : "No individual complexity dimension was consistently pronounced from this perspective."}</p>`;
    elements.friction.innerHTML = patternMarkup(result.frictionPatterns, "No pronounced friction pattern surfaced from this perspective.");
    elements.compensation.innerHTML = patternMarkup(result.compensationPatterns, "No pronounced compensation pattern surfaced from this perspective.");
    elements.operating.innerHTML = patternMarkup(result.operatingSignals, "No pronounced formal-versus-lived gap surfaced from this perspective.");
    elements.questionsRaised.innerHTML = (result.questionsRaised.length ? result.questionsRaised : ["What evidence would show whether the operating system can carry the stated execution demand as complexity changes?"]).map(question => `<li>${escapeHtml(question)}</li>`).join("");
    elements.alternatives.innerHTML = (result.alternativeExplanations.length ? result.alternativeExplanations : ["The presenting concern may not be an Organizational Capacity problem, or the available evidence may be insufficient."]).map(explanation => `<li>${escapeHtml(explanation)}</li>`).join("");
    elements.boundary.textContent = result.boundary;
    elements.action.textContent = result.boundedFirstAction;
    elements.diagnosticNeed.textContent = result.diagnosticNeed;
    elements.results.focus({ preventScroll: true });
    elements.results.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }

  elements.next.addEventListener("click", () => {
    if (step === -1) {
      if (!validContext()) return;
      step = 0;
      renderStep(true);
      return;
    }
    if (!captureStep()) return;
    if (step === lensOrder.length - 1) showResults();
    else { step += 1; renderStep(true); }
  });

  elements.previous.addEventListener("click", () => {
    if (step >= 0) captureStep();
    if (step <= 0) {
      step = -1;
      elements.context.hidden = false;
      elements.questionPanel.hidden = true;
      elements.progressLabel.textContent = "Context";
      elements.progressName.textContent = "Capacity for what?";
      elements.progressBar.style.width = "0%";
      elements.previous.disabled = true;
      elements.next.textContent = "Begin the assessment";
      elements.error.hidden = true;
    } else { step -= 1; renderStep(true); }
  });

  elements.retake.addEventListener("click", () => location.reload());
  elements.print.addEventListener("click", () => window.print());
  elements.saveAck.addEventListener("change", () => { elements.save.disabled = !elements.saveAck.checked || saved; });
  elements.save.addEventListener("click", async () => {
    if (!lastResult || !elements.saveAck.checked || saved) return;
    elements.save.disabled = true;
    elements.saveStatus.textContent = "Encrypting and saving your private brief…";
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 365 * 86400000);
      const profile = {
        schemaVersion: "2.0.0",
        profileId: crypto.randomUUID(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        displayLabel: `Capacity Signal Brief · ${new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(now)}`,
        signalInstances: [lastResult]
      };
      const recoveryBase = new URL("saved-capacity-signal.html", location.href).toString();
      const encrypted = await encryptSavedProfile(profile, { baseUrl: recoveryBase });
      await createPrivateResult(encrypted);
      elements.saveLink.value = encrypted.recoveryUrl;
      elements.open.href = encrypted.recoveryUrl;
      elements.saveResult.hidden = false;
      elements.saveStatus.textContent = privateResultsEnvironment.localDevelopment
        ? "Encrypted brief saved to this browser’s local development store."
        : "Encrypted brief saved. Copy the recovery link before leaving this page.";
      saved = true;
    } catch (error) {
      elements.save.disabled = false;
      elements.saveStatus.textContent = error.message || "We couldn’t save this encrypted brief.";
    }
  });
  elements.copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(elements.saveLink.value);
      elements.saveStatus.textContent = "Recovery link copied. Protect it like a password.";
    } catch {
      elements.saveLink.select();
      elements.saveStatus.textContent = "Copy was unavailable. The recovery link has been selected for manual copying.";
    }
  });
})();
