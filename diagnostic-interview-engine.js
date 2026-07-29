const INTERVIEW_VERSION = "1.0.0";
const EVIDENCE_QUALITY_VERSION = "1.0.0";
const COLLECTION_MODES = new Set(["automated-written", "advisor-transcript"]);
const SPECIFICITY = new Set(["none", "general", "concrete"]);
const PATTERNS = new Set(["unclear", "isolated", "recurring"]);
const CONFIDENCE = new Set(["low", "medium", "high"]);

const QUALITY_POLICY = Object.freeze({
  minimumConcreteExamples: 8,
  minimumRecurringPatterns: 4,
  minimumConsequences: 5,
  minimumAlternativeEvidence: 1,
  lowConfidenceHumanReviewCount: 3
});

function nowIso(value) {
  const date = value instanceof Date ? value : new Date(value || Date.now());
  if (!Number.isFinite(date.getTime())) throw new Error("The timestamp is invalid.");
  return date.toISOString();
}

function requiredText(value, name, maximum, minimum = 1) {
  const text = String(value || "").trim();
  if (text.length < minimum) throw new Error(`${name} must be at least ${minimum} characters.`);
  if (text.length > maximum) throw new Error(`${name} must be ${maximum} characters or fewer.`);
  return text;
}

function exactKeys(value, allowed, name) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${name} is required.`);
  const unexpected = Object.keys(value).filter((key) => !allowed.has(key));
  if (unexpected.length) throw new Error(`${name} contains unsupported fields: ${unexpected.join(", ")}.`);
}

function assertEditable(interview) {
  if (interview.status !== "in-progress") throw new Error("Only an in-progress interview can be changed.");
}

function upsert(records, next, key) {
  const index = records.findIndex((record) => record[key] === next[key]);
  if (index === -1) return [...records, next];
  return records.map((record, recordIndex) => recordIndex === index ? next : record);
}

export function createDiagnosticInterview(protocol, values, options = {}) {
  if (protocol.status !== "approved") throw new Error("An approved diagnostic protocol is required.");
  exactKeys(values, new Set(["diagnosticId", "collectionMode", "participantNoticeAccepted"]), "The interview setup");
  if (values.participantNoticeAccepted !== true) throw new Error("Participant notice acceptance is required.");
  const collectionMode = String(values.collectionMode || "");
  if (!COLLECTION_MODES.has(collectionMode)) throw new Error("Select a valid interview collection mode.");
  const createdAt = nowIso(options.now);
  return {
    interviewInstanceId: options.id || crypto.randomUUID(),
    interviewVersion: INTERVIEW_VERSION,
    diagnosticId: requiredText(values.diagnosticId, "Diagnostic ID", 100),
    protocolId: protocol.protocolId,
    collectionMode,
    status: "in-progress",
    coreAnswers: [],
    followUpAnswers: [],
    createdAt,
    updatedAt: createdAt,
    submittedAt: null,
    withdrawnAt: null
  };
}

export function saveCoreAnswer(interview, protocol, values, options = {}) {
  assertEditable(interview);
  exactKeys(values, new Set(["questionId", "answerText"]), "The core answer");
  const question = protocol.questions.find((candidate) => candidate.questionId === values.questionId);
  if (!question || protocol.protocolId !== interview.protocolId) throw new Error("Select a question from this interview protocol.");
  const updatedAt = nowIso(options.now);
  const answer = {
    questionId: question.questionId,
    answerText: requiredText(values.answerText, "The answer", 6000),
    updatedAt
  };
  return {
    ...interview,
    coreAnswers: upsert(interview.coreAnswers, answer, "questionId"),
    updatedAt
  };
}

export function saveFollowUpAnswer(interview, followUp, values, options = {}) {
  assertEditable(interview);
  exactKeys(values, new Set(["answerText"]), "The follow-up answer");
  if (followUp.interviewInstanceId !== interview.interviewInstanceId || followUp.protocolId !== interview.protocolId) {
    throw new Error("The adaptive follow-up does not belong to this interview.");
  }
  const updatedAt = nowIso(options.now);
  const answer = {
    followUpId: followUp.followUpId,
    questionId: followUp.questionId,
    promptType: followUp.promptType,
    answerText: requiredText(values.answerText, "The follow-up answer", 4000),
    updatedAt
  };
  return {
    ...interview,
    followUpAnswers: upsert(interview.followUpAnswers, answer, "followUpId"),
    updatedAt
  };
}

export function submitDiagnosticInterview(interview, protocol, options = {}) {
  assertEditable(interview);
  if (protocol.protocolId !== interview.protocolId) throw new Error("The protocol does not match this interview.");
  const answers = new Map(interview.coreAnswers.map((answer) => [answer.questionId, answer.answerText]));
  const missing = protocol.questions.filter((question) => !answers.has(question.questionId)).map((question) => question.questionId);
  if (missing.length) throw new Error(`Answer every core question before submission: ${missing.join(", ")}.`);
  const shallow = protocol.questions.filter((question) => answers.get(question.questionId).trim().length < 40).map((question) => question.questionId);
  if (shallow.length) throw new Error(`Add enough context for evidence review: ${shallow.join(", ")}.`);
  const submittedAt = nowIso(options.now);
  return {
    ...interview,
    status: "submitted",
    updatedAt: submittedAt,
    submittedAt
  };
}

export function withdrawDiagnosticInterview(interview, options = {}) {
  if (interview.status === "withdrawn") throw new Error("The interview is already withdrawn.");
  const withdrawnAt = nowIso(options.now);
  return {
    ...interview,
    status: "withdrawn",
    coreAnswers: [],
    followUpAnswers: [],
    updatedAt: withdrawnAt,
    withdrawnAt
  };
}

function qualityEvaluation(value, questionIds, index) {
  exactKeys(value, new Set([
    "questionId",
    "specificity",
    "pattern",
    "consequenceObserved",
    "alternativeEvidence",
    "sensitiveContent",
    "modelConfidence",
    "reason"
  ]), `Evidence evaluation ${index + 1}`);
  const questionId = String(value.questionId || "");
  if (!questionIds.has(questionId)) throw new Error("Every evidence evaluation must reference a submitted core answer.");
  if (!SPECIFICITY.has(value.specificity)) throw new Error("Select a valid answer-specificity classification.");
  if (!PATTERNS.has(value.pattern)) throw new Error("Select a valid recurrence-pattern classification.");
  if (!CONFIDENCE.has(value.modelConfidence)) throw new Error("Select a valid model-confidence classification.");
  for (const field of ["consequenceObserved", "alternativeEvidence", "sensitiveContent"]) {
    if (typeof value[field] !== "boolean") throw new Error(`${field} must be explicit.`);
  }
  return {
    questionId,
    specificity: value.specificity,
    pattern: value.pattern,
    consequenceObserved: value.consequenceObserved,
    alternativeEvidence: value.alternativeEvidence,
    sensitiveContent: value.sensitiveContent,
    modelConfidence: value.modelConfidence,
    reason: requiredText(value.reason, "Evidence evaluation reason", 500)
  };
}

export function evaluateInterviewEvidence(interview, evaluations, options = {}) {
  if (interview.status !== "submitted") throw new Error("Only a submitted interview can enter evidence review.");
  if (!Array.isArray(evaluations) || evaluations.length !== interview.coreAnswers.length) {
    throw new Error("Evaluate every submitted core answer exactly once.");
  }
  const questionIds = new Set(interview.coreAnswers.map((answer) => answer.questionId));
  const normalized = evaluations.map((value, index) => qualityEvaluation(value, questionIds, index));
  if (new Set(normalized.map((value) => value.questionId)).size !== questionIds.size) {
    throw new Error("Evaluate every submitted core answer exactly once.");
  }
  const counts = {
    concreteExamples: normalized.filter((value) => value.specificity === "concrete").length,
    recurringPatterns: normalized.filter((value) => value.pattern === "recurring").length,
    consequences: normalized.filter((value) => value.consequenceObserved).length,
    alternativeEvidence: normalized.filter((value) => value.alternativeEvidence).length,
    sensitiveContent: normalized.filter((value) => value.sensitiveContent).length,
    lowConfidence: normalized.filter((value) => value.modelConfidence === "low").length
  };
  const clarificationReasons = [];
  if (counts.concreteExamples < QUALITY_POLICY.minimumConcreteExamples) clarificationReasons.push("insufficient-concrete-examples");
  if (counts.recurringPatterns < QUALITY_POLICY.minimumRecurringPatterns) clarificationReasons.push("insufficient-recurring-patterns");
  if (counts.consequences < QUALITY_POLICY.minimumConsequences) clarificationReasons.push("insufficient-consequences");
  if (counts.alternativeEvidence < QUALITY_POLICY.minimumAlternativeEvidence) clarificationReasons.push("missing-disconfirming-evidence");
  const humanReviewReasons = [];
  if (counts.sensitiveContent > 0) humanReviewReasons.push("sensitive-content");
  if (counts.lowConfidence >= QUALITY_POLICY.lowConfidenceHumanReviewCount) humanReviewReasons.push("model-uncertainty");
  const status = humanReviewReasons.length
    ? "human-review-required"
    : clarificationReasons.length
      ? "clarification-required"
      : "passed";
  return {
    evidenceReviewId: options.id || crypto.randomUUID(),
    evidenceQualityVersion: EVIDENCE_QUALITY_VERSION,
    interviewInstanceId: interview.interviewInstanceId,
    status,
    counts,
    clarificationReasons,
    humanReviewReasons,
    evaluations: normalized,
    createdAt: nowIso(options.now)
  };
}

export const diagnosticInterview = Object.freeze({
  version: INTERVIEW_VERSION,
  evidenceQualityVersion: EVIDENCE_QUALITY_VERSION,
  collectionModes: Object.freeze([...COLLECTION_MODES]),
  evidenceQualityPolicy: QUALITY_POLICY
});
