export const CAPACITY_SIGNAL_ASSESSMENT_VERSION = "2.0.0";
export const CAPACITY_SIGNAL_RESULT_VERSION = "2.0.0";

const RESPONSE_VALUES = new Set([1, 2, 3, 4, 5]);
const DEMAND_SOURCES = new Set([
  "growth-scale",
  "strategic-ambition",
  "organizational-change",
  "technology-ai",
  "acquisition-reorganization",
  "regulation-environment",
  "operating-model-complexity",
  "other"
]);
const TIME_HORIZONS = new Set(["now", "next-90-days", "next-12-months", "beyond-12-months"]);

const ITEMS = Object.freeze([
  item("demand-volume", "execution-demand", "The volume of work, decisions, or commitments the organization must carry is increasing.", ["volume"]),
  item("demand-variety", "execution-demand", "The variety of customers, products, markets, or operating situations is increasing.", ["variety"]),
  item("demand-interdependence", "execution-demand", "Execution increasingly depends on multiple teams, functions, locations, or partners moving together.", ["interdependence"]),
  item("demand-uncertainty-change", "execution-demand", "The organization must make consequential choices while conditions are uncertain or changing quickly.", ["uncertainty", "rate-of-change"]),

  item("friction-priority-churn", "friction", "Competing priorities repeatedly displace work that leadership previously described as important.", ["priority-attention"], "priority-churn"),
  item("friction-decision-delay", "friction", "Important decisions stall, escalate, or reopen after people believed they were settled.", ["authority-accountability", "information-sensemaking"], "decision-delay"),
  item("friction-information-reconstruction", "friction", "People reconstruct, reconcile, or chase information before they can act with confidence.", ["information-sensemaking"], "information-reconstruction"),
  item("friction-coordination-overhead", "friction", "Cross-functional work requires disproportionate meetings, follow-up, or repair to keep moving.", ["coordination", "authority-accountability"], "coordination-overhead"),
  item("friction-resource-displacement", "friction", "Urgent operating demands repeatedly displace strategic work or critical capability building.", ["resource-capability-deployment", "priority-attention"], "resource-displacement"),

  item("compensation-senior-escalation", "capacity-compensation", "Senior leaders routinely step into decisions or handoffs that should move without them.", ["authority-accountability", "priority-attention"], "senior-escalation"),
  item("compensation-meeting-load", "capacity-compensation", "Additional meetings are used to create clarity or ownership that normal workflows do not provide.", ["coordination", "information-sensemaking"], "meeting-load"),
  item("compensation-key-people", "capacity-compensation", "A small number of trusted people personally integrate work across organizational boundaries.", ["coordination", "resource-capability-deployment"], "key-person-dependency"),
  item("compensation-manual-workarounds", "capacity-compensation", "Shadow spreadsheets, manual reporting, or informal processes keep essential work functioning.", ["information-sensemaking", "coordination", "resource-capability-deployment"], "manual-workarounds"),
  item("compensation-extraordinary-effort", "capacity-compensation", "Results depend on longer hours, repeated rescue work, or effort that does not feel sustainable.", ["resource-capability-deployment", "priority-attention"], "extraordinary-effort"),

  item("behavior-priority-tradeoffs", "formal-lived-signal", "When priorities compete, people know which tradeoffs to make without waiting for translation.", ["priority-attention"], "priority-tradeoffs", true),
  item("behavior-authority-practice", "formal-lived-signal", "People use the decision authority they have been formally given without fear of being overruled or punished.", ["authority-accountability"], "formal-lived-authority", true),
  item("behavior-information-timing", "formal-lived-signal", "Relevant information reaches the people who must interpret and act on it while it is still useful.", ["information-sensemaking"], "information-timing", true),
  item("behavior-resource-fit", "formal-lived-signal", "People, expertise, time, technology, and data are deployed against the work leadership says matters most.", ["resource-capability-deployment", "coordination"], "resource-fit", true)
]);

const PATTERN_COPY = Object.freeze({
  "priority-churn": "Priority churn is displacing committed work.",
  "decision-delay": "Decisions are stalling, escalating, or reopening.",
  "information-reconstruction": "Usable information requires reconstruction before action.",
  "coordination-overhead": "Coordination effort is growing faster than the work it enables.",
  "resource-displacement": "Urgent work is displacing strategic or capability-building work.",
  "senior-escalation": "Senior attention is carrying routine operating ambiguity.",
  "meeting-load": "Meetings are compensating for missing clarity or ownership.",
  "key-person-dependency": "A small number of people are acting as informal integration infrastructure.",
  "manual-workarounds": "Manual and shadow systems are preserving essential execution.",
  "extraordinary-effort": "Performance depends on effort that may not be sustainable.",
  "priority-tradeoffs": "Formal priorities may not provide usable tradeoff guidance in practice.",
  "formal-lived-authority": "Formal authority may differ from the authority people can safely exercise.",
  "information-timing": "Information may not reach decision makers while it is still useful.",
  "resource-fit": "Resource deployment may not match stated priorities."
});

const MECHANISM_QUESTIONS = Object.freeze({
  "priority-attention": "What repeatedly receives attention when stated priorities collide with urgent work?",
  "authority-accountability": "Where does formal decision authority differ from who can actually decide without escalation?",
  "information-sensemaking": "What information must be reconstructed, interpreted, or validated before people can act?",
  coordination: "Where is coordination cost increasing faster than the value created by working together?",
  "resource-capability-deployment": "Which critical demands lack the people, expertise, time, technology, or data required to carry them?"
});

const ALTERNATIVE_EXPLANATIONS = Object.freeze({
  "priority-attention": "The pattern could reflect a strategy or market-choice problem rather than an operating-capacity constraint.",
  "authority-accountability": "Escalation could be appropriate because of risk, regulation, capability, or governance requirements.",
  "information-sensemaking": "Information difficulty could originate in technical failure, data quality, or unresolved strategic uncertainty.",
  coordination: "Coordination load could be necessary for the work rather than evidence of avoidable operating friction.",
  "resource-capability-deployment": "The issue could be insufficient economics, demand, or individual capability rather than organizational capacity."
});

function item(id, lens, prompt, mechanismIds, patternId = null, reverse = false) {
  return Object.freeze({ id, lens, prompt, mechanismIds: Object.freeze(mechanismIds), patternId, reverse });
}

function exactKeys(value, allowed, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} is required.`);
  if (Object.keys(value).some(key => !allowed.has(key))) throw new Error(`${label} contains unsupported fields.`);
}

function boundedText(value, label, minimum, maximum) {
  if (typeof value !== "string") throw new Error(`${label} is required.`);
  const clean = value.trim().replace(/\s+/g, " ");
  if (clean.length < minimum || clean.length > maximum) throw new Error(`${label} must be between ${minimum} and ${maximum} characters.`);
  return clean;
}

function signalValue(itemRecord, response) {
  return itemRecord.reverse ? 6 - response : response;
}

function evidenceLevel(values) {
  const pronounced = values.filter(value => value >= 4).length;
  if (pronounced >= Math.max(2, Math.ceil(values.length * .6))) return "pronounced";
  if (values.some(value => value >= 4) || values.filter(value => value === 3).length >= 2) return "emerging";
  return "limited";
}

function rankedPatterns(items, responses, maximum = 3) {
  return items
    .map(itemRecord => ({ item: itemRecord, value: signalValue(itemRecord, responses[itemRecord.id]) }))
    .filter(entry => entry.value >= 3 && entry.item.patternId)
    .sort((left, right) => right.value - left.value || left.item.id.localeCompare(right.item.id))
    .slice(0, maximum)
    .map(entry => Object.freeze({
      patternId: entry.item.patternId,
      statement: PATTERN_COPY[entry.item.patternId],
      evidenceLevel: entry.value >= 4 ? "pronounced" : "emerging",
      sourceItemIds: Object.freeze([entry.item.id])
    }));
}

function implicatedMechanisms(entries) {
  const counts = new Map();
  entries.forEach(entry => {
    entry.item.mechanismIds.forEach(id => counts.set(id, (counts.get(id) || 0) + entry.value));
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([id]) => id);
}

export function capacitySignalQuestionnaire() {
  return Object.freeze({
    assessmentVersion: CAPACITY_SIGNAL_ASSESSMENT_VERSION,
    responseScale: Object.freeze([
      Object.freeze({ value: 1, label: "Rarely true" }),
      Object.freeze({ value: 2, label: "Occasionally true" }),
      Object.freeze({ value: 3, label: "Sometimes true" }),
      Object.freeze({ value: 4, label: "Often true" }),
      Object.freeze({ value: 5, label: "Consistently true" })
    ]),
    items: ITEMS
  });
}

export function createCapacitySignalAssessment(values, options = {}) {
  exactKeys(values, new Set(["context", "responses"]), "Assessment");
  exactKeys(values.context, new Set(["demandSource", "executionPriority", "timeHorizon", "organizationSize", "respondentRole"]), "Execution context");
  if (!DEMAND_SOURCES.has(values.context.demandSource)) throw new Error("Select what is changing the execution demand.");
  if (!TIME_HORIZONS.has(values.context.timeHorizon)) throw new Error("Select a valid execution time horizon.");
  const executionPriority = boundedText(values.context.executionPriority, "Execution priority", 40, 500);
  const organizationSize = typeof values.context.organizationSize === "string" ? values.context.organizationSize.trim().slice(0, 80) : "";
  const respondentRole = typeof values.context.respondentRole === "string" ? values.context.respondentRole.trim().slice(0, 80) : "";

  exactKeys(values.responses, new Set(ITEMS.map(itemRecord => itemRecord.id)), "Assessment responses");
  if (Object.keys(values.responses).length !== ITEMS.length) throw new Error(`Answer all ${ITEMS.length} assessment items.`);
  ITEMS.forEach(itemRecord => {
    if (!RESPONSE_VALUES.has(values.responses[itemRecord.id])) throw new Error(`Select a valid response for ${itemRecord.id}.`);
  });

  const demandItems = ITEMS.filter(itemRecord => itemRecord.lens === "execution-demand");
  const frictionItems = ITEMS.filter(itemRecord => itemRecord.lens === "friction");
  const compensationItems = ITEMS.filter(itemRecord => itemRecord.lens === "capacity-compensation");
  const behaviorItems = ITEMS.filter(itemRecord => itemRecord.lens === "formal-lived-signal");
  const frictionEntries = frictionItems.map(itemRecord => ({ item: itemRecord, value: signalValue(itemRecord, values.responses[itemRecord.id]) }));
  const compensationEntries = compensationItems.map(itemRecord => ({ item: itemRecord, value: signalValue(itemRecord, values.responses[itemRecord.id]) }));
  const behaviorEntries = behaviorItems.map(itemRecord => ({ item: itemRecord, value: signalValue(itemRecord, values.responses[itemRecord.id]) }));
  const mechanismOrder = implicatedMechanisms([...frictionEntries, ...compensationEntries, ...behaviorEntries]).slice(0, 3);
  const frictionPatterns = rankedPatterns(frictionItems, values.responses);
  const compensationPatterns = rankedPatterns(compensationItems, values.responses);
  const operatingSignals = rankedPatterns(behaviorItems, values.responses);
  const anyMaterialSignal = [...frictionPatterns, ...compensationPatterns, ...operatingSignals].length > 0;

  return Object.freeze({
    resultVersion: CAPACITY_SIGNAL_RESULT_VERSION,
    assessmentVersion: CAPACITY_SIGNAL_ASSESSMENT_VERSION,
    resultId: options.id || crypto.randomUUID(),
    completedAt: options.completedAt || new Date().toISOString(),
    context: Object.freeze({
      demandSource: values.context.demandSource,
      executionPriority,
      timeHorizon: values.context.timeHorizon,
      organizationSize,
      respondentRole
    }),
    executionDemand: Object.freeze({
      evidenceLevel: evidenceLevel(demandItems.map(itemRecord => values.responses[itemRecord.id])),
      dimensionsObserved: Object.freeze(demandItems
        .filter(itemRecord => values.responses[itemRecord.id] >= 4)
        .flatMap(itemRecord => itemRecord.mechanismIds)
        .filter((value, index, all) => all.indexOf(value) === index)),
      sourceItemIds: Object.freeze(demandItems.map(itemRecord => itemRecord.id))
    }),
    frictionPatterns: Object.freeze(frictionPatterns),
    compensationPatterns: Object.freeze(compensationPatterns),
    operatingSignals: Object.freeze(operatingSignals),
    questionsRaised: Object.freeze(mechanismOrder.map(id => MECHANISM_QUESTIONS[id])),
    alternativeExplanations: Object.freeze(mechanismOrder.slice(0, 2).map(id => ALTERNATIVE_EXPLANATIONS[id])),
    boundedFirstAction: anyMaterialSignal
      ? "Choose one recurring instance of the strongest pattern and document the demand, consequence, workaround, decision owner, information required, and people carrying the extra load. Observe before prescribing."
      : "Identify one execution demand expected to increase and document how priorities, authority, information, coordination, and resources currently carry it before pressure rises.",
    diagnosticNeed: anyMaterialSignal
      ? "A Diagnostic would test these signals across confidential perspectives, formal and lived operating evidence, competing explanations, and the complexity the organization must carry."
      : "The Assessment did not surface a pronounced pattern. A Diagnostic may still be warranted when the decision is consequential, the demand is changing quickly, or current performance depends on hidden compensation.",
    boundary: "This Capacity Signal Brief is directional evidence from one perspective. It does not measure Organizational Capacity, identify a constrained mechanism, establish causality, or prescribe an intervention."
  });
}

export const capacitySignalAssessmentPolicy = Object.freeze({
  itemCount: ITEMS.length,
  lenses: Object.freeze(["execution-demand", "friction", "capacity-compensation", "formal-lived-signal"]),
  capacityScoreProduced: false,
  mechanismScoresProduced: false,
  constraintDeclared: false,
  interventionPrescribed: false,
  legacyComparisonAllowed: false
});
