import test from "node:test";
import assert from "node:assert/strict";
import { createDiagnostic } from "../diagnostic-lifecycle-engine.js";
import {
  approveDiagnosticContextBrief,
  approveParticipantPlan,
  createDiagnosticContextBrief,
  createParticipantPlan
} from "../diagnostic-discovery-engine.js";
import { diagnosticQuestionTemplates, recommendedProtocolTemplateIds } from "../diagnostic-question-library.js";
import { approveDiagnosticProtocol, createDiagnosticProtocol } from "../diagnostic-protocol-engine.js";
import {
  createDiagnosticInterview,
  saveCoreAnswer,
  submitDiagnosticInterview
} from "../diagnostic-interview-engine.js";
import {
  createConstraintHypothesis,
  createDeidentifiedEvidence,
  createEvidenceTheme,
  reviewDeidentifiedEvidence
} from "../diagnostic-evidence-engine.js";
import {
  createDiagnosticRecord,
  createLeadershipValidation,
  decideLeadershipValidation,
  validateDiagnosticRecord
} from "../diagnostic-decision-engine.js";
import { DIAGNOSTIC_CONFIDENTIALITY_FLOOR } from "../netlify/lib/workspace-diagnostic-leadership-validation.mjs";

const now = new Date("2026-08-10T16:00:00.000Z");
const diagnosticId = "90000000-0000-4000-8000-000000000001";
const workspaceId = "90000000-0000-4000-8000-000000000002";
const templates = new Map(diagnosticQuestionTemplates.map(value => [value.id, value]));

const perspectives = [
  ["enterprise", "strategy", "executive-leadership"],
  ["functional", "coordination", "operations"],
  ["functional", "coordination", "people"],
  ["operational", "delivery", "commercial"],
  ["operational", "delivery", "product-service"]
];

function answer(participantIndex, questionId) {
  const examples = [
    "A routine client commitment returned to the executive team after Sales and Product used different approval rules, delaying the response by nine working days.",
    "A cross-functional release paused because the accountable manager had responsibility for timing but not authority to resolve the commercial tradeoff.",
    "Operating data arrived in separate reports, so leaders debated whose numbers were correct before deciding how to allocate engineering capacity.",
    "The coordination meeting produced agreement, but no single owner or decision deadline was recorded, causing the same issue to reopen the following week.",
    "A capable delivery team absorbed repeated custom requests, leaving insufficient capacity for the standardized platform work leadership had prioritized."
  ];
  return `${examples[participantIndex]} For ${questionId}, the observable consequence was slower execution, repeated escalation, and avoidable rework across functions.`;
}

test("disposable five-participant POC completes the governed diagnostic and stops before paid delivery", () => {
  const diagnostic = createDiagnostic({ workspaceId, route: "automated", entitlementType: "poc" }, { now, id: diagnosticId });
  assert.equal(diagnostic.entitlementType, "poc");

  const context = approveDiagnosticContextBrief(createDiagnosticContextBrief({
    diagnosticId,
    organizationSizeBand: "150-399",
    sponsorPerspective: "founder-ceo",
    sponsorRoleTitle: "Chief Executive Officer",
    sponsorOrganizationalLevel: "enterprise",
    sponsorFunction: "enterprise-leadership",
    sponsorResponsibility: "Enterprise strategy, renewals, platform direction, and executive alignment.",
    diagnosticScopeType: "cross-functional-system",
    diagnosticScopeName: "Platform-first commercial execution",
    diagnosticScopeBoundary: "Sales, Product, Engineering, and Customer Success work affecting platform commitments and renewals.",
    crossBoundaryDependencies: "Commercial promises, product decision rights, engineering capacity, and customer-support handoffs.",
    guidanceSessionScheduledFor: "2026-08-12T16:00:00.000Z",
    guidanceSessionAcknowledged: true,
    organizationContext: "A scaling software company is moving from custom delivery to a standardized enterprise platform.",
    strategicPriority: "Protect the core platform roadmap while stabilizing enterprise renewals and cross-functional execution.",
    triggeringConcern: "Custom commitments consume scarce engineering capacity while renewal risk and support delays increase.",
    decisionsAtRisk: "Whether to enforce a permanent ceiling on custom work and a Product-Engineering gate on commercial proposals.",
    recentChanges: ["A product approval gate was introduced.", "Regional leaders received additional decision rights."],
    priorInterventions: ["A voluntary capacity cap did not change commercial behavior."],
    knownSensitivities: "Commercial incentives and co-founder history make the decision politically sensitive.",
    decisionNeeded: "Determine which operating constraint must change before the organization can execute a platform-first strategy."
  }, { now, id: "brief-rehearsal" }), { approvalNote: "The disposable sponsor confirmed this bounded test context." }, { now });

  const plan = approveParticipantPlan(createParticipantPlan({
    diagnosticId,
    targetLeadershipLevels: ["enterprise", "functional", "operational"],
    targetExecutionProximities: ["strategy", "coordination", "delivery"],
    targetFunctionalLenses: ["executive-leadership", "operations", "people", "commercial", "product-service"],
    participantSlots: perspectives.map((values, index) => ({
      slotId: `rehearsal-slot-${index + 1}`,
      leadershipLevel: values[0],
      executionProximity: values[1],
      functionalLens: values[2]
    }))
  }, { now, id: "plan-rehearsal" }), { approvalNote: "Five distinct execution perspectives cover the decision under review." }, { now });
  assert.equal(plan.participantSlots.length, 5);
  assert.equal(plan.participantSlots.some(slot => "email" in slot || "name" in slot), false);

  const protocol = approveDiagnosticProtocol(createDiagnosticProtocol({
    diagnosticId,
    contextBriefId: context.contextBriefId,
    participantPlanId: plan.participantPlanId,
    questions: recommendedProtocolTemplateIds.map(templateId => ({
      templateId,
      questionText: templates.get(templateId).question,
      contextualizationNote: "Common governed wording for the disposable rehearsal."
    }))
  }, { now, id: "protocol-rehearsal" }), { approvalNote: "One common protocol is approved for every rehearsal participant." }, { now });

  const interviews = perspectives.map((_, participantIndex) => {
    let interview = createDiagnosticInterview(protocol, {
      diagnosticId,
      collectionMode: "automated-written",
      participantNoticeAccepted: true
    }, { now, id: `interview-rehearsal-${participantIndex + 1}` });
    for (const question of protocol.questions) {
      interview = saveCoreAnswer(interview, protocol, {
        questionId: question.questionId,
        answerText: answer(participantIndex, question.questionId)
      }, { now });
    }
    return submitDiagnosticInterview(interview, protocol, { now });
  });
  assert.equal(interviews.length, DIAGNOSTIC_CONFIDENTIALITY_FLOOR);
  assert.equal(interviews.slice(0, 4).length < DIAGNOSTIC_CONFIDENTIALITY_FLOOR, true, "four completed perspectives remain withheld");
  assert.equal(interviews.every(value => value.status === "submitted"), true);
  assert.equal(interviews.some(value => "participantEmail" in value || "participantName" in value), false);

  const evidence = interviews.flatMap((interview, participantIndex) => ["q-03", "q-09"].map((questionId, evidenceIndex) => {
    const created = createDeidentifiedEvidence({
      diagnosticId,
      sourceResponseRef: `${interview.interviewInstanceId}:${questionId}`,
      sourceQuestionId: questionId,
      deidentifiedText: `${answer(participantIndex, questionId)} Identifying names, locations, and client details were removed while the operating sequence was preserved.`,
      redactionCategories: ["person", "client", "location"],
      disclosureRisk: evidenceIndex === 0 ? "medium" : "low",
      transformationNote: "Removed identifying detail while preserving the decision, handoff, consequence, and competing explanation."
    }, { now, id: `evidence-${participantIndex + 1}-${evidenceIndex + 1}` });
    return reviewDeidentifiedEvidence(created, {
      reviewerType: "human",
      decision: "approved",
      reviewNote: "The disposable review confirms the operating meaning remains useful without participant identity."
    }, { now });
  }));
  assert.equal(evidence.length, 10);
  assert.equal(evidence.every(value => value.reviewStatus === "approved"), true);

  const authorityTheme = createEvidenceTheme({
    diagnosticId,
    title: "Authority repeatedly returns upward",
    summary: "Responsibility is distributed more broadly than authority, so recurring tradeoffs return to senior leaders and wait for attention.",
    domainIds: ["leadership", "decisions"],
    perspectivePattern: "convergent",
    supportingEvidenceIds: evidence.filter((_, index) => index % 2 === 0).map(value => value.evidenceId),
    weakeningEvidenceIds: [],
    confidence: "strong",
    confidenceBasis: "The same authority pattern appears across all five approved perspectives."
  }, evidence, { now, id: "theme-authority" });
  const coordinationTheme = createEvidenceTheme({
    diagnosticId,
    title: "Shared intent does not become a governed handoff",
    summary: "Functions understand the platform priority but use incompatible decision information, ownership, and timing rules during execution.",
    domainIds: ["rhythm", "alignment"],
    perspectivePattern: "mixed",
    supportingEvidenceIds: evidence.filter((_, index) => index % 2 === 1).map(value => value.evidenceId),
    weakeningEvidenceIds: [evidence[1].evidenceId],
    confidence: "moderate",
    confidenceBasis: "Every function reports handoff friction, while its form and consequence vary by proximity to delivery."
  }, evidence, { now, id: "theme-coordination" });
  const themes = [authorityTheme, coordinationTheme];
  const hypothesis = createConstraintHypothesis({
    diagnosticId,
    primaryDomainId: "decisions",
    statement: "Decision authority and cross-functional operating rules have not evolved with the platform strategy, forcing recurring tradeoffs back to senior leadership.",
    supportingThemeIds: themes.map(value => value.themeId),
    weakeningThemeIds: [coordinationTheme.themeId],
    competingExplanations: [{
      statement: "The delay may be driven primarily by fragmented operating information rather than authority alone.",
      supportingThemeIds: [coordinationTheme.themeId],
      evidenceNeeded: "Compare decision latency when required capacity, customer-impact, and roadmap information is complete at the point of decision."
    }],
    blindSpots: ["The disposable cohort does not test an external customer or partner perspective."],
    confidence: "moderate",
    confidenceBasis: "Five perspectives converge on escalation while mixed coordination evidence keeps an information-quality explanation plausible.",
    interventionDirection: "Test explicit authority thresholds and a shared decision-information standard for recurring custom-work tradeoffs before prescribing structural change."
  }, themes, { now, id: "hypothesis-rehearsal" });

  const record = createDiagnosticRecord({
    diagnosticId,
    contextBriefId: context.contextBriefId,
    executiveFinding: "The platform-first strategy is constrained by decision authority and cross-functional operating rules that still reflect a custom-services model.",
    whyNow: "Renewal risk and roadmap delay make continued informal escalation materially expensive.",
    strategicExposure: "Leadership attention, engineering capacity, enterprise retention, and the core platform roadmap remain exposed.",
    operatingSymptoms: ["Recurring custom-work decisions escalate.", "Handoffs reopen after apparent agreement."],
    alternativeInterventionsConsidered: ["Add another management layer.", "Install workflow technology without changing authority or information requirements."]
  }, hypothesis, themes, { now, id: "finding-rehearsal" });
  const leadership = createLeadershipValidation(record, [{
    validationResponseRef: "disposable-sponsor-validation",
    resonance: "supports",
    completeness: "complete-enough",
    surprised: true,
    missingEvidence: "",
    materialObjection: false,
    objection: ""
  }], { now, id: "leadership-validation-rehearsal" });
  const accepted = decideLeadershipValidation(leadership, {
    decision: "accepted",
    objectionResolutions: [],
    decisionNote: "The disposable sponsor accepts the governed finding and Intervention Direction for POC closeout."
  }, { now });
  const validated = validateDiagnosticRecord(record, accepted, { now });
  assert.equal(validated.status, "validated");
  assert.equal(validated.interventionDirection.includes("Test explicit authority thresholds"), true);

  const pocResult = Object.freeze({
    state: "poc-complete",
    finding: validated.executiveFinding,
    interventionDirection: validated.interventionDirection,
    confidentiality: Object.freeze({ completed: interviews.length, threshold: DIAGNOSTIC_CONFIDENTIALITY_FLOOR, rawResponsesExcluded: true }),
    pocBoundary: "intervention-directions",
    nextStep: "paid-activation"
  });
  assert.deepEqual(pocResult.confidentiality, { completed: 5, threshold: 5, rawResponsesExcluded: true });
  assert.equal(pocResult.pocBoundary, "intervention-directions");
  assert.equal(pocResult.nextStep, "paid-activation");
  assert.equal("implementationPlan" in pocResult || "trainingContent" in pocResult || "coachingPlan" in pocResult, false);
});
