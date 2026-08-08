import { diagnosticQuestionLibraryV2, diagnosticQuestionTemplatesV2 } from "./diagnostic-question-library-v2.js";

export const DIAGNOSTIC_PROTOCOL_VERSION_V2 = "2.0.0";
const templateById = new Map(diagnosticQuestionTemplatesV2.map(template => [template.id, template]));
const FOLLOW_UPS = Object.freeze({
  example: "Can you give a recent, specific example?",
  consequence: "What happened as a result, and what execution demand was affected?",
  compensation: "What did people do to keep performance from degrading?",
  interaction: "What happened next elsewhere in the operating system?",
  "formal-lived": "What was formally intended, and what could people actually do?",
  "alternative-explanation": "What other explanation might fit the same evidence?",
  "boundary-test": "What evidence would suggest this is not an Organizational Capacity problem?",
  "evidence-source": "What observable evidence would confirm or challenge that interpretation?"
});

function exactKeys(value, allowed, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} is required.`);
  const unexpected = Object.keys(value).filter(key => !allowed.has(key));
  if (unexpected.length) throw new Error(`${label} contains unsupported fields: ${unexpected.join(", ")}.`);
}

function text(value, label, minimum, maximum) {
  const clean = String(value || "").trim().replace(/\s+/g, " ");
  if (clean.length < minimum || clean.length > maximum) throw new Error(`${label} must be between ${minimum} and ${maximum} characters.`);
  return clean;
}

function nowIso(value) {
  const date = value instanceof Date ? value : new Date(value || Date.now());
  if (!Number.isFinite(date.getTime())) throw new Error("The timestamp is invalid.");
  return date.toISOString();
}

function compileQuestion(value, index) {
  exactKeys(value, new Set(["templateId", "questionText", "contextualizationNote"]), `Question ${index + 1}`);
  const template = templateById.get(value.templateId);
  if (!template) throw new Error(`Question ${index + 1} must use a governed v2 template.`);
  return Object.freeze({
    questionId: `q-${String(index + 1).padStart(2, "0")}`,
    position: index + 1,
    templateId: template.id,
    evidenceLayerId: template.evidenceLayerId,
    mechanismIds: template.mechanismIds,
    canonicalQuestion: template.question,
    questionText: text(value.questionText, `Question ${index + 1}`, 20, 600),
    contextualizationNote: String(value.contextualizationNote || "").trim().slice(0, 500)
  });
}

export function evaluateDiagnosticProtocolV2(protocol, frame) {
  if (frame.status !== "approved") throw new Error("Protocol evaluation requires an approved Diagnostic Frame v2.");
  const layers = new Set(protocol.questions.map(question => question.evidenceLayerId));
  const missingEvidenceLayers = diagnosticQuestionLibraryV2.requiredEvidenceLayers.filter(layer => !layers.has(layer));
  const mechanismCoverage = Object.fromEntries(diagnosticQuestionLibraryV2.mechanisms.map(mechanism => [mechanism, protocol.questions.filter(question => question.mechanismIds.includes(mechanism)).length]));
  const missingMechanisms = Object.entries(mechanismCoverage).filter(([, count]) => count === 0).map(([mechanism]) => mechanism);
  const blockers = [];
  if (missingEvidenceLayers.length) blockers.push("required-evidence-layers-missing");
  if (missingMechanisms.length) blockers.push("mechanism-inquiry-gaps-unresolved");
  if (protocol.frameId !== frame.frameId) blockers.push("frame-mismatch");
  return Object.freeze({ ready: blockers.length === 0, blockers: Object.freeze(blockers), missingEvidenceLayers: Object.freeze(missingEvidenceLayers), missingMechanisms: Object.freeze(missingMechanisms), mechanismCoverage: Object.freeze(mechanismCoverage) });
}

export function createDiagnosticProtocolV2(values, frame, options = {}) {
  exactKeys(values, new Set(["diagnosticId", "frameId", "questions"]), "Diagnostic protocol v2");
  if (frame.status !== "approved") throw new Error("Protocol creation requires an approved Diagnostic Frame v2.");
  if (values.frameId !== frame.frameId || values.diagnosticId !== frame.diagnosticId) throw new Error("The protocol must belong to the approved Diagnostic Frame and diagnostic.");
  if (!Array.isArray(values.questions) || values.questions.length < diagnosticQuestionLibraryV2.minimumQuestions || values.questions.length > diagnosticQuestionLibraryV2.maximumQuestions) throw new Error(`The v2 protocol requires ${diagnosticQuestionLibraryV2.minimumQuestions}–${diagnosticQuestionLibraryV2.maximumQuestions} questions.`);
  const questions = values.questions.map(compileQuestion);
  if (new Set(questions.map(question => question.templateId)).size !== questions.length) throw new Error("Every core question must use a unique governed template.");
  const createdAt = nowIso(options.now);
  const protocol = Object.freeze({
    protocolId: options.id || crypto.randomUUID(),
    protocolVersion: DIAGNOSTIC_PROTOCOL_VERSION_V2,
    questionLibraryVersion: diagnosticQuestionLibraryV2.version,
    diagnosticId: text(values.diagnosticId, "Diagnostic ID", 1, 100),
    frameId: text(values.frameId, "Diagnostic Frame ID", 1, 100),
    status: "draft",
    questions: Object.freeze(questions),
    approvedAt: null,
    approvalNote: "",
    createdAt,
    updatedAt: createdAt
  });
  evaluateDiagnosticProtocolV2(protocol, frame);
  return protocol;
}

export function approveDiagnosticProtocolV2(protocol, frame, values, options = {}) {
  if (protocol.status !== "draft") throw new Error("Only a draft v2 protocol can be approved.");
  exactKeys(values, new Set(["approvalNote", "acceptedResearchLimitations"]), "Protocol approval");
  const readiness = evaluateDiagnosticProtocolV2(protocol, frame);
  if (!readiness.ready) throw new Error(`Resolve protocol blockers before approval: ${readiness.blockers.join(", ")}.`);
  if (values.acceptedResearchLimitations !== true) throw new Error("Approval must acknowledge that Adaptive Capacity remains a research observation.");
  const approvedAt = nowIso(options.now);
  return Object.freeze({ ...protocol, status: "approved", approvalNote: text(values.approvalNote, "Approval note", 20, 800), approvedAt, updatedAt: approvedAt });
}

export function createAdaptiveFollowUpV2(protocol, values, existingFollowUps = [], options = {}) {
  if (protocol.status !== "approved") throw new Error("Adaptive follow-ups require an approved v2 protocol.");
  exactKeys(values, new Set(["interviewInstanceId", "questionId", "promptType", "triggerReason"]), "Adaptive follow-up");
  const question = protocol.questions.find(candidate => candidate.questionId === values.questionId);
  if (!question) throw new Error("Select a core protocol question.");
  if (!(values.promptType in FOLLOW_UPS)) throw new Error("Select an allowed adaptive prompt type.");
  const matching = existingFollowUps.filter(followUp => followUp.interviewInstanceId === values.interviewInstanceId && followUp.questionId === values.questionId);
  if (matching.length >= 4) throw new Error("A core question can have at most four adaptive follow-ups per interview.");
  if (matching.some(followUp => followUp.promptType === values.promptType)) throw new Error("Do not repeat the same adaptive prompt for one answer.");
  return Object.freeze({
    followUpId: options.id || crypto.randomUUID(), protocolId: protocol.protocolId,
    interviewInstanceId: text(values.interviewInstanceId, "Interview instance ID", 1, 100), questionId: question.questionId,
    promptType: values.promptType, promptText: FOLLOW_UPS[values.promptType], triggerReason: text(values.triggerReason, "Trigger reason", 20, 500), createdAt: nowIso(options.now)
  });
}

export const diagnosticProtocolPolicyV2 = Object.freeze({
  protocolVersion: DIAGNOSTIC_PROTOCOL_VERSION_V2,
  minimumQuestions: diagnosticQuestionLibraryV2.minimumQuestions,
  maximumQuestions: diagnosticQuestionLibraryV2.maximumQuestions,
  equalMechanismQuestionCountRequired: false,
  frameSpecificSufficiencyRequired: true,
  adaptiveCapacityScoreProduced: false,
  allowedFollowUps: FOLLOW_UPS
});
