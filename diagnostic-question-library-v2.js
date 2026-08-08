export const DIAGNOSTIC_QUESTION_LIBRARY_VERSION_V2 = "2.0.0";

export const diagnosticQuestionTemplatesV2 = Object.freeze([
  template("execution-demand-translation", "complexity-demand", ["priority-attention", "authority-accountability", "coordination"], "Think of the execution commitment at the center of this diagnostic. How has it changed what the organization must prioritize, decide, coordinate, understand, or resource?"),
  template("complexity-change", "complexity-demand", [], "Where have volume, variety, interdependence, uncertainty, or rate of change increased most materially, and what evidence makes that visible?"),
  template("necessary-unnecessary", "complexity-classification", [], "Which parts of the current complexity are inherent to the strategy or environment, and which appear to be created by the organization itself?"),
  template("signal-consequence", "signal-consequence", [], "Describe a recent instance when work became disproportionately harder, slower, or less reliable. What happened as a result?"),
  template("priority-attention", "mechanism-evidence", ["priority-attention"], "When important demands compete, how are tradeoffs made and where does organizational attention actually go?"),
  template("authority-accountability", "mechanism-evidence", ["authority-accountability"], "Walk through a consequential decision from the moment it surfaced to action. Who could decide in practice, and who remained accountable?"),
  template("information-sensemaking", "mechanism-evidence", ["information-sensemaking"], "What information had to move or be interpreted for a recent decision, and where did understanding form, drift, or require reconstruction?"),
  template("coordination", "mechanism-evidence", ["coordination"], "Describe a recent interdependent workflow. What synchronized the work, and where did coordination cost become disproportionate?"),
  template("resource-deployment", "mechanism-evidence", ["resource-capability-deployment"], "How were people, expertise, time, technology, data, and capital allocated against the most important demand, and where did fit break down?"),
  template("mechanism-interaction", "mechanism-interaction", ["priority-attention", "authority-accountability", "information-sensemaking", "coordination", "resource-capability-deployment"], "Where does a problem in one part of the operating system create strain elsewhere? Walk through the sequence rather than naming a single cause."),
  template("capacity-compensation", "compensation", [], "Where are leaders or employees using escalation, extra meetings, workarounds, manual systems, longer hours, or personal heroics to preserve performance?"),
  template("formal-lived", "formal-lived", ["authority-accountability", "priority-attention", "coordination"], "Where do formal roles, decision rights, processes, or priorities differ from what people can actually do in practice?"),
  template("leadership-culture-incentives", "cross-cutting-condition", [], "How do leadership behavior, cultural expectations, or incentives reinforce or weaken the way the operating system is intended to work?"),
  template("counterexample", "disconfirming-evidence", [], "Where is execution working well under similar pressure, and what does that evidence challenge about the emerging explanation?"),
  template("non-capacity-alternative", "capacity-boundary", [], "What evidence would suggest this is primarily a strategy, market, individual, technical, economic, or other non-capacity problem?"),
  template("prior-intervention", "intervention-history", [], "What has already been tried, what changed, what persisted, and what new complexity or compensation did the intervention create?"),
  template("adaptive-capacity", "adaptive-observation", [], "When leaders recognized that the operating system no longer fit the demand, what helped or prevented them from changing it?"),
  template("evidence-gap", "evidence-gap", [], "What important perspective, operating evidence, or contradictory case is still missing from this diagnostic?"),
  template("future-demand", "complexity-demand", [], "If the organization succeeds in its stated priority, what new complexity will the operating system need to carry next?")
]);

function template(id, evidenceLayerId, mechanismIds, question) {
  return Object.freeze({ id, evidenceLayerId, mechanismIds: Object.freeze(mechanismIds), question });
}

export const recommendedDiagnosticTemplateIdsV2 = Object.freeze([
  "execution-demand-translation", "complexity-change", "necessary-unnecessary", "signal-consequence",
  "priority-attention", "authority-accountability", "information-sensemaking", "coordination", "resource-deployment",
  "mechanism-interaction", "capacity-compensation", "formal-lived", "leadership-culture-incentives",
  "counterexample", "non-capacity-alternative", "prior-intervention", "adaptive-capacity", "evidence-gap"
]);

export const diagnosticQuestionLibraryV2 = Object.freeze({
  version: DIAGNOSTIC_QUESTION_LIBRARY_VERSION_V2,
  mechanisms: Object.freeze(["priority-attention", "authority-accountability", "information-sensemaking", "coordination", "resource-capability-deployment"]),
  requiredEvidenceLayers: Object.freeze(["complexity-demand", "complexity-classification", "signal-consequence", "mechanism-evidence", "mechanism-interaction", "compensation", "formal-lived", "cross-cutting-condition", "disconfirming-evidence", "capacity-boundary", "intervention-history", "evidence-gap"]),
  researchEvidenceLayers: Object.freeze(["adaptive-observation"]),
  minimumQuestions: 12,
  maximumQuestions: 18,
  equalMechanismQuestionCountRequired: false
});
