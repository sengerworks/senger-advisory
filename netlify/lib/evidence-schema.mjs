export const ASSESSMENT_VERSION = "1.0.0";
export const SCORING_VERSION = "0.1.0";

const EVENTS = new Set(["start", "completion", "abandonment", "report_action", "feedback"]);
const BANDS = new Set(["Constrained", "Strained", "Developing", "Enabling"]);
const DOMAINS = ["leadership", "decisions", "rhythm", "alignment", "technology", "culture"];
const CONTEXT_OPTIONS = {
  organizationSize: new Set(["Fewer than 25 people", "25–49 people", "50–149 people", "150–399 people", "400 or more people"]),
  respondentRole: new Set(["CEO or founder", "Executive leader", "Functional leader", "People or operations leader", "Advisor or board member"]),
  growthPressure: new Set(["Stable", "Increasing", "High", "Transformational change"])
};

const isObject = value => value !== null && typeof value === "object" && !Array.isArray(value);
const isIntegerBetween = (value, minimum, maximum) => Number.isInteger(value) && value >= minimum && value <= maximum;
const isUuid = value => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

function hasOnlyKeys(object, allowed) {
  return Object.keys(object).every(key => allowed.has(key));
}

function validateContext(context) {
  if (!isObject(context) || !hasOnlyKeys(context, new Set(Object.keys(CONTEXT_OPTIONS)))) return false;
  return Object.entries(context).every(([key, value]) => value === "" || CONTEXT_OPTIONS[key].has(value));
}

function validateScores(scores) {
  if (!isObject(scores) || Object.keys(scores).length !== DOMAINS.length) return false;
  return DOMAINS.every(domain => isIntegerBetween(scores[domain], 0, 100));
}

export function validateEvidencePayload(payload) {
  if (!isObject(payload)) return { ok: false, error: "Invalid payload." };
  if (payload.website) return { ok: false, error: "Invalid submission." };
  if (!EVENTS.has(payload.event)) return { ok: false, error: "Invalid event." };
  if (!isUuid(payload.sessionId)) return { ok: false, error: "Invalid session." };
  if (payload.assessmentVersion !== ASSESSMENT_VERSION || payload.scoringVersion !== SCORING_VERSION) {
    return { ok: false, error: "Unsupported assessment version." };
  }

  const common = ["event", "sessionId", "assessmentVersion", "scoringVersion", "website"];
  const allowedByEvent = {
    start: new Set(common),
    completion: new Set([...common, "scores", "overall", "band", "context", "durationSeconds"]),
    abandonment: new Set([...common, "lastDomain", "durationSeconds"]),
    report_action: new Set([...common, "durationSeconds"]),
    feedback: new Set([...common, "accuracy", "feedback"])
  };
  if (!hasOnlyKeys(payload, allowedByEvent[payload.event])) return { ok: false, error: "Unexpected data." };

  if (payload.event === "completion") {
    if (!validateScores(payload.scores)) return { ok: false, error: "Invalid domain scores." };
    if (!isIntegerBetween(payload.overall, 0, 100) || !BANDS.has(payload.band)) return { ok: false, error: "Invalid result." };
    if (!validateContext(payload.context)) return { ok: false, error: "Invalid context." };
  }
  if (["completion", "abandonment", "report_action"].includes(payload.event)
    && !isIntegerBetween(payload.durationSeconds, 0, 86400)) {
    return { ok: false, error: "Invalid duration." };
  }
  if (payload.event === "abandonment" && !isIntegerBetween(payload.lastDomain, 1, 6)) {
    return { ok: false, error: "Invalid progress." };
  }
  if (payload.event === "feedback") {
    if (!isIntegerBetween(payload.accuracy, 1, 5)) return { ok: false, error: "Select an accuracy rating." };
    if (typeof payload.feedback !== "string" || payload.feedback.length > 1000) return { ok: false, error: "Feedback is too long." };
  }

  const clean = { ...payload };
  delete clean.website;
  if (clean.feedback) clean.feedback = clean.feedback.trim();
  return { ok: true, value: clean };
}
