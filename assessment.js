(() => {
  "use strict";

  const app = document.querySelector("[data-assessment-app]");
  if (!app) return;

  const domains = [
    {
      id: "leadership",
      name: "Leadership",
      description: "How leaders create clarity, make tradeoffs, and prevent ambiguity from accumulating at the top.",
      interpretation: "Leadership capacity may be constrained when senior attention becomes the organization’s default routing mechanism for ambiguity.",
      questions: [
        "Leaders translate strategic priorities into clear tradeoffs.",
        "Leadership attention remains focused on decisions only leaders can make.",
        "Teams resolve routine ambiguity without escalating it upward."
      ]
    },
    {
      id: "decisions",
      name: "Decision Velocity",
      description: "How efficiently ambiguity becomes committed action at the appropriate level.",
      interpretation: "Decision capacity may be constrained when ownership is unclear, escalation is routine, or settled choices repeatedly reopen.",
      questions: [
        "The owner of an important decision is usually clear.",
        "Decisions are made at the appropriate level without unnecessary delay.",
        "Decisions remain stable unless meaningful new evidence emerges."
      ]
    },
    {
      id: "rhythm",
      name: "Operating Rhythm",
      description: "How recurring cadences convert priorities into coordinated movement without creating meeting debt.",
      interpretation: "Operating rhythm may be constrained when coordination consumes more capacity than it creates or issues surface too late.",
      questions: [
        "Recurring meetings reliably produce decisions, ownership, or action.",
        "Operating cadences expose execution risks early enough to respond.",
        "Cross-functional work moves without excessive coordination overhead."
      ]
    },
    {
      id: "alignment",
      name: "Alignment",
      description: "How consistently teams understand priorities, ownership, and changes in direction.",
      interpretation: "Alignment capacity may be constrained when teams require constant translation or ownership becomes unclear at organizational boundaries.",
      questions: [
        "Teams interpret the organization’s strategic priorities consistently.",
        "Ownership is clear where functions or teams intersect.",
        "Changes in direction reach affected teams quickly and coherently."
      ]
    },
    {
      id: "technology",
      name: "Technology",
      description: "How systems reduce coordination load and create leverage rather than hard-coding complexity.",
      interpretation: "Technology capacity may be constrained when systems add handoffs, information is unreliable, or adoption lacks process ownership.",
      questions: [
        "Technology reduces manual handoffs and coordination work.",
        "Teams have reliable information when and where decisions are made.",
        "New technology is introduced with clear process ownership and adoption support."
      ]
    },
    {
      id: "culture",
      name: "Culture",
      description: "How repeated and rewarded behaviors support execution as the organization grows.",
      interpretation: "Cultural capacity may be constrained when risk stays hidden, rewarded behavior conflicts with priorities, or change exhausts the system.",
      questions: [
        "The behaviors leaders reward reinforce stated priorities.",
        "People surface execution risks early, even when the message is uncomfortable.",
        "The organization adapts without change fatigue overwhelming execution."
      ]
    }
  ];

  const scale = [
    [1, "Rarely"],
    [2, "Inconsistently"],
    [3, "Sometimes"],
    [4, "Usually"],
    [5, "Consistently"]
  ];

  const elements = {
    form: app.querySelector("[data-assessment-form]"),
    context: app.querySelector("[data-assessment-context]"),
    panel: app.querySelector("[data-question-panel]"),
    questions: app.querySelector("[data-questions]"),
    domainTitle: app.querySelector("[data-domain-title]"),
    domainDescription: app.querySelector("[data-domain-description]"),
    progressLabel: app.querySelector("[data-progress-label]"),
    progressName: app.querySelector("[data-progress-name]"),
    progressBar: app.querySelector("[data-progress-bar]"),
    error: app.querySelector("[data-assessment-error]"),
    previous: app.querySelector("[data-previous]"),
    next: app.querySelector("[data-next]"),
    results: app.querySelector("[data-assessment-results]"),
    overallScore: app.querySelector("[data-overall-score]"),
    resultsBand: app.querySelector("[data-results-band]"),
    resultsSummary: app.querySelector("[data-results-summary]"),
    contextSummary: app.querySelector("[data-context-summary]"),
    domainResults: app.querySelector("[data-domain-results]"),
    constraintName: app.querySelector("[data-constraint-name]"),
    constraintInterpretation: app.querySelector("[data-constraint-interpretation]"),
    retake: app.querySelector("[data-retake]"),
    print: app.querySelector("[data-print]")
  };

  let currentDomain = 0;
  const responses = {};

  const escapeHtml = value => value.replace(/[&<>"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);

  function renderDomain(scroll = false) {
    const domain = domains[currentDomain];
    elements.domainTitle.textContent = domain.name;
    elements.domainDescription.textContent = domain.description;
    elements.progressLabel.textContent = `Domain ${currentDomain + 1} of ${domains.length}`;
    elements.progressName.textContent = domain.name;
    elements.progressBar.style.width = `${((currentDomain + 1) / domains.length) * 100}%`;
    elements.previous.disabled = currentDomain === 0;
    elements.next.textContent = currentDomain === domains.length - 1 ? "See my results" : "Next domain";
    elements.error.hidden = true;
    elements.context.hidden = currentDomain !== 0;

    elements.questions.innerHTML = domain.questions.map((question, questionIndex) => {
      const key = `${domain.id}-${questionIndex}`;
      return `<div class="assessment-question">
        <p><span>${questionIndex + 1}</span>${escapeHtml(question)}</p>
        <div class="assessment-scale" role="radiogroup" aria-label="${escapeHtml(question)}">
          ${scale.map(([value, label]) => `<label>
            <input type="radio" name="${key}" value="${value}" ${responses[key] === value ? "checked" : ""} />
            <span><strong>${value}</strong><small>${label}</small></span>
          </label>`).join("")}
        </div>
      </div>`;
    }).join("");

    elements.panel.focus({ preventScroll: true });
    if (scroll) {
      elements.panel.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start"
      });
    }
  }

  function captureDomain() {
    const domain = domains[currentDomain];
    let complete = true;
    domain.questions.forEach((_, questionIndex) => {
      const key = `${domain.id}-${questionIndex}`;
      const selected = elements.form.querySelector(`input[name="${key}"]:checked`);
      if (!selected) complete = false;
      else responses[key] = Number(selected.value);
    });
    return complete;
  }

  function bandFor(score) {
    if (score < 40) return ["Constrained", "Execution is likely relying on leadership effort and workarounds more than scalable organizational systems."];
    if (score < 60) return ["Strained", "The organization has meaningful capacity, but growth pressure is exposing recurring friction and uneven execution."];
    if (score < 80) return ["Developing", "Core capacity is present, with specific domains still limiting consistency, speed, or leverage."];
    return ["Enabling", "Organizational systems generally support coordinated execution, though continued growth will create new capacity demands."];
  }

  function scoreAssessment() {
    const scores = domains.map(domain => {
      const values = domain.questions.map((_, index) => responses[`${domain.id}-${index}`]);
      const average = values.reduce((sum, value) => sum + value, 0) / values.length;
      return { ...domain, score: Math.round((average - 1) * 25) };
    });
    const mean = scores.reduce((sum, domain) => sum + domain.score, 0) / scores.length;
    const weakest = Math.min(...scores.map(domain => domain.score));
    const overall = Math.round(mean * 0.75 + weakest * 0.25);
    return { scores, overall };
  }

  function showResults() {
    const { scores, overall } = scoreAssessment();
    const [band, summary] = bandFor(overall);
    const constraint = [...scores].sort((a, b) => a.score - b.score)[0];

    elements.form.hidden = true;
    app.querySelector(".assessment-progress").hidden = true;
    elements.results.hidden = false;
    elements.overallScore.textContent = overall;
    elements.resultsBand.textContent = band;
    elements.resultsBand.dataset.band = band.toLowerCase();
    elements.resultsSummary.textContent = summary;
    const contextValues = [...elements.context.querySelectorAll("select")].map(select => select.value).filter(Boolean);
    elements.contextSummary.hidden = contextValues.length === 0;
    elements.contextSummary.textContent = contextValues.length ? `Context: ${contextValues.join(" · ")}` : "";
    elements.constraintName.textContent = constraint.name;
    elements.constraintInterpretation.textContent = constraint.interpretation;
    elements.domainResults.innerHTML = scores.map(domain => {
      const [domainBand] = bandFor(domain.score);
      return `<article class="domain-result">
        <div><h3>${domain.name}</h3><span>${domainBand} · ${domain.score}/100</span></div>
        <div class="domain-score-track" aria-label="${domain.name}: ${domain.score} out of 100"><span style="width:${domain.score}%"></span></div>
      </article>`;
    }).join("");
    elements.results.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }

  elements.next.addEventListener("click", () => {
    if (!captureDomain()) {
      elements.error.hidden = false;
      return;
    }
    if (currentDomain === domains.length - 1) showResults();
    else {
      currentDomain += 1;
      renderDomain(true);
    }
  });

  elements.previous.addEventListener("click", () => {
    captureDomain();
    currentDomain = Math.max(0, currentDomain - 1);
    renderDomain(true);
  });

  elements.retake.addEventListener("click", () => {
    Object.keys(responses).forEach(key => delete responses[key]);
    currentDomain = 0;
    elements.results.hidden = true;
    elements.form.hidden = false;
    app.querySelector(".assessment-progress").hidden = false;
    renderDomain();
    app.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  elements.print.addEventListener("click", () => window.print());
  elements.panel.setAttribute("tabindex", "-1");
  renderDomain();
})();
