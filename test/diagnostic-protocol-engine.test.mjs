import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  diagnosticQuestionLibrary,
  diagnosticQuestionTemplates,
  recommendedProtocolTemplateIds
} from "../diagnostic-question-library.js";
import {
  approveDiagnosticProtocol,
  createAdaptiveFollowUp,
  createDiagnosticProtocol,
  diagnosticProtocol
} from "../diagnostic-protocol-engine.js";

const now = new Date("2026-07-29T12:00:00.000Z");
const templateById = new Map(diagnosticQuestionTemplates.map((template) => [template.id, template]));

function protocolValues(ids = recommendedProtocolTemplateIds) {
  return {
    diagnosticId: "diagnostic-1",
    contextBriefId: "brief-1",
    participantPlanId: "plan-1",
    questions: ids.map((templateId) => ({
      templateId,
      questionText: templateById.get(templateId).question,
      contextualizationNote: "Canonical wording retained for the first POC."
    }))
  };
}

test("compiles exactly eighteen governed questions with complete domain and evidence coverage", () => {
  const protocol = createDiagnosticProtocol(protocolValues(), { now, id: "protocol-1" });
  assert.equal(protocol.questions.length, 18);
  assert.equal(new Set(protocol.questions.map((question) => question.domainId)).size, 6);
  assert.equal(new Set(protocol.questions.map((question) => question.evidenceObjectiveId)).size, 6);
  assert.equal(protocol.status, "draft");
});

test("rejects ungoverned, duplicated, incomplete, and unsupported protocol content", () => {
  assert.throws(() => createDiagnosticProtocol(protocolValues(recommendedProtocolTemplateIds.slice(0, 17)), { now }), /exactly 18/);
  const duplicate = [...recommendedProtocolTemplateIds.slice(0, 17), recommendedProtocolTemplateIds[0]];
  assert.throws(() => createDiagnosticProtocol(protocolValues(duplicate), { now }), /unique/);
  const ungoverned = protocolValues();
  ungoverned.questions[0] = { templateId: "ai-invented", questionText: "Why is leadership failing?", contextualizationNote: "" };
  assert.throws(() => createDiagnosticProtocol(ungoverned, { now }), /governed template/);
  const unsupported = protocolValues();
  unsupported.questions[0].leadingScore = 0.9;
  assert.throws(() => createDiagnosticProtocol(unsupported, { now }), /unsupported fields/);
});

test("requires explicit protocol approval before bounded adaptive follow-ups", () => {
  const draft = createDiagnosticProtocol(protocolValues(), { now, id: "protocol-1" });
  assert.throws(() => createAdaptiveFollowUp(draft, {
    interviewInstanceId: "interview-1",
    questionId: "q-01",
    promptType: "example",
    triggerReason: "The answer contains no observable example."
  }, [], { now }), /approved protocol/);
  const protocol = approveDiagnosticProtocol(draft, { approvalNote: "Method owner approved." }, { now });
  const followUp = createAdaptiveFollowUp(protocol, {
    interviewInstanceId: "interview-1",
    questionId: "q-01",
    promptType: "example",
    triggerReason: "The answer contains no observable example."
  }, [], { now, id: "follow-up-1" });
  assert.equal(followUp.promptText, "Can you give a recent, specific example?");
  assert.equal(followUp.triggerReason.includes("observable"), true);
});

test("limits adaptive probing without changing the shared core protocol", () => {
  const protocol = approveDiagnosticProtocol(createDiagnosticProtocol(protocolValues(), { now, id: "protocol-1" }), {}, { now });
  const prompts = ["example", "consequence", "alternative-explanation"].map((promptType, index) => createAdaptiveFollowUp(protocol, {
    interviewInstanceId: "interview-1",
    questionId: "q-01",
    promptType,
    triggerReason: `Evidence-quality reason ${index + 1}.`
  }, [], { now, id: `follow-up-${index + 1}` }));
  assert.throws(() => createAdaptiveFollowUp(protocol, {
    interviewInstanceId: "interview-1",
    questionId: "q-01",
    promptType: "mechanism",
    triggerReason: "A fourth prompt would create excess burden."
  }, prompts, { now }), /at most three/);
  assert.equal(protocol.questions[0].questionText, templateById.get("strategy-translation").question);
});

test("machine-readable question governance matches the protocol engine", async () => {
  const contract = JSON.parse(await readFile(new URL("../schemas/diagnostic-question-library.json", import.meta.url), "utf8"));
  assert.equal(contract.questionLibraryVersion, diagnosticQuestionLibrary.version);
  assert.equal(contract.requiredCoreQuestionCount, diagnosticProtocol.requiredQuestionCount);
  assert.equal(contract.availableTemplateCount, diagnosticQuestionTemplates.length);
  assert.deepEqual(contract.requiredDomainCoverage, diagnosticQuestionLibrary.domains);
  assert.deepEqual(contract.adaptiveFollowUps.allowedTypes, Object.keys(diagnosticProtocol.allowedFollowUps));
  assert.equal(contract.governance.sameCoreProtocolForEveryParticipant, true);
});
