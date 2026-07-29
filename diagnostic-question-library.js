const QUESTION_LIBRARY_VERSION = "1.0.0";

export const diagnosticQuestionTemplates = Object.freeze([
  { id: "strategy-translation", domainId: "alignment", objectiveId: "operating-example", question: "Think of a recent strategic priority. How did it become concrete decisions, ownership, and work across the organization?" },
  { id: "leadership-ambiguity", domainId: "leadership", objectiveId: "operating-example", question: "Describe a recent situation in which leaders faced meaningful ambiguity. How was direction established?" },
  { id: "leadership-bottleneck", domainId: "leadership", objectiveId: "consequence", question: "Where does work depend on senior leaders stepping in, and what happens while the organization waits?" },
  { id: "decision-example", domainId: "decisions", objectiveId: "operating-example", question: "Walk through a recent consequential decision from the moment it surfaced to the moment action began." },
  { id: "decision-escalation", domainId: "decisions", objectiveId: "recurrence-pattern", question: "Which decisions repeatedly escalate, reopen, or stall, and what pattern do you notice across them?" },
  { id: "decision-information", domainId: "decisions", objectiveId: "enabling-condition", question: "When a decision moves well, what information, authority, and coordination are present?" },
  { id: "meeting-value", domainId: "rhythm", objectiveId: "consequence", question: "Which recurring meetings materially improve execution, and which ones mainly absorb coordination effort?" },
  { id: "follow-through", domainId: "rhythm", objectiveId: "recurrence-pattern", question: "After priorities and commitments are set, what reliably drives follow-through and where does it break down?" },
  { id: "cross-functional-handoff", domainId: "alignment", objectiveId: "operating-example", question: "Describe a recent cross-functional handoff. Where did shared understanding hold, drift, or require repair?" },
  { id: "tradeoff-clarity", domainId: "alignment", objectiveId: "enabling-condition", question: "How do people know which tradeoffs to make when priorities compete?" },
  { id: "technology-workflow", domainId: "technology", objectiveId: "operating-example", question: "Where does technology meaningfully improve how work moves, and where does the surrounding workflow limit its value?" },
  { id: "information-flow", domainId: "technology", objectiveId: "enabling-condition", question: "What critical information reaches decision makers too late, in the wrong form, or through unnecessary manual effort?" },
  { id: "constructive-candor", domainId: "culture", objectiveId: "enabling-condition", question: "What happens when someone raises a concern, challenges a plan, or shares evidence leaders may not want to hear?" },
  { id: "accountability-pattern", domainId: "culture", objectiveId: "recurrence-pattern", question: "When an important commitment is missed, how does the organization respond and what tends to happen next?" },
  { id: "change-absorption", domainId: "culture", objectiveId: "consequence", question: "How is the organization responding to the volume and pace of recent change, and where is strain becoming visible?" },
  { id: "counterexample", domainId: "alignment", objectiveId: "disconfirming-evidence", question: "Where is execution working notably well despite current pressure, and what might that suggest about the problem?" },
  { id: "prior-intervention", domainId: "leadership", objectiveId: "intervention-history", question: "What has already been tried to address the concern, and what changed, persisted, or became more complicated?" },
  { id: "future-constraint", domainId: "rhythm", objectiveId: "consequence", question: "If the organization continues operating this way for the next year, what is most likely to constrain strategy?" }
]);

export const recommendedProtocolTemplateIds = Object.freeze([
  "strategy-translation",
  "leadership-ambiguity",
  "leadership-bottleneck",
  "decision-example",
  "decision-escalation",
  "decision-information",
  "meeting-value",
  "follow-through",
  "cross-functional-handoff",
  "technology-workflow",
  "information-flow",
  "constructive-candor",
  "change-absorption",
  "counterexample",
  "prior-intervention"
]);

export const diagnosticQuestionLibrary = Object.freeze({
  version: QUESTION_LIBRARY_VERSION,
  domains: Object.freeze(["leadership", "decisions", "rhythm", "alignment", "technology", "culture"]),
  evidenceObjectives: Object.freeze([
    "operating-example",
    "recurrence-pattern",
    "consequence",
    "enabling-condition",
    "disconfirming-evidence",
    "intervention-history"
  ])
});
