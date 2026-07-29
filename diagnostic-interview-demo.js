import { diagnosticQuestionTemplates, recommendedProtocolTemplateIds } from "./diagnostic-question-library.js";
import { approveDiagnosticProtocol, createAdaptiveFollowUp, createDiagnosticProtocol } from "./diagnostic-protocol-engine.js";
import { createDiagnosticInterview, evaluateInterviewEvidence, saveCoreAnswer, saveFollowUpAnswer, submitDiagnosticInterview } from "./diagnostic-interview-engine.js";

const root = document.querySelector("[data-interview-demo]");
const stageButtons = [...root.querySelectorAll("[data-stage-button]")];
const stagePanels = [...root.querySelectorAll("[data-stage-panel]")];
const templateById = new Map(diagnosticQuestionTemplates.map(template => [template.id, template]));
const samples = recommendedProtocolTemplateIds.map((templateId, index) => `A recent example connected to ${templateById.get(templateId).domainId} occurred during the second-market launch. The issue repeated across several weeks, affected a cross-functional commitment, and required senior attention before work could continue. This fictional response ${index + 1} includes enough operating detail to support careful evidence review.`);
let protocol = createDiagnosticProtocol({ diagnosticId: "fictional-diagnostic", contextBriefId: "fictional-context", participantPlanId: "fictional-plan", questions: recommendedProtocolTemplateIds.map(templateId => ({ templateId, questionText: templateById.get(templateId).question, contextualizationNote: "Canonical wording retained for POC review." })) }, { id: "fictional-protocol" });
let interview = null;
let questionIndex = 0;
let activeFollowUp = null;

function showStage(stageName) {
  stagePanels.forEach(panel => { panel.hidden = panel.dataset.stagePanel !== stageName; });
  stageButtons.forEach(button => button.dataset.stageButton === stageName ? button.setAttribute("aria-current", "step") : button.removeAttribute("aria-current"));
  root.scrollIntoView({ behavior: "smooth", block: "start" });
}
function unlock(stageName) { const button = stageButtons.find(item => item.dataset.stageButton === stageName); if (button) button.disabled = false; }
stageButtons.forEach(button => button.addEventListener("click", () => { if (!button.disabled) showStage(button.dataset.stageButton); }));

const domains = new Set(protocol.questions.map(question => question.domainId));
const objectives = new Set(protocol.questions.map(question => question.evidenceObjectiveId));
root.querySelector("[data-protocol-coverage]").innerHTML = `<article><span>Core questions</span><strong>${protocol.questions.length}</strong><p>One shared protocol for every participant.</p></article><article><span>Capacity domains</span><strong>${domains.size} of 6</strong><p>Leadership, decisions, rhythm, alignment, technology, and culture.</p></article><article><span>Evidence objectives</span><strong>${objectives.size} of 6</strong><p>Examples, patterns, consequences, conditions, counterevidence, and intervention history.</p></article>`;
root.querySelector("[data-protocol-questions]").innerHTML = protocol.questions.map(question => `<li><span>${String(question.position).padStart(2, "0")}</span><div><small>${question.domainId.replace("decisions", "decision velocity")} · ${question.evidenceObjectiveId.replaceAll("-", " ")}</small><p>${question.questionText}</p></div></li>`).join("");

root.querySelector("[data-approve-protocol]").addEventListener("click", () => {
  protocol = approveDiagnosticProtocol(protocol, { approvalNote: "Fictional method-owner approval." });
  root.querySelector("[data-protocol-status]").textContent = "Protocol approved. Participant notice is now available.";
  unlock("notice");
  showStage("notice");
});
const noticeAccept = root.querySelector("[data-notice-accept]");
noticeAccept.addEventListener("change", () => { root.querySelector("[data-begin-interview]").disabled = !noticeAccept.checked; });
root.querySelector("[data-begin-interview]").addEventListener("click", () => {
  interview = createDiagnosticInterview(protocol, { diagnosticId: "fictional-diagnostic", collectionMode: "automated-written", participantNoticeAccepted: true }, { id: "fictional-interview" });
  unlock("interview");
  renderQuestion();
  showStage("interview");
});

function savedAnswer(questionId) { return interview?.coreAnswers.find(answer => answer.questionId === questionId)?.answerText; }
function renderNavigator() {
  root.querySelector("[data-question-navigator]").innerHTML = protocol.questions.map((question, index) => `<button type="button" data-question-index="${index}"${index === questionIndex ? ' aria-current="true"' : ""}${savedAnswer(question.questionId) ? ' data-complete="true"' : ""}><span>${String(index + 1).padStart(2, "0")}</span><small>${question.domainId}</small></button>`).join("");
  root.querySelectorAll("[data-question-index]").forEach(button => button.addEventListener("click", () => { saveCurrent(false); questionIndex = Number(button.dataset.questionIndex); renderQuestion(); }));
}
function renderQuestion() {
  const question = protocol.questions[questionIndex];
  root.querySelector("[data-question-progress]").textContent = `Question ${questionIndex + 1} of ${protocol.questions.length}`;
  root.querySelector("[data-question-progress-bar]").style.width = `${((questionIndex + 1) / protocol.questions.length) * 100}%`;
  root.querySelector("[data-question-domain]").textContent = question.domainId.replace("decisions", "Decision Velocity");
  root.querySelector("[data-question-objective]").textContent = question.evidenceObjectiveId.replaceAll("-", " ");
  root.querySelector("[data-question-text]").textContent = question.questionText;
  root.querySelector("[data-answer-text]").value = savedAnswer(question.questionId) || samples[questionIndex];
  root.querySelector("[data-previous-question]").disabled = questionIndex === 0;
  root.querySelector("[data-next-question]").textContent = questionIndex === protocol.questions.length - 1 ? "Submit fictional interview" : "Save and continue";
  root.querySelector("[data-question-error]").textContent = "";
  root.querySelector("[data-follow-up-panel]").hidden = true;
  root.querySelector("[data-follow-up-answer]").value = "";
  activeFollowUp = null;
  renderNavigator();
}
function saveCurrent(showError = true) {
  const question = protocol.questions[questionIndex];
  try {
    interview = saveCoreAnswer(interview, protocol, { questionId: question.questionId, answerText: root.querySelector("[data-answer-text]").value });
    if (activeFollowUp && root.querySelector("[data-follow-up-answer]").value.trim()) interview = saveFollowUpAnswer(interview, activeFollowUp, { answerText: root.querySelector("[data-follow-up-answer]").value });
    root.querySelector("[data-question-error]").textContent = "";
    return true;
  } catch (error) { if (showError) root.querySelector("[data-question-error]").textContent = error.message; return false; }
}
root.querySelector("[data-request-follow-up]").addEventListener("click", () => {
  const question = protocol.questions[questionIndex];
  activeFollowUp = createAdaptiveFollowUp(protocol, { interviewInstanceId: interview.interviewInstanceId, questionId: question.questionId, promptType: "alternative-explanation", triggerReason: "The participant is invited to consider evidence that could challenge the initial interpretation." }, interview.followUpAnswers, { id: `fictional-follow-up-${question.questionId}` });
  root.querySelector("[data-follow-up-prompt]").textContent = activeFollowUp.promptText;
  root.querySelector("[data-follow-up-answer]").value = "Another explanation is that required information arrives too late, so escalation may compensate for information gaps rather than unclear authority alone.";
  root.querySelector("[data-follow-up-panel]").hidden = false;
});
root.querySelector("[data-previous-question]").addEventListener("click", () => { if (saveCurrent()) { questionIndex -= 1; renderQuestion(); } });
root.querySelector("[data-question-form]").addEventListener("submit", event => {
  event.preventDefault();
  if (!saveCurrent()) return;
  if (questionIndex < protocol.questions.length - 1) { questionIndex += 1; renderQuestion(); return; }
  try {
    interview = submitDiagnosticInterview(interview, protocol);
    const evaluations = protocol.questions.map((question, index) => ({ questionId: question.questionId, specificity: "concrete", pattern: index < 6 ? "recurring" : "isolated", consequenceObserved: index < 7, alternativeEvidence: index === 13, sensitiveContent: false, modelConfidence: "high", reason: "The fictional answer contains an operating example and enough context for this POC classification." }));
    const review = evaluateInterviewEvidence(interview, evaluations, { id: "fictional-quality-review" });
    root.querySelector("[data-quality-counts]").innerHTML = `<article><span>Concrete examples</span><strong>${review.counts.concreteExamples}</strong></article><article><span>Recurring patterns</span><strong>${review.counts.recurringPatterns}</strong></article><article><span>Consequences</span><strong>${review.counts.consequences}</strong></article><article><span>Alternative evidence</span><strong>${review.counts.alternativeEvidence}</strong></article>`;
    unlock("quality");
    showStage("quality");
  } catch (error) { root.querySelector("[data-question-error]").textContent = error.message; }
});
root.querySelector("[data-restart-interview]").addEventListener("click", () => location.reload());
