import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { diagnosticQuestionTemplates, recommendedProtocolTemplateIds } from "../diagnostic-question-library.js";
import { approveDiagnosticProtocol, createAdaptiveFollowUp, createDiagnosticProtocol } from "../diagnostic-protocol-engine.js";
import {
  createDiagnosticInterview,
  diagnosticInterview,
  evaluateInterviewEvidence,
  saveCoreAnswer,
  saveFollowUpAnswer,
  submitDiagnosticInterview,
  withdrawDiagnosticInterview
} from "../diagnostic-interview-engine.js";

const now = new Date("2026-07-29T12:00:00.000Z");
const templateById = new Map(diagnosticQuestionTemplates.map((template) => [template.id, template]));

function approvedProtocol() {
  const protocol = createDiagnosticProtocol({
    diagnosticId: "diagnostic-1",
    contextBriefId: "brief-1",
    participantPlanId: "plan-1",
    questions: recommendedProtocolTemplateIds.map((templateId) => ({
      templateId,
      questionText: templateById.get(templateId).question,
      contextualizationNote: "Canonical POC wording."
    }))
  }, { now, id: "protocol-1" });
  return approveDiagnosticProtocol(protocol, {}, { now });
}

function interviewWithAnswers(protocol) {
  let interview = createDiagnosticInterview(protocol, {
    diagnosticId: "diagnostic-1",
    collectionMode: "automated-written",
    participantNoticeAccepted: true
  }, { now, id: "interview-1" });
  for (const question of protocol.questions) {
    interview = saveCoreAnswer(interview, protocol, {
      questionId: question.questionId,
      answerText: `A concrete operating example for ${question.questionId} with enough detail to support a careful evidence review.`
    }, { now });
  }
  return interview;
}

function evaluations(protocol, overrides = {}) {
  return protocol.questions.map((question, index) => ({
    questionId: question.questionId,
    specificity: "concrete",
    pattern: index < 6 ? "recurring" : "isolated",
    consequenceObserved: index < 7,
    alternativeEvidence: index === 13,
    sensitiveContent: false,
    modelConfidence: "high",
    reason: "The response includes an observable example and enough context for this classification.",
    ...(overrides[question.questionId] || {})
  }));
}

test("creates identity-free interviews only after participant notice acceptance", () => {
  const protocol = approvedProtocol();
  assert.throws(() => createDiagnosticInterview(protocol, {
    diagnosticId: "diagnostic-1",
    collectionMode: "automated-written",
    participantNoticeAccepted: false
  }, { now }), /notice acceptance/);
  const interview = createDiagnosticInterview(protocol, {
    diagnosticId: "diagnostic-1",
    collectionMode: "automated-written",
    participantNoticeAccepted: true
  }, { now, id: "interview-1" });
  assert.equal(interview.status, "in-progress");
  assert.equal("name" in interview || "email" in interview || "invitationId" in interview, false);
});

test("stores core and governed follow-up answers without changing the common protocol", () => {
  const protocol = approvedProtocol();
  let interview = createDiagnosticInterview(protocol, {
    diagnosticId: "diagnostic-1",
    collectionMode: "automated-written",
    participantNoticeAccepted: true
  }, { now, id: "interview-1" });
  interview = saveCoreAnswer(interview, protocol, { questionId: "q-01", answerText: "A recent example began when the market-entry decision returned to the founders." }, { now });
  const followUp = createAdaptiveFollowUp(protocol, {
    interviewInstanceId: interview.interviewInstanceId,
    questionId: "q-01",
    promptType: "consequence",
    triggerReason: "The initial answer does not describe the operating consequence."
  }, [], { now, id: "follow-up-1" });
  interview = saveFollowUpAnswer(interview, followUp, { answerText: "The delivery team waited two weeks and rescheduled the client launch." }, { now });
  assert.equal(interview.coreAnswers.length, 1);
  assert.equal(interview.followUpAnswers[0].promptType, "consequence");
  assert.equal(protocol.questions[0].questionText, templateById.get("strategy-translation").question);
});

test("requires all eighteen sufficiently developed core answers before submission", () => {
  const protocol = approvedProtocol();
  let interview = interviewWithAnswers(protocol);
  interview.coreAnswers = interview.coreAnswers.slice(0, 17);
  assert.throws(() => submitDiagnosticInterview(interview, protocol, { now }), /q-18/);
  interview = interviewWithAnswers(protocol);
  interview.coreAnswers[0] = { ...interview.coreAnswers[0], answerText: "Too short." };
  assert.throws(() => submitDiagnosticInterview(interview, protocol, { now }), /q-01/);
  const submitted = submitDiagnosticInterview(interviewWithAnswers(protocol), protocol, { now });
  assert.equal(submitted.status, "submitted");
});

test("passes strong evidence and requests clarification when depth is insufficient", () => {
  const protocol = approvedProtocol();
  const submitted = submitDiagnosticInterview(interviewWithAnswers(protocol), protocol, { now });
  const passed = evaluateInterviewEvidence(submitted, evaluations(protocol), { now, id: "review-1" });
  assert.equal(passed.status, "passed");
  const shallow = evaluations(protocol, Object.fromEntries(protocol.questions.slice(0, 11).map((question) => [question.questionId, {
    specificity: "general",
    pattern: "unclear",
    consequenceObserved: false,
    alternativeEvidence: false
  }])));
  const clarification = evaluateInterviewEvidence(submitted, shallow, { now, id: "review-2" });
  assert.equal(clarification.status, "clarification-required");
  assert.equal(clarification.clarificationReasons.includes("insufficient-concrete-examples"), true);
});

test("requires human review for sensitive content or repeated model uncertainty", () => {
  const protocol = approvedProtocol();
  const submitted = submitDiagnosticInterview(interviewWithAnswers(protocol), protocol, { now });
  const review = evaluateInterviewEvidence(submitted, evaluations(protocol, {
    "q-02": { sensitiveContent: true },
    "q-03": { modelConfidence: "low" },
    "q-04": { modelConfidence: "low" },
    "q-05": { modelConfidence: "low" }
  }), { now, id: "review-3" });
  assert.equal(review.status, "human-review-required");
  assert.deepEqual(review.humanReviewReasons, ["sensitive-content", "model-uncertainty"]);
});

test("withdrawal clears confidential response content", () => {
  const protocol = approvedProtocol();
  const withdrawn = withdrawDiagnosticInterview(interviewWithAnswers(protocol), { now });
  assert.equal(withdrawn.status, "withdrawn");
  assert.deepEqual(withdrawn.coreAnswers, []);
  assert.deepEqual(withdrawn.followUpAnswers, []);
});

test("machine-readable interview contract matches the implementation", async () => {
  const contract = JSON.parse(await readFile(new URL("../schemas/diagnostic-interview.json", import.meta.url), "utf8"));
  assert.equal(contract.interviewVersion, diagnosticInterview.version);
  assert.equal(contract.evidenceQualityVersion, diagnosticInterview.evidenceQualityVersion);
  assert.deepEqual(contract.collectionModes, diagnosticInterview.collectionModes);
  assert.equal(contract.evidenceQualityPolicy.minimumConcreteExamples, diagnosticInterview.evidenceQualityPolicy.minimumConcreteExamples);
  assert.equal(contract.identityFieldsPermitted, false);
  assert.equal(contract.withdrawalDeletesResponseContent, true);
});
