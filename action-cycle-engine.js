const ACTION_CYCLE_VERSION = "1.0.0";
const DOMAINS = new Set(["leadership", "decisions", "rhythm", "alignment", "technology", "culture"]);
const STATUSES = new Set(["planned", "active", "completed", "stopped"]);
const EVIDENCE_MEASURES = new Set([
  "decisionPace",
  "leadershipEscalationLoad",
  "crossFunctionalCoordinationLoad",
  "executionReliability",
  "changeAbsorption",
  "other"
]);

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

function dateOnly(value, name) {
  const text = String(value || "");
  const date = new Date(`${text}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== text) {
    throw new Error(`${name} is required.`);
  }
  return text;
}

export function createActionCycle(values, options = {}) {
  const constraintDomainId = String(values.constraintDomainId || "");
  const evidenceMeasureId = String(values.evidenceMeasureId || "");
  const status = String(values.status || "planned");
  if (!DOMAINS.has(constraintDomainId)) throw new Error("Select the constraint this action addresses.");
  if (!EVIDENCE_MEASURES.has(evidenceMeasureId)) throw new Error("Select the operating evidence to watch.");
  if (!STATUSES.has(status)) throw new Error("Select a valid action status.");
  const now = options.now instanceof Date ? options.now : new Date(options.now || Date.now());
  if (!Number.isFinite(now.getTime())) throw new Error("The action date is invalid.");
  const reviewDate = dateOnly(values.reviewDate, "A review date");
  if (Date.parse(`${reviewDate}T23:59:59Z`) < now.getTime()) throw new Error("The review date cannot be in the past.");
  return {
    actionCycleId: options.id || crypto.randomUUID(),
    actionCycleVersion: ACTION_CYCLE_VERSION,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    constraintDomainId,
    hypothesis: requiredText(values.hypothesis, "The action hypothesis", 500),
    commitment: requiredText(values.commitment, "The action commitment", 500),
    evidenceMeasureId,
    evidenceDescription: requiredText(values.evidenceDescription, "The evidence description", 300),
    reviewDate,
    status,
    closedAt: ["completed", "stopped"].includes(status) ? now.toISOString() : null,
    reviewNote: ""
  };
}

export function updateActionCycle(cycle, values, options = {}) {
  const status = String(values.status || "");
  if (!STATUSES.has(status)) throw new Error("Select a valid action status.");
  const now = options.now instanceof Date ? options.now : new Date(options.now || Date.now());
  if (!Number.isFinite(now.getTime())) throw new Error("The review date is invalid.");
  return {
    ...cycle,
    updatedAt: now.toISOString(),
    status,
    closedAt: ["completed", "stopped"].includes(status) ? (cycle.closedAt || now.toISOString()) : null,
    reviewNote: optionalText(values.reviewNote, "The review note", 500)
  };
}

export function actionCycleState(cycle, now = new Date()) {
  if (["completed", "stopped"].includes(cycle.status)) return "closed";
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const review = new Date(`${cycle.reviewDate}T00:00:00`);
  if (review.getTime() < today.getTime()) return "overdue";
  if (review.getTime() === today.getTime()) return "due";
  return cycle.status;
}

export const actionCycleOptions = Object.freeze({
  version: ACTION_CYCLE_VERSION,
  domains: Object.freeze([...DOMAINS]),
  statuses: Object.freeze([...STATUSES]),
  evidenceMeasures: Object.freeze([...EVIDENCE_MEASURES])
});
