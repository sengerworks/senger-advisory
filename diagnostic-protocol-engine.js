import {
  diagnosticQuestionLibrary,
  diagnosticQuestionTemplates
} from "./diagnostic-question-library.js";

const PROTOCOL_VERSION = "1.0.0";
const REQUIRED_QUESTION_COUNT = 18;
const templateById = new Map(diagnosticQuestionTemplates.map((template) => [template.id, template]));

const FOLLOW_UPS = Object.freeze({
  example: "Can you give a recent, specific example?",
  recurrence: "Is this an isolated event or a recurring pattern? What makes you say that?",
  consequence: "What happened as a result, and who or what was affected?",
  mechanism: "What do you believe allowed or caused that pattern to occur?",
  "alternative-explanation": "What other explanation might fit the same evidence?",
  "evidence-source": "What observable evidence would help confirm or challenge that interpretation?"
});

function nowIso(value) {
  const date = value instanceof Date ? value : new Date(value || Date.now());
  if (!Number.isFinite(date.getTime())) throw new Error("The timestamp is invalid.");
  return date.toISOString();
}

function requiredText(value, name, maximum) {
  const text = String(value || "").trim();
  if (!text) throw new Error(`${name} is required.`);
  if (text.length > maximum) throw new Error(`${name} must be ${maximum} characters or fewer.`);
  return text;
}

function optionalText(value, name, maximum) {
  const text = String(value || "").trim();
  if (text.length > maximum) throw new Error(`${name} must be ${maximum} characters or fewer.`);
  return text;
}

function exactKeys(value, allowed, name) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${name} is required.`);
  const unexpected = Object.keys(value).filter((key) => !allowed.has(key));
  if (unexpected.length) throw new Error(`${name} contains unsupported fields: ${unexpected.join(", ")}.`);
}

function compiledQuestion(value, index) {
  exactKeys(value, new Set(["templateId", "questionText", "contextualizationNote"]), `Question ${index + 1}`);
  const template = templateById.get(String(value.templateId || ""));
  if (!template) throw new Error(`Question ${index + 1} must use a governed template.`);
  return {
    questionId: `q-${String(index + 1).padStart(2, "0")}`,
    position: index + 1,
    templateId: template.id,
    domainId: template.domainId,
    evidenceObjectiveId: template.objectiveId,
    canonicalQuestion: template.question,
    questionText: requiredText(value.questionText, `Question ${index + 1} text`, 500),
    contextualizationNote: optionalText(value.contextualizationNote, `Question ${index + 1} contextualization note`, 300)
  };
}

function ensureCoverage(questions, property, required, label) {
  const present = new Set(questions.map((question) => question[property]));
  const missing = required.filter((value) => !present.has(value));
  if (missing.length) throw new Error(`The protocol is missing required ${label}: ${missing.join(", ")}.`);
}

export function createDiagnosticProtocol(values, options = {}) {
  exactKeys(values, new Set([
    "diagnosticId",
    "contextBriefId",
    "participantPlanId",
    "questions"
  ]), "The diagnostic protocol");
  if (!Array.isArray(values.questions) || values.questions.length !== REQUIRED_QUESTION_COUNT) {
    throw new Error(`The diagnostic protocol requires exactly ${REQUIRED_QUESTION_COUNT} core questions.`);
  }
  const questions = values.questions.map(compiledQuestion);
  if (new Set(questions.map((question) => question.templateId)).size !== questions.length) {
    throw new Error("Every core question must use a unique governed template.");
  }
  ensureCoverage(questions, "domainId", diagnosticQuestionLibrary.domains, "capacity domains");
  ensureCoverage(questions, "evidenceObjectiveId", diagnosticQuestionLibrary.evidenceObjectives, "evidence objectives");
  const createdAt = nowIso(options.now);
  return {
    protocolId: options.id || crypto.randomUUID(),
    protocolVersion: PROTOCOL_VERSION,
    questionLibraryVersion: diagnosticQuestionLibrary.version,
    diagnosticId: requiredText(values.diagnosticId, "Diagnostic ID", 100),
    contextBriefId: requiredText(values.contextBriefId, "Context Brief ID", 100),
    participantPlanId: requiredText(values.participantPlanId, "Participant Plan ID", 100),
    status: "draft",
    questions,
    createdAt,
    updatedAt: createdAt,
    approvedAt: null,
    approvalNote: ""
  };
}

export function approveDiagnosticProtocol(protocol, values = {}, options = {}) {
  if (protocol.status !== "draft") throw new Error("Only a draft diagnostic protocol can be approved.");
  const approvedAt = nowIso(options.now);
  return {
    ...protocol,
    status: "approved",
    updatedAt: approvedAt,
    approvedAt,
    approvalNote: optionalText(values.approvalNote, "Approval note", 500)
  };
}

export function createAdaptiveFollowUp(protocol, values, existingFollowUps = [], options = {}) {
  if (protocol.status !== "approved") throw new Error("Adaptive follow-ups require an approved protocol.");
  exactKeys(values, new Set(["interviewInstanceId", "questionId", "promptType", "triggerReason"]), "The adaptive follow-up");
  const question = protocol.questions.find((candidate) => candidate.questionId === values.questionId);
  if (!question) throw new Error("Select a core protocol question.");
  const promptType = String(values.promptType || "");
  if (!(promptType in FOLLOW_UPS)) throw new Error("Select an allowed adaptive prompt type.");
  const matching = existingFollowUps.filter((followUp) => (
    followUp.interviewInstanceId === values.interviewInstanceId && followUp.questionId === values.questionId
  ));
  if (matching.length >= 3) throw new Error("A core question can have at most three adaptive follow-ups per interview.");
  if (matching.some((followUp) => followUp.promptType === promptType)) {
    throw new Error("Do not repeat the same adaptive prompt type for one answer.");
  }
  return {
    followUpId: options.id || crypto.randomUUID(),
    protocolId: protocol.protocolId,
    interviewInstanceId: requiredText(values.interviewInstanceId, "Interview instance ID", 100),
    questionId: question.questionId,
    promptType,
    promptText: FOLLOW_UPS[promptType],
    triggerReason: requiredText(values.triggerReason, "Adaptive prompt trigger reason", 300),
    createdAt: nowIso(options.now)
  };
}

export const diagnosticProtocol = Object.freeze({
  version: PROTOCOL_VERSION,
  requiredQuestionCount: REQUIRED_QUESTION_COUNT,
  allowedFollowUps: Object.freeze({ ...FOLLOW_UPS })
});
