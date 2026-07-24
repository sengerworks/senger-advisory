import { aggregateOrganization } from "./organization-aggregation-engine.js";
import { illustrativeOrganizationSubmissions } from "./organization-view-demo-data.js";

const app = document.querySelector("[data-organization-view]");
const elements = {
  count: app.querySelector("[data-participant-count]"),
  thresholdLabel: app.querySelector("[data-threshold-label]"),
  participants: app.querySelector("[data-participant-list]"),
  slider: app.querySelector("[data-participant-slider]"),
  previous: app.querySelector("[data-previous-participant]"),
  next: app.querySelector("[data-next-participant]"),
  thresholdPanel: app.querySelector("[data-threshold-panel]"),
  thresholdNumber: app.querySelector("[data-threshold-number]"),
  thresholdTitle: app.querySelector("[data-threshold-title]"),
  thresholdCopy: app.querySelector("[data-threshold-copy]"),
  results: app.querySelector("[data-organization-results]"),
  index: app.querySelector("[data-organization-index]"),
  domains: app.querySelector("[data-organization-domains]"),
  constraint: app.querySelector("[data-organization-constraint]"),
  hypothesis: app.querySelector("[data-constraint-hypothesis]"),
  questions: app.querySelector("[data-constraint-questions]"),
  actionForm: app.querySelector("[data-demo-action-form]"),
  actionConstraint: app.querySelector("[data-demo-action-constraint]"),
  actionCard: app.querySelector("[data-demo-action-card]"),
  actionHypothesis: app.querySelector("[data-demo-action-hypothesis]"),
  actionCommitment: app.querySelector("[data-demo-action-commitment]"),
  actionOwner: app.querySelector("[data-demo-action-owner]"),
  actionEvidence: app.querySelector("[data-demo-action-evidence]"),
  actionDate: app.querySelector("[data-demo-action-date]"),
  actionMessage: app.querySelector("[data-demo-action-message]"),
  reviewDate: app.querySelector("[data-demo-review-date]")
};

const domainNames = {
  leadership: "Leadership",
  decisions: "Decision Velocity",
  rhythm: "Operating Rhythm",
  alignment: "Alignment",
  technology: "Technology",
  culture: "Culture"
};

const patternNames = {
  "closely-aligned": "Closely aligned",
  varied: "Varied perspectives",
  "widely-varied": "Widely varied perspectives"
};

const evidenceNames = {
  decisionPace: "Decision pace",
  leadershipEscalationLoad: "Leadership escalation load",
  crossFunctionalCoordinationLoad: "Cross-functional coordination load",
  executionReliability: "Execution reliability"
};

const constraintContent = {
  leadership: {
    hypothesis: "Senior attention may be absorbing ambiguity that the organization has not yet learned to resolve elsewhere.",
    questions: ["Which decisions still depend on senior intervention?", "What leadership work is being displaced by recurring escalation?"]
  },
  decisions: {
    hypothesis: "Decision ownership and closure may not be scaling at the pace execution requires.",
    questions: ["Where do important decisions remain open longest?", "Which decisions are repeatedly reopened or escalated?", "What ownership or threshold is unclear?"]
  },
  rhythm: {
    hypothesis: "Operating forums may be consuming coordination effort without reliably producing decisions and commitments.",
    questions: ["Which recurring forums produce clear decisions?", "Where does the same issue travel through multiple meetings?"]
  },
  alignment: {
    hypothesis: "Strategic priorities may not translate into sufficiently consistent tradeoffs across the organization.",
    questions: ["Where do teams make conflicting tradeoffs?", "Which priorities compete without an explicit resolution rule?"]
  },
  technology: {
    hypothesis: "Systems and information may be adding friction rather than increasing organizational leverage.",
    questions: ["Where does work depend on manual translation?", "Which system boundaries create the most rework?"]
  },
  culture: {
    hypothesis: "Local norms may be making challenge, ownership, or adaptation less reliable than execution requires.",
    questions: ["Where is productive challenge least safe?", "Which commitments depend more on heroics than shared norms?"]
  }
};

function renderParticipants(count) {
  elements.participants.innerHTML = illustrativeOrganizationSubmissions.map((_, index) => `<li data-status="${index < count ? "complete" : "pending"}">
    <span aria-hidden="true">${index < count ? "✓" : index + 1}</span>
    <strong>Perspective ${String(index + 1).padStart(2, "0")}</strong>
    <small>${index < count ? "Complete" : "Invited"}</small>
  </li>`).join("");
}

function renderAggregate(result) {
  elements.index.textContent = result.overallIndex;
  elements.domains.innerHTML = Object.entries(result.domainScores).map(([id, domain]) => `<article>
    <div>
      <h3>${domainNames[id]}</h3>
      <strong>${domain.mean}/100</strong>
    </div>
    <progress max="100" value="${domain.mean}" aria-label="${domainNames[id]} organizational mean: ${domain.mean} out of 100">${domain.mean}%</progress>
    <p><span data-pattern="${domain.perspectivePattern}"></span>${patternNames[domain.perspectivePattern]}</p>
  </article>`).join("");
  const primary = result.primaryConstraintIds[0];
  elements.constraint.textContent = result.primaryConstraintIds.map(id => domainNames[id]).join(" + ");
  elements.hypothesis.textContent = constraintContent[primary].hypothesis;
  elements.questions.innerHTML = constraintContent[primary].questions.map(question => `<li>${question}</li>`).join("");
  elements.actionConstraint.replaceChildren();
  for (const id of result.primaryConstraintIds) {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = domainNames[id];
    elements.actionConstraint.append(option);
  }
}

function render(count) {
  const result = aggregateOrganization(illustrativeOrganizationSubmissions.slice(0, count));
  elements.count.textContent = `${count} of 5`;
  elements.slider.value = String(count);
  elements.previous.disabled = count === 1;
  elements.next.disabled = count === 5;
  elements.next.textContent = count === 4 ? "Add fifth perspective" : count === 5 ? "Threshold reached" : "Add next perspective";
  renderParticipants(count);

  const released = result.policy === "aggregate";
  elements.thresholdPanel.dataset.released = String(released);
  elements.thresholdNumber.textContent = released ? "5" : result.remaining;
  elements.thresholdNumber.nextElementSibling.textContent = released ? "complete" : result.remaining === 1 ? "more" : "more";
  elements.thresholdLabel.textContent = released ? "Organizational view available" : "Results protected";
  elements.thresholdTitle.textContent = released ? "The privacy threshold is met." : "Organizational results remain hidden.";
  elements.thresholdCopy.textContent = released
    ? "Five valid, same-version perspectives can now be combined. No individual response is revealed."
    : `The workspace can show completion progress, but no score, constraint, or response pattern is available. ${result.remaining} more ${result.remaining === 1 ? "perspective is" : "perspectives are"} required.`;
  elements.results.hidden = !released;
  if (released) renderAggregate(result);
}

elements.slider.addEventListener("input", () => render(Number(elements.slider.value)));
elements.previous.addEventListener("click", () => render(Math.max(1, Number(elements.slider.value) - 1)));
elements.next.addEventListener("click", () => render(Math.min(5, Number(elements.slider.value) + 1)));

render(1);

const defaultReviewDate = new Date();
defaultReviewDate.setDate(defaultReviewDate.getDate() + 30);
elements.reviewDate.value = defaultReviewDate.toISOString().slice(0, 10);
elements.reviewDate.min = new Date().toISOString().slice(0, 10);

elements.actionForm.addEventListener("submit", event => {
  event.preventDefault();
  if (!elements.actionForm.reportValidity()) return;
  const values = Object.fromEntries(new FormData(elements.actionForm));
  elements.actionHypothesis.textContent = values.hypothesis;
  elements.actionCommitment.textContent = values.commitment;
  elements.actionOwner.textContent = values.responsibleOwner;
  elements.actionEvidence.textContent =
    `${evidenceNames[values.evidenceMeasureId]} — ${values.evidenceDescription}`;
  elements.actionDate.textContent = new Intl.DateTimeFormat(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${values.reviewDate}T12:00:00`));
  elements.actionCard.hidden = false;
  elements.actionForm.hidden = true;
  elements.actionMessage.textContent = "Fictional action cycle started.";
  elements.actionCard.scrollIntoView({ behavior: "smooth", block: "center" });
});
