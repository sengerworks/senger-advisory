const EVIDENCE_VERSION = "1.0.0";
const SYNTHESIS_VERSION = "1.0.0";
const DOMAINS = new Set(["leadership", "decisions", "rhythm", "alignment", "technology", "culture"]);
const REDACTION_CATEGORIES = new Set(["person", "role", "organization", "client", "location", "date", "project", "other"]);
const DISCLOSURE_RISKS = new Set(["low", "medium", "high"]);
const REVIEWER_TYPES = new Set(["automated", "human"]);
const REVIEW_DECISIONS = new Set(["approved", "excluded"]);
const PERSPECTIVE_PATTERNS = new Set(["convergent", "mixed", "minority-signal", "unknown"]);
const CONFIDENCE_LEVELS = new Set(["limited", "moderate", "strong"]);

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

function enumValue(value, allowed, message) {
  const normalized = String(value || "");
  if (!allowed.has(normalized)) throw new Error(message);
  return normalized;
}

function uniqueTextList(values, name, maximumItems, maximumLength, minimumItems = 0) {
  if (!Array.isArray(values) || values.length < minimumItems) throw new Error(`${name} requires at least ${minimumItems} item(s).`);
  if (values.length > maximumItems) throw new Error(`${name} can contain at most ${maximumItems} items.`);
  const normalized = values.map((value, index) => requiredText(value, `${name} item ${index + 1}`, maximumLength));
  if (new Set(normalized).size !== normalized.length) throw new Error(`${name} cannot contain duplicates.`);
  return normalized;
}

export function createDeidentifiedEvidence(values, options = {}) {
  exactKeys(values, new Set([
    "diagnosticId",
    "sourceResponseRef",
    "sourceQuestionId",
    "deidentifiedText",
    "redactionCategories",
    "disclosureRisk",
    "transformationNote"
  ]), "The evidence record");
  const redactionCategories = uniqueTextList(values.redactionCategories || [], "Redaction categories", 8, 30);
  if (redactionCategories.some((category) => !REDACTION_CATEGORIES.has(category))) {
    throw new Error("Select only supported redaction categories.");
  }
  const createdAt = nowIso(options.now);
  return {
    evidenceId: options.id || crypto.randomUUID(),
    evidenceVersion: EVIDENCE_VERSION,
    diagnosticId: requiredText(values.diagnosticId, "Diagnostic ID", 100),
    sourceResponseRef: requiredText(values.sourceResponseRef, "Source response reference", 120),
    sourceQuestionId: requiredText(values.sourceQuestionId, "Source question ID", 100),
    deidentifiedText: requiredText(values.deidentifiedText, "De-identified evidence", 3000, 20),
    redactionCategories,
    disclosureRisk: enumValue(values.disclosureRisk, DISCLOSURE_RISKS, "Select a valid disclosure-risk level."),
    transformationNote: requiredText(values.transformationNote, "Transformation note", 500),
    reviewStatus: "pending",
    reviewedBy: null,
    reviewNote: "",
    createdAt,
    reviewedAt: null
  };
}

export function reviewDeidentifiedEvidence(evidence, values, options = {}) {
  if (evidence.reviewStatus !== "pending") throw new Error("Only pending evidence can be reviewed.");
  exactKeys(values, new Set(["reviewerType", "decision", "reviewNote"]), "The disclosure review");
  const reviewerType = enumValue(values.reviewerType, REVIEWER_TYPES, "Select a valid reviewer type.");
  const decision = enumValue(values.decision, REVIEW_DECISIONS, "Select a valid disclosure decision.");
  if (evidence.disclosureRisk === "high" && reviewerType !== "human") {
    throw new Error("High-risk evidence requires human disclosure review.");
  }
  if (decision === "excluded" && !String(values.reviewNote || "").trim()) {
    throw new Error("Excluded evidence requires a review note.");
  }
  return {
    ...evidence,
    reviewStatus: decision,
    reviewedBy: reviewerType,
    reviewNote: optionalText(values.reviewNote, "Review note", 500),
    reviewedAt: nowIso(options.now)
  };
}

function approvedEvidenceMap(evidenceRecords) {
  if (!Array.isArray(evidenceRecords)) throw new Error("Approved evidence records are required.");
  return new Map(evidenceRecords.filter((record) => record.reviewStatus === "approved").map((record) => [record.evidenceId, record]));
}

export function createEvidenceTheme(values, evidenceRecords, options = {}) {
  exactKeys(values, new Set([
    "diagnosticId",
    "title",
    "summary",
    "domainIds",
    "perspectivePattern",
    "supportingEvidenceIds",
    "weakeningEvidenceIds",
    "confidence",
    "confidenceBasis"
  ]), "The evidence theme");
  const approved = approvedEvidenceMap(evidenceRecords);
  const supportingEvidenceIds = uniqueTextList(values.supportingEvidenceIds, "Supporting evidence", 30, 100, 2);
  const weakeningEvidenceIds = uniqueTextList(values.weakeningEvidenceIds || [], "Weakening evidence", 20, 100);
  for (const evidenceId of [...supportingEvidenceIds, ...weakeningEvidenceIds]) {
    if (!approved.has(evidenceId)) throw new Error("Themes may reference only approved de-identified evidence.");
  }
  const domainIds = uniqueTextList(values.domainIds, "Theme domains", 6, 30, 1);
  if (domainIds.some((domainId) => !DOMAINS.has(domainId))) throw new Error("Select only supported capacity domains.");
  return {
    themeId: options.id || crypto.randomUUID(),
    synthesisVersion: SYNTHESIS_VERSION,
    diagnosticId: requiredText(values.diagnosticId, "Diagnostic ID", 100),
    title: requiredText(values.title, "Theme title", 120),
    summary: requiredText(values.summary, "Theme summary", 1200, 40),
    domainIds,
    perspectivePattern: enumValue(values.perspectivePattern, PERSPECTIVE_PATTERNS, "Select a valid perspective pattern."),
    supportingEvidenceIds,
    weakeningEvidenceIds,
    confidence: enumValue(values.confidence, CONFIDENCE_LEVELS, "Select a valid theme confidence."),
    confidenceBasis: requiredText(values.confidenceBasis, "Theme confidence basis", 800, 20),
    createdAt: nowIso(options.now)
  };
}

function competingExplanation(value, index) {
  exactKeys(value, new Set(["statement", "supportingThemeIds", "evidenceNeeded"]), `Competing explanation ${index + 1}`);
  return {
    statement: requiredText(value.statement, `Competing explanation ${index + 1}`, 600, 20),
    supportingThemeIds: uniqueTextList(value.supportingThemeIds || [], `Competing explanation ${index + 1} themes`, 10, 100),
    evidenceNeeded: requiredText(value.evidenceNeeded, `Competing explanation ${index + 1} evidence needed`, 500, 20)
  };
}

export function createConstraintHypothesis(values, themes, options = {}) {
  exactKeys(values, new Set([
    "diagnosticId",
    "primaryDomainId",
    "statement",
    "supportingThemeIds",
    "weakeningThemeIds",
    "competingExplanations",
    "blindSpots",
    "confidence",
    "confidenceBasis",
    "interventionDirection"
  ]), "The constraint hypothesis");
  if (!Array.isArray(themes) || themes.length === 0) throw new Error("Evidence themes are required.");
  const themeById = new Map(themes.map((theme) => [theme.themeId, theme]));
  const supportingThemeIds = uniqueTextList(values.supportingThemeIds, "Supporting themes", 20, 100, 2);
  const weakeningThemeIds = uniqueTextList(values.weakeningThemeIds || [], "Weakening themes", 20, 100);
  const competingExplanations = Array.isArray(values.competingExplanations)
    ? values.competingExplanations.map(competingExplanation)
    : [];
  if (competingExplanations.length === 0) throw new Error("Include at least one competing explanation.");
  if (competingExplanations.length > 5) throw new Error("Include at most five competing explanations.");
  for (const themeId of [
    ...supportingThemeIds,
    ...weakeningThemeIds,
    ...competingExplanations.flatMap((explanation) => explanation.supportingThemeIds)
  ]) {
    if (!themeById.has(themeId)) throw new Error("Constraint hypotheses may reference only provided evidence themes.");
  }
  return {
    hypothesisId: options.id || crypto.randomUUID(),
    synthesisVersion: SYNTHESIS_VERSION,
    diagnosticId: requiredText(values.diagnosticId, "Diagnostic ID", 100),
    primaryDomainId: enumValue(values.primaryDomainId, DOMAINS, "Select a valid primary capacity domain."),
    statement: requiredText(values.statement, "Constraint hypothesis", 1000, 40),
    supportingThemeIds,
    weakeningThemeIds,
    competingExplanations,
    blindSpots: uniqueTextList(values.blindSpots, "Blind spots", 10, 500, 1),
    confidence: enumValue(values.confidence, CONFIDENCE_LEVELS, "Select a valid diagnostic confidence."),
    confidenceBasis: requiredText(values.confidenceBasis, "Diagnostic confidence basis", 1000, 40),
    interventionDirection: requiredText(values.interventionDirection, "Intervention direction", 1000, 40),
    status: "draft",
    createdAt: nowIso(options.now)
  };
}

export const diagnosticEvidence = Object.freeze({
  evidenceVersion: EVIDENCE_VERSION,
  synthesisVersion: SYNTHESIS_VERSION,
  redactionCategories: Object.freeze([...REDACTION_CATEGORIES]),
  disclosureRisks: Object.freeze([...DISCLOSURE_RISKS]),
  perspectivePatterns: Object.freeze([...PERSPECTIVE_PATTERNS]),
  confidenceLevels: Object.freeze([...CONFIDENCE_LEVELS])
});
