const elements = {
  surface: document.querySelector("[data-workspace-surface]"),
  loading: document.querySelector("[data-loading]"),
  error: document.querySelector("[data-error]"),
  errorMessage: document.querySelector("[data-error-message]"),
  retry: document.querySelector("[data-retry]"),
  signInState: document.querySelector("[data-sign-in-state]"),
  signInMount: document.querySelector("[data-sign-in-mount]"),
  membershipState: document.querySelector("[data-membership-state]"),
  refresh: document.querySelector("[data-refresh]"),
  readyState: document.querySelector("[data-ready-state]"),
  sponsorGuide: document.querySelector("[data-sponsor-guide]"),
  goToCurrentStep: document.querySelector("[data-go-to-current-step]"),
  account: document.querySelector("[data-account]"),
  accountLabel: document.querySelector("[data-account-label]"),
  signOut: document.querySelector("[data-sign-out]"),
  roleLabel: document.querySelector("[data-role-label]"),
  organizationName: document.querySelector("[data-organization-name]"),
  focusTitle: document.querySelector("[data-focus-title]"),
  focusDescription: document.querySelector("[data-focus-description]"),
  primaryAction: document.querySelector("[data-primary-action]"),
  diagnosticPanel: document.querySelector("[data-diagnostic-panel]"),
  journeyChrome: document.querySelector("[data-journey-chrome]"),
  journeyHome: document.querySelector("[data-journey-home]"),
  journeyStepLabel: document.querySelector("[data-journey-step-label]"),
  journeyStepName: document.querySelector("[data-journey-step-name]"),
  journeyProgress: document.querySelector("[data-journey-progress]"),
  journeyProgressFill: document.querySelector("[data-journey-progress-fill]"),
  diagnosticMessage: document.querySelector("[data-diagnostic-message]"),
  diagnosticList: document.querySelector("[data-diagnostic-list]"),
  diagnosticEmpty: document.querySelector("[data-diagnostic-empty]"),
  diagnosticContext: document.querySelector("[data-diagnostic-context]"),
  diagnosticContextTitle: document.querySelector("[data-diagnostic-context-title]"),
  diagnosticContextIntroduction: document.querySelector("[data-diagnostic-context-introduction]"),
  diagnosticContextForm: document.querySelector("[data-diagnostic-context-form]"),
  diagnosticContextApproved: document.querySelector("[data-diagnostic-context-approved]"),
  diagnosticContextSummary: document.querySelector("[data-diagnostic-context-summary]"),
  designParticipantPerspectives: document.querySelector("[data-design-participant-perspectives]"),
  reviewApprovedContext: document.querySelector("[data-review-approved-context]"),
  returnToWorkspace: document.querySelector("[data-return-to-workspace]"),
  diagnosticContextMessage: document.querySelector("[data-diagnostic-context-message]"),
  approveDiagnosticContext: document.querySelector("[data-approve-diagnostic-context]"),
  contextSteps: [...document.querySelectorAll("[data-context-step]")],
  contextReview: document.querySelector("[data-context-review]"),
  contextReviewList: document.querySelector("[data-context-review-list]"),
  contextApprovalNoteCount: document.querySelector("[data-context-approval-note-count]"),
  contextAiSynthesis: document.querySelector("[data-context-ai-synthesis]"),
  contextAiStatus: document.querySelector("[data-context-ai-status]"),
  contextAiContent: document.querySelector("[data-context-ai-content]"),
  contextProgressLabel: document.querySelector("[data-context-progress-label]"),
  contextProgressName: document.querySelector("[data-context-progress-name]"),
  contextProgressBar: document.querySelector("[data-context-progress-bar]"),
  contextBack: document.querySelector("[data-context-back]"),
  contextNext: document.querySelector("[data-context-next]"),
  closeDiagnosticContext: document.querySelector("[data-close-diagnostic-context]"),
  participantDesign: document.querySelector("[data-participant-design]"),
  participantDesignForm: document.querySelector("[data-participant-design-form]"),
  perspectiveSteps: [...document.querySelectorAll("[data-perspective-step]")],
  perspectiveProgressLabel: document.querySelector("[data-perspective-progress-label]"),
  perspectiveProgressName: document.querySelector("[data-perspective-progress-name]"),
  perspectiveProgressBar: document.querySelector("[data-perspective-progress-bar]"),
  perspectiveBack: document.querySelector("[data-perspective-back]"),
  perspectiveNext: document.querySelector("[data-perspective-next]"),
  participantPlanApproved: document.querySelector("[data-participant-plan-approved]"),
  participantPlanSummary: document.querySelector("[data-participant-plan-summary]"),
  approvedCohortList: document.querySelector("[data-approved-cohort-list]"),
  approvedCohortCoverage: document.querySelector("[data-approved-cohort-coverage]"),
  reviewApprovedCohort: document.querySelector("[data-review-approved-cohort]"),
  reviewQuestionProtocol: document.querySelector("[data-review-18-question-protocol]"),
  returnPerspectiveWorkspace: document.querySelector("[data-return-perspective-workspace]"),
  participantDesignMessage: document.querySelector("[data-participant-design-message]"),
  participantSlots: document.querySelector("[data-participant-slots]"),
  cohortRevealList: document.querySelector("[data-cohort-reveal-list]"),
  participantCapacityCount: document.querySelector("[data-participant-capacity-count]"),
  participantCapacityLabel: document.querySelector("[data-participant-capacity-label]"),
  participantCapacityTrack: document.querySelector("[data-participant-capacity-track]"),
  participantCapacityLocked: document.querySelector("[data-participant-capacity-locked]"),
  participantCapacityNote: document.querySelector("[data-participant-capacity-note]"),
  participantReadiness: document.querySelector("[data-participant-readiness]"),
  scopePerspectiveGuide: document.querySelector("[data-scope-perspective-guide]"),
  scopePerspectiveTitle: document.querySelector("[data-scope-perspective-title]"),
  scopePerspectiveBoundary: document.querySelector("[data-scope-perspective-boundary]"),
  scopePerspectiveList: document.querySelector("[data-scope-perspective-list]"),
  scopePerspectiveDependencies: document.querySelector("[data-scope-perspective-dependencies]"),
  cohortStartingPoints: document.querySelector("[data-cohort-starting-points]"),
  cohortStartingPointList: document.querySelector("[data-cohort-starting-point-list]"),
  pocCapacity: document.querySelector("[data-poc-capacity]"),
  coverageGaps: document.querySelector("[data-coverage-gaps]"),
  coverageGapList: document.querySelector("[data-coverage-gap-list]"),
  coverageGapTitle: document.querySelector("[data-coverage-gap-title]"),
  cohortBoundarySummary: document.querySelector("[data-cohort-boundary-summary]"),
  cohortBoundaryTitle: document.querySelector("[data-cohort-boundary-title]"),
  cohortBoundaryDetail: document.querySelector("[data-cohort-boundary-detail]"),
  addParticipantSlot: document.querySelector("[data-add-participant-slot]"),
  approveParticipantPlan: document.querySelector("[data-approve-participant-plan]"),
  closeParticipantDesign: document.querySelector("[data-close-participant-design]"),
  protocolReview: document.querySelector("[data-protocol-review]"),
  protocolReviewForm: document.querySelector("[data-protocol-review-form]"),
  protocolQuestionList: document.querySelector("[data-protocol-question-list]"),
  protocolCoverage: document.querySelector("[data-protocol-coverage]"),
  protocolApproved: document.querySelector("[data-protocol-approved]"),
  protocolApprovedSummary: document.querySelector("[data-protocol-approved-summary]"),
  protocolMessage: document.querySelector("[data-protocol-message]"),
  approveProtocol: document.querySelector("[data-approve-protocol]"),
  closeProtocolReview: document.querySelector("[data-close-protocol-review]"),
  diagnosticInvitationPanel: document.querySelector("[data-diagnostic-invitation-panel]"),
  diagnosticCollectionProgress: document.querySelector("[data-diagnostic-collection-progress]"),
  diagnosticInvitationSlots: document.querySelector("[data-diagnostic-invitation-slots]"),
  diagnosticInvitationMessage: document.querySelector("[data-diagnostic-invitation-message]"),
  invitationReadiness: document.querySelector("[data-invitation-readiness]"),
  leadershipValidation: document.querySelector("[data-leadership-validation]"),
  leadershipReleaseState: document.querySelector("[data-leadership-release-state]"),
  executiveCapacityBrief: document.querySelector("[data-executive-capacity-brief]"),
  downloadExecutiveBrief: document.querySelector("[data-download-executive-brief]"),
  leadershipFinding: document.querySelector("[data-leadership-finding]"),
  leadershipValidationForm: document.querySelector("[data-leadership-validation-form]"),
  leadershipValidationMessage: document.querySelector("[data-leadership-validation-message]"),
  closeLeadershipValidation: document.querySelector("[data-close-leadership-validation]"),
  interventionAcceptance: document.querySelector("[data-intervention-acceptance]"),
  clientInterventionProposal: document.querySelector("[data-client-intervention-proposal]"),
  clientInterventionAcceptance: document.querySelector("[data-client-intervention-acceptance]"),
  interventionCheckout: document.querySelector("[data-intervention-checkout]"),
  interventionAcceptanceMessage: document.querySelector("[data-intervention-acceptance-message]"),
  closeInterventionAcceptance: document.querySelector("[data-close-intervention-acceptance]"),
  capacityBrief: document.querySelector("[data-capacity-brief]"),
  capacityBriefContent: document.querySelector("[data-capacity-brief-content]"),
  guidedPlan: document.querySelector("[data-guided-plan]"),
  generateGuidedPlan: document.querySelector("[data-generate-guided-plan]"),
  guidedPlanMessage: document.querySelector("[data-guided-plan-message]"),
  activateCapacityBrief: document.querySelector("[data-activate-capacity-brief]"),
  capacityBriefMessage: document.querySelector("[data-capacity-brief-message]"),
  capacityBriefAttention: document.querySelector("[data-capacity-brief-attention]"),
  capacityAttentionHeading: document.querySelector("[data-capacity-attention-heading]"),
  capacityAttentionList: document.querySelector("[data-capacity-attention-list]"),
  advisorEscalation: document.querySelector("[data-advisor-escalation]"),
  advisorEscalationForm: document.querySelector("[data-advisor-escalation-form]"),
  advisorEscalationList: document.querySelector("[data-advisor-escalation-list]"),
  advisorEscalationMessage: document.querySelector("[data-advisor-escalation-message]"),
  decisionHistory: document.querySelector("[data-decision-history]"),
  decisionHistoryList: document.querySelector("[data-decision-history-list]"),
  decisionHistoryMessage: document.querySelector("[data-decision-history-message]"),
  sponsorPocFeedback: document.querySelector("[data-sponsor-poc-feedback]"),
  sponsorPocFeedbackForm: document.querySelector("[data-sponsor-poc-feedback-form]"),
  sponsorPocFeedbackMessage: document.querySelector("[data-sponsor-poc-feedback-message]"),
  closeCapacityBrief: document.querySelector("[data-close-capacity-brief]"),
  capacityLearningPath: document.querySelector("[data-capacity-learning-path]"),
  capacityLearningForm: document.querySelector("[data-capacity-learning-form]"),
  capacityLearningList: document.querySelector("[data-capacity-learning-list]"),
  capacityLearningMessage: document.querySelector("[data-capacity-learning-message]"),
  capacityActionPath: document.querySelector("[data-capacity-action-path]"),
  capacityActionForm: document.querySelector("[data-capacity-action-form]"),
  capacityActionList: document.querySelector("[data-capacity-action-list]"),
  capacityActionMessage: document.querySelector("[data-capacity-action-message]"),
  capacityCheckIns: document.querySelector("[data-capacity-check-ins]"),
  capacityCheckInForm: document.querySelector("[data-capacity-check-in-form]"),
  capacityCheckInList: document.querySelector("[data-capacity-check-in-list]"),
  capacityCheckInMessage: document.querySelector("[data-capacity-check-in-message]"),
  capacityEvidenceJournal: document.querySelector("[data-capacity-evidence-journal]"),
  capacityEvidenceForm: document.querySelector("[data-capacity-evidence-form]"),
  capacityEvidenceList: document.querySelector("[data-capacity-evidence-list]"),
  capacityEvidenceMessage: document.querySelector("[data-capacity-evidence-message]"),
  capacityReviewJournal: document.querySelector("[data-capacity-review-journal]"),
  capacityReviewForm: document.querySelector("[data-capacity-review-form]"),
  capacityReviewList: document.querySelector("[data-capacity-review-list]"),
  capacityReviewMessage: document.querySelector("[data-capacity-review-message]"),
  reassessmentPlanning: document.querySelector("[data-reassessment-planning]"),
  reassessmentForm: document.querySelector("[data-reassessment-form]"),
  reassessmentSummary: document.querySelector("[data-reassessment-summary]"),
  reassessmentComparison: document.querySelector("[data-reassessment-comparison]"),
  reassessmentMessage: document.querySelector("[data-reassessment-message]"),
  collectionPanel: document.querySelector("[data-collection-panel]"),
  collectionForm: document.querySelector("[data-collection-form]"),
  collectionMessage: document.querySelector("[data-collection-message]"),
  createRound: document.querySelector("[data-create-round]"),
  thresholdValue: document.querySelector("[data-threshold-value]"),
  roundsSection: document.querySelector("[data-rounds-section]"),
  roundList: document.querySelector("[data-round-list]"),
  cancelEdit: document.querySelector("[data-cancel-edit]"),
  invitationPanel: document.querySelector("[data-invitation-panel]"),
  invitationRound: document.querySelector("[data-invitation-round]"),
  invitationForm: document.querySelector("[data-invitation-form]"),
  invitationMessage: document.querySelector("[data-invitation-message]"),
  sendInvitation: document.querySelector("[data-send-invitation]"),
  invitedCount: document.querySelector("[data-invited-count]"),
  acceptedCount: document.querySelector("[data-accepted-count]"),
  pendingCount: document.querySelector("[data-pending-count]"),
  submittedCount: document.querySelector("[data-submitted-count]"),
  invitationList: document.querySelector("[data-invitation-list]"),
  reminderActions: document.querySelector("[data-reminder-actions]"),
  reminderSummary: document.querySelector("[data-reminder-summary]"),
  remindNonrespondents: document.querySelector("[data-remind-nonrespondents]"),
  resultsCount: document.querySelector("[data-results-count]"),
  resultsProgress: document.querySelector("[data-results-progress]"),
  resultsProgressFill: document.querySelector("[data-results-progress-fill]"),
  resultsMessage: document.querySelector("[data-results-message]"),
  aggregateProfile: document.querySelector("[data-aggregate-profile]"),
  aggregateIndex: document.querySelector("[data-aggregate-index]"),
  aggregateDomains: document.querySelector("[data-aggregate-domains]"),
  aggregateConstraint: document.querySelector("[data-aggregate-constraint]"),
  constraintHypothesis: document.querySelector("[data-constraint-hypothesis]"),
  constraintQuestions: document.querySelector("[data-constraint-questions]"),
  actionCycleList: document.querySelector("[data-action-cycle-list]"),
  actionCycleEmpty: document.querySelector("[data-action-cycle-empty]"),
  actionCycleForm: document.querySelector("[data-action-cycle-form]"),
  actionConstraint: document.querySelector("[data-action-constraint]"),
  actionCycleMessage: document.querySelector("[data-action-cycle-message]"),
  saveActionCycle: document.querySelector("[data-save-action-cycle]"),
  closeRound: document.querySelector("[data-close-round]"),
  workspaceComparison: document.querySelector("[data-workspace-comparison]"),
  comparisonBaselineIndex: document.querySelector("[data-comparison-baseline-index]"),
  comparisonFollowUpIndex: document.querySelector("[data-comparison-follow-up-index]"),
  comparisonMessage: document.querySelector("[data-comparison-message]"),
  comparisonDomains: document.querySelector("[data-comparison-domains]"),
  participantPanel: document.querySelector("[data-participant-panel]"),
  participantRound: document.querySelector("[data-participant-round]"),
  participantDates: document.querySelector("[data-participant-dates]"),
  participantNotice: document.querySelector("[data-participant-notice]"),
  participantAcknowledgement: document.querySelector("[data-participant-acknowledgement]"),
  assessmentNotice: document.querySelector("[data-assessment-notice]"),
  diagnosticOrientation: document.querySelector("[data-diagnostic-orientation]"),
  diagnosticTerms: document.querySelector("[data-diagnostic-terms]"),
  diagnosticTermsLink: document.querySelector("[data-diagnostic-terms-link]"),
  participantMessage: document.querySelector("[data-participant-message]"),
  beginAssessment: document.querySelector("[data-begin-assessment]"),
  participantInterview: document.querySelector("[data-participant-interview]"),
  participantInterviewQuestions: document.querySelector("[data-participant-interview-questions]"),
  participantPocFeedback: document.querySelector("[data-participant-poc-feedback]"),
  participantPocFeedbackMessage: document.querySelector("[data-participant-poc-feedback-message]"),
  saveInterview: document.querySelector("[data-save-interview]"),
  interviewMessage: document.querySelector("[data-interview-message]")
};

elements.pocSupportForm = document.querySelector("[data-poc-support-form]");
elements.pocSupportMessage = document.querySelector("[data-poc-support-message]");
elements.supportCaseReference = document.querySelector("[data-support-case-reference]");

let clerk = null;
let signInMounted = false;
let currentRole = null;
let clerkContextKey = "";
let workspaceRenderPromise = null;
let collectionRounds = [];
let editingRoundId = null;
let followUpRoundId = null;
let selectedRoundId = null;
let currentParticipation = null;
let currentNonrespondents = [];
let selectedDiagnosticId = null;
let protocolQuestionReviews = new Map();
let participantSlotCount = 0;
let interviewAutosaveTimer = null;
let interviewDirty = false;
let interviewSavePromise = Promise.resolve();

const domainLabels = {
  leadership: "Leadership",
  decisions: "Decisions",
  rhythm: "Operating Rhythm",
  alignment: "Alignment",
  technology: "Technology",
  culture: "Culture"
};

const constraintContent = {
  leadership: {
    hypothesis: "Senior attention may be absorbing ambiguity that the organization has not yet learned to resolve elsewhere.",
    questions: [
      "Which decisions still depend on senior intervention?",
      "What leadership work is being displaced by recurring escalation?"
    ]
  },
  decisions: {
    hypothesis: "Decision ownership and closure may not be scaling at the pace execution requires.",
    questions: [
      "Where do important decisions remain open longest?",
      "Which decisions are repeatedly reopened or escalated?",
      "What ownership or decision threshold remains unclear?"
    ]
  },
  rhythm: {
    hypothesis: "Operating forums may be consuming coordination effort without reliably producing decisions and commitments.",
    questions: [
      "Which recurring forums consistently produce clear decisions?",
      "Where does the same issue travel through multiple meetings?"
    ]
  },
  alignment: {
    hypothesis: "Strategic priorities may not translate into sufficiently consistent tradeoffs across the organization.",
    questions: [
      "Where do teams make conflicting tradeoffs?",
      "Which priorities compete without an explicit resolution rule?"
    ]
  },
  technology: {
    hypothesis: "Systems and information may be adding friction rather than increasing organizational leverage.",
    questions: [
      "Where does work depend on manual translation?",
      "Which system boundaries create the most rework?"
    ]
  },
  culture: {
    hypothesis: "Local norms may be making challenge, ownership, or adaptation less reliable than execution requires.",
    questions: [
      "Where is productive challenge least safe?",
      "Which commitments depend more on heroics than shared norms?"
    ]
  }
};

const evidenceLabels = {
  decisionPace: "Decision pace",
  leadershipEscalationLoad: "Leadership escalation load",
  crossFunctionalCoordinationLoad: "Cross-functional coordination load",
  executionReliability: "Execution reliability",
  changeAbsorption: "Change absorption",
  other: "Another operating indicator"
};

function showState(name) {
  for (const key of ["loading", "error", "signInState", "membershipState", "readyState"]) {
    elements[key].hidden = key !== name;
  }
  elements.surface.setAttribute("aria-busy", String(name === "loading"));
}

function showError(message) {
  elements.errorMessage.textContent = message;
  showState("error");
}

async function fetchConfig() {
  const response = await fetch("/api/workspace/config", {
    credentials: "same-origin",
    headers: { Accept: "application/json" }
  });
  if (!response.ok) throw new Error("Workspace sign-in is not configured for this environment.");
  return response.json();
}

function loadExternalScript(src, publishableKey = null) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    script.crossOrigin = "anonymous";
    if (publishableKey) script.dataset.clerkPublishableKey = publishableKey;
    script.src = src;
    script.addEventListener("load", resolve, { once: true });
    script.addEventListener("error", () => reject(new Error("Secure sign-in could not be loaded.")), { once: true });
    document.head.append(script);
  });
}

function roleContent(role) {
  if (role === "org:admin") {
    return {
      label: "Client sponsor · POC workspace",
      title: "Prepare the first collection round.",
      description: "This is the sponsoring organization’s workspace. POC method-setup controls remain visible temporarily while the separate Senger and Advisor console is built.",
      action: "Set up a collection round"
    };
  }
  return {
    label: "Invited participant",
    title: "Contribute your private perspective.",
    description: "Your identity confirms participation, while your answers and individual scores remain inaccessible to workspace roles.",
    action: "Review participation privacy"
  };
}

function localDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateBoundary(value, endOfDay = false) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(
    year,
    month - 1,
    day,
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0
  ).toISOString();
}

function openingBoundary(value) {
  return value === localDateValue() ? new Date().toISOString() : dateBoundary(value);
}

function formattedDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

const diagnosticStateLabels = {
  draft: "Ready for entitlement",
  discovery: "Discovery",
  "participant-design": "Participant design",
  "protocol-review": "Protocol review",
  collecting: "Confidential interviews",
  "evidence-review": "Evidence review",
  synthesis: "Synthesis",
  "leadership-validation": "Leadership validation",
  "intervention-proposed": "Intervention proposed",
  "intervention-accepted": "Intervention accepted",
  "active-intervention": "Active intervention",
  reassessment: "Reassessment",
  completed: "Completed"
};

function renderDiagnostics(diagnostics) {
  diagnosticsById = new Map(diagnostics.map(diagnostic => [diagnostic.id, diagnostic]));
  elements.diagnosticList.replaceChildren();
  for (const diagnostic of diagnostics) {
    const card = document.createElement("article");
    card.className = "diagnostic-card";
    const copy = document.createElement("div");
    const title = document.createElement("h4");
    title.textContent = diagnostic.route === "automated"
      ? "Automated written diagnostic"
      : "Advisor-led diagnostic";
    const detail = document.createElement("p");
    detail.textContent = `Started ${formattedDate(diagnostic.createdAt)} · Method ${workspaceDiagnosticMethodVersion}`;
    copy.append(title, detail);
    const status = document.createElement("div");
    status.className = "diagnostic-status";
    const stage = document.createElement("strong");
    stage.textContent = diagnosticStateLabels[diagnostic.state] || diagnostic.state;
    const entitlement = document.createElement("span");
    entitlement.textContent = diagnostic.entitlementStatus === "active"
      ? `${diagnostic.entitlementType.toUpperCase()} access active`
      : "Payment and access pending";
    const review = document.createElement("small");
    review.textContent = diagnostic.humanReviewState === "clear"
      ? "No human review required"
      : `Human review · ${diagnostic.humanReviewState}`;
    status.append(stage, entitlement, review);
    const action = document.createElement("button");
    action.className = "diagnostic-card-action";
    action.type = "button";
    action.dataset.diagnosticId = diagnostic.id;
    action.dataset.diagnosticStage = diagnostic.state;
    action.disabled = diagnostic.entitlementStatus !== "active" && diagnostic.entitlementType !== "paid";
    action.textContent = diagnostic.entitlementStatus !== "active"
      ? diagnostic.entitlementType === "paid" ? "Complete payment" : "Awaiting access"
      : diagnostic.state === "draft" || diagnostic.state === "discovery"
        ? "Begin discovery"
        : diagnostic.state === "participant-design"
          ? "Design participants"
          : diagnostic.state === "protocol-review"
            ? "Review protocol"
            : diagnostic.state === "collecting"
              ? "Monitor interviews"
              : new Set(["synthesis", "leadership-validation"]).has(diagnostic.state)
                ? "Review governed finding"
                : diagnostic.state === "intervention-proposed"
                  ? "Review intervention proposal"
                  : new Set(["intervention-accepted","active-intervention"]).has(diagnostic.state)
                    ? "Open Capacity Operating Brief"
                    : diagnostic.state === "reassessment"
                      ? "Plan governed reassessment"
                    : "Review diagnostic method";
    card.append(copy, status, action);
    elements.diagnosticList.append(card);
  }
  elements.diagnosticEmpty.hidden = diagnostics.length > 0;
}

const participantOptions = {
  leadershipLevel: [["enterprise", "Executive / enterprise leader"], ["functional", "VP / Director / functional leader"], ["operational", "Manager / team lead"], ["frontline", "Individual contributor / frontline"]],
  executionProximity: [["strategy", "Sets direction and makes tradeoffs"], ["coordination", "Translates direction and coordinates work"], ["delivery", "Performs the work or receives its consequences"]],
  functionalLens: [["executive-leadership", "Executive leadership"], ["operations", "Operations"], ["people", "People / HR"], ["finance", "Finance"], ["commercial", "Sales / commercial"], ["product-service", "Product / service delivery"], ["technology", "Technology"], ["frontline-delivery", "Frontline delivery"], ["other", "Another relevant area"]]
};

const perspectiveExperienceLanguage = {
  strategy: "sets direction and makes the tradeoffs",
  coordination: "translates priorities and coordinates dependencies",
  delivery: "experiences the work and its consequences directly"
};

function participantOptionLabel(group, value) {
  return participantOptions[group].find(([option]) => option === value)?.[1] || String(value || "Relevant viewpoint");
}

function renderApprovedCohort(participantPlan) {
  const slots = participantPlan.participantSlots || [];
  elements.approvedCohortList.replaceChildren(...slots.map((slot, index) => {
    const card = document.createElement("article");
    const number = document.createElement("span");
    number.textContent = String(index + 1).padStart(2, "0");
    const copy = document.createElement("div");
    const role = document.createElement("strong");
    role.textContent = participantOptionLabel("leadershipLevel", slot.leadershipLevel);
    const experience = document.createElement("p");
    experience.textContent = `${participantOptionLabel("executionProximity", slot.executionProximity)} · ${participantOptionLabel("functionalLens", slot.functionalLens)}`;
    copy.append(role, experience);
    card.append(number, copy);
    return card;
  }));

  const represented = [
    ...new Set(slots.map(slot => participantOptionLabel("executionProximity", slot.executionProximity))),
    ...new Set(slots.map(slot => participantOptionLabel("functionalLens", slot.functionalLens)))
  ];
  elements.approvedCohortCoverage.replaceChildren(...represented.map(label => Object.assign(document.createElement("span"), { textContent: label })));
}

let diagnosticsById = new Map();
let participantSlotMaximum = 10;

const sponsorJourneyStages = {
  discovery: [1, "Frame the moment"],
  perspectives: [2, "Choose the perspectives"],
  protocol: [3, "Approve the protocol"],
  invitations: [4, "Send invitations"],
  collection: [5, "Follow participation"],
  finding: [6, "Review the finding"]
};

const perspectiveStepNames = ["Choose what must be represented", "Build the perspective cohort", "Review coverage and approve"];
let perspectiveStep = 0;

function hideSponsorTaskSections() {
  for (const section of [elements.diagnosticContext, elements.participantDesign, elements.protocolReview, elements.leadershipValidation, elements.interventionAcceptance, elements.capacityBrief]) {
    if (section) section.hidden = true;
  }
  elements.sponsorPocFeedback.hidden = true;
}

function showSponsorHome() {
  document.body.classList.remove("workspace-stage-journey", "workspace-stage-perspectives");
  elements.journeyChrome.hidden = true;
  elements.diagnosticPanel.hidden = true;
  hideSponsorTaskSections();
  history.replaceState(null, "", location.pathname + location.search);
  document.title = "Organizational Capacity Workspace | Senger Advisory";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showSponsorJourney(stage, diagnosticId) {
  const [position, name] = sponsorJourneyStages[stage] || sponsorJourneyStages.discovery;
  document.body.classList.add("workspace-stage-journey");
  elements.diagnosticPanel.hidden = false;
  elements.journeyChrome.hidden = false;
  elements.journeyStepLabel.textContent = `Step ${position} of 6`;
  elements.journeyStepName.textContent = name;
  elements.journeyProgress.setAttribute("aria-valuenow", String(position));
  elements.journeyProgressFill.style.width = `${(position / 6) * 100}%`;
  const route = `#diagnostic/${encodeURIComponent(diagnosticId)}/${stage}`;
  if (location.hash !== route) history.pushState({ sponsorJourney: true }, "", route);
  else history.replaceState({ sponsorJourney: true }, "", route);
  document.title = `${name} | Organizational Capacity Diagnostic`;
}

function showPerspectiveStep(step = 0) {
  perspectiveStep = Math.max(0, Math.min(step, elements.perspectiveSteps.length - 1));
  if (perspectiveStep === elements.perspectiveSteps.length - 1) {
    const gaps = participantCoverageGaps(participantPlanDraft());
    showCoverageGaps(gaps);
    elements.participantDesignMessage.textContent = gaps.length
      ? "Review each viewpoint below and choose whether to add it, remove it from the intended coverage, or proceed without it."
      : "Every viewpoint you identified as important is represented in the planned cohort.";
    delete elements.participantDesignMessage.dataset.tone;
  }
  elements.perspectiveSteps.forEach((section, index) => { section.hidden = index !== perspectiveStep; });
  elements.perspectiveProgressLabel.textContent = `Part ${perspectiveStep + 1} of ${elements.perspectiveSteps.length}`;
  elements.perspectiveProgressName.textContent = perspectiveStepNames[perspectiveStep];
  elements.perspectiveProgressBar.style.width = `${((perspectiveStep + 1) / elements.perspectiveSteps.length) * 100}%`;
  elements.perspectiveBack.hidden = perspectiveStep === 0;
  elements.perspectiveNext.hidden = perspectiveStep === elements.perspectiveSteps.length - 1;
  elements.participantDesign.scrollIntoView({ behavior: "smooth", block: "start" });
}

function updateParticipantCapacity() {
  const count = elements.participantSlots.children.length;
  const isPoc = participantSlotMaximum === 10;
  elements.participantCapacityCount.textContent = count;
  elements.participantCapacityLabel.lastChild.textContent = ` of ${participantSlotMaximum} ${isPoc ? "POC" : "full diagnostic"} perspectives planned`;
  elements.pocCapacity.style.transform = `scaleX(${Math.min(count, participantSlotMaximum) / participantSlotMaximum})`;
  elements.participantCapacityTrack.style.gridTemplateColumns = isPoc ? "20% 80%" : "100% 0";
  elements.participantCapacityLocked.hidden = !isPoc;
  elements.participantCapacityNote.textContent = isPoc
    ? "Five is the required minimum. Participants 6–10 are optional. Full diagnostics support up to 50."
    : "Five is the required minimum. The full diagnostic supports up to 50 internal participant perspectives.";
  const readinessTitle = elements.participantReadiness.querySelector("strong");
  const readinessDetail = elements.participantReadiness.querySelector("span");
  elements.participantReadiness.dataset.state = count < 5 ? "incomplete" : count === 5 ? "minimum" : count === participantSlotMaximum ? "full" : "expanded";
  readinessTitle.textContent = count < 5 ? "More perspectives required" : count === 5 ? "Minimum cohort reached" : count === participantSlotMaximum ? `${isPoc ? "POC" : "Diagnostic"} cohort at capacity` : "Coverage expanded";
  readinessDetail.textContent = count < 5
    ? `${5 - count} more perspective${5 - count === 1 ? " is" : "s are"} required before approval.`
    : count === 5
      ? "You may approve five perspectives or add more only when they deepen coverage."
      : count === participantSlotMaximum
        ? `All ${participantSlotMaximum} available ${isPoc ? "POC " : ""}perspective slots are planned.`
        : `${count - 5} optional perspective${count - 5 === 1 ? " has" : "s have"} been added to deepen coverage.`;
  elements.addParticipantSlot.disabled = count >= participantSlotMaximum;
  elements.addParticipantSlot.title = count >= participantSlotMaximum ? (isPoc ? "The POC includes 10 participant perspectives. Full diagnostics support up to 50." : "The full diagnostic supports up to 50 participant perspectives.") : "";
  elements.participantSlots.querySelectorAll(".participant-slot button").forEach(button => {
    button.disabled = count <= 5;
    button.title = count <= 5 ? "Five participants are required." : "Remove this perspective slot";
  });
  updateCohortReveal();
}

function updateCohortReveal() {
  if (!elements.cohortRevealList) return;
  const slots = [...elements.participantSlots.children].map(row => ({
    level: row.querySelector('[name="leadershipLevel"]').value,
    proximity: row.querySelector('[name="executionProximity"]').value,
    function: row.querySelector('[name="functionalLens"]').value
  }));
  const proximities = new Set(slots.map(slot => slot.proximity).filter(Boolean));
  const functions = new Set(slots.map(slot => slot.function).filter(Boolean));
  const checks = [
    ["Direction and tradeoffs", proximities.has("strategy"), "Include someone who sets direction or makes consequential tradeoffs."],
    ["Translation and coordination", proximities.has("coordination"), "Include someone responsible for turning direction into coordinated work."],
    ["Lived execution", proximities.has("delivery"), "Include someone close enough to the work to experience friction directly."],
    ["Cross-functional contrast", functions.size >= 2, "Include viewpoints from at least two areas when the work crosses a boundary."]
  ];
  elements.cohortRevealList.replaceChildren(...checks.map(([label, covered, guidance]) => {
    const row = document.createElement("div"), mark = document.createElement("span"), copy = document.createElement("div"), strong = document.createElement("strong"), small = document.createElement("small");
    row.dataset.state = covered ? "covered" : "consider"; mark.textContent = covered ? "✓" : "＋"; strong.textContent = `${label} · ${covered ? "Covered" : "Consider"}`; small.textContent = covered ? "A planned perspective can reveal this part of the system." : guidance;
    copy.append(strong, small); row.append(mark, copy); return row;
  }));
}

function participantSelect(name, options, prompt) {
  const select = document.createElement("select");
  select.name = name;
  select.required = true;
  select.append(new Option(prompt, ""));
  for (const [value, label] of options) select.append(new Option(label, value));
  return select;
}

function addParticipantSlot(values = {}) {
  participantSlotCount += 1;
  const row = document.createElement("div");
  row.className = "participant-slot";
  row.dataset.slotId = values.slotId || `slot-${participantSlotCount}`;
  const number = document.createElement("span");
  number.textContent = String(elements.participantSlots.children.length + 1).padStart(2, "0");
  const leadership = participantSelect("leadershipLevel", participantOptions.leadershipLevel, "Choose role or vantage point");
  const proximity = participantSelect("executionProximity", participantOptions.executionProximity, "Choose connection to the work");
  const functional = participantSelect("functionalLens", participantOptions.functionalLens, "Choose organizational area");
  const slotNumber = elements.participantSlots.children.length + 1;
  leadership.setAttribute("aria-label", `Perspective ${slotNumber}: who should this represent?`);
  proximity.setAttribute("aria-label", `Perspective ${slotNumber}: how do they experience the work?`);
  functional.setAttribute("aria-label", `Perspective ${slotNumber}: what area do they see?`);
  leadership.value = values.leadershipLevel || "";
  proximity.value = values.executionProximity || "";
  functional.value = values.functionalLens || "";
  const insight = document.createElement("small");
  insight.className = "participant-slot-insight";
  const updateInsight = () => {
    const role = leadership.selectedOptions[0]?.textContent, area = functional.selectedOptions[0]?.textContent, experience = perspectiveExperienceLanguage[proximity.value];
    insight.textContent = leadership.value && proximity.value && functional.value
      ? `Why this view matters: ${role} in ${area} ${experience}.`
      : "Complete the three choices to see what this perspective contributes.";
    updateCohortReveal();
  };
  for (const select of [leadership, proximity, functional]) select.addEventListener("change", updateInsight);
  const remove = document.createElement("button");
  remove.type = "button";
  remove.textContent = "Remove";
  remove.addEventListener("click", () => { row.remove(); updateParticipantCapacity(); });
  row.append(number, leadership, proximity, functional, remove, insight);
  elements.participantSlots.append(row);
  updateInsight();
  updateParticipantCapacity();
}

function checkedValues(name) {
  return [...elements.participantDesignForm.querySelectorAll(`[name="${name}"]:checked`)].map(input => input.value);
}

function participantPlanDraft() {
  const participantSlots = [...elements.participantSlots.children].map(row => ({
    slotId: row.dataset.slotId,
    leadershipLevel: row.querySelector('[name="leadershipLevel"]').value,
    executionProximity: row.querySelector('[name="executionProximity"]').value,
    functionalLens: row.querySelector('[name="functionalLens"]').value
  }));
  return {
    targetLeadershipLevels: checkedValues("leadershipLevels"),
    targetExecutionProximities: checkedValues("executionProximities"),
    targetFunctionalLenses: checkedValues("functionalLenses"),
    participantSlots
  };
}

function participantCoverageGaps(plan) {
  const dimensions = [
    ["leadershipLevels", "targetLeadershipLevels", "leadershipLevel"],
    ["executionProximities", "targetExecutionProximities", "executionProximity"],
    ["functionalLenses", "targetFunctionalLenses", "functionalLens"]
  ];
  return dimensions.flatMap(([dimension, target, slotKey]) => {
    const present = new Set(plan.participantSlots.map(slot => slot[slotKey]));
    return plan[target].filter(value => !present.has(value)).map(value => `${dimension}:${value}`);
  });
}

const coverageLanguage = {
  leadershipLevels: {
    enterprise: ["Executive / enterprise leadership", "No planned participant currently represents the people setting enterprise direction and consequential tradeoffs."],
    functional: ["VP / Director / functional leadership", "No planned participant currently represents the leaders translating enterprise direction into functional priorities."],
    operational: ["Managers / team leads", "No planned participant currently represents the people coordinating day-to-day execution."],
    frontline: ["Individual contributors / frontline", "No planned participant currently represents people experiencing the work directly."]
  },
  executionProximities: {
    strategy: ["Direction and tradeoffs", "No planned participant currently sets direction or makes consequential tradeoffs for this work."],
    coordination: ["Translation and coordination", "No planned participant currently translates priorities or coordinates dependencies."],
    delivery: ["Lived execution", "No planned participant currently performs the work or directly experiences its consequences."]
  },
  functionalLenses: {
    "executive-leadership": ["Executive leadership", "No planned participant currently brings an enterprise leadership perspective."],
    operations: ["Operations", "No planned participant currently brings an Operations perspective."],
    people: ["People / HR", "No planned participant currently brings a People or HR perspective."],
    finance: ["Finance", "No planned participant currently brings a Finance perspective."],
    commercial: ["Sales / commercial", "No planned participant currently brings a Sales or commercial perspective."],
    "product-service": ["Product / service delivery", "No planned participant currently brings a Product or service-delivery perspective."],
    technology: ["Technology", "No planned participant currently brings a Technology perspective."],
    "frontline-delivery": ["Frontline delivery", "No planned participant currently represents people directly performing or receiving the downstream work."],
    other: ["Another relevant area", "No planned participant currently represents the additional area selected earlier."]
  }
};

function coverageGapParts(gapId) {
  const [dimension, value] = gapId.split(":");
  const [label, explanation] = coverageLanguage[dimension]?.[value] || ["Selected viewpoint", "No planned participant currently represents this viewpoint."];
  return { dimension, value, label, explanation };
}

function addSlotForGap(gapId) {
  if (elements.participantSlots.children.length >= participantSlotMaximum) {
    elements.participantDesignMessage.textContent = "The POC cohort is at its 10-perspective limit. Adjust an existing card or remove another optional perspective first.";
    elements.participantDesignMessage.dataset.tone = "error";
    return;
  }
  const { dimension, value } = coverageGapParts(gapId);
  const values = dimension === "leadershipLevels" ? { leadershipLevel: value }
    : dimension === "executionProximities" ? { executionProximity: value }
    : { functionalLens: value };
  addParticipantSlot(values);
  showPerspectiveStep(1);
  elements.participantSlots.lastElementChild.scrollIntoView({ behavior: "smooth", block: "center" });
}

function removeCoverageObjective(gapId) {
  const { dimension, value } = coverageGapParts(gapId);
  const inputName = { leadershipLevels: "leadershipLevels", executionProximities: "executionProximities", functionalLenses: "functionalLenses" }[dimension];
  const input = elements.participantDesignForm.querySelector(`[name="${inputName}"][value="${value}"]`);
  if (input) input.checked = false;
  showCoverageGaps(participantCoverageGaps(participantPlanDraft()));
}

function updateCohortBoundarySummary() {
  const accepted = [...elements.coverageGapList.querySelectorAll('[data-gap-resolution="accept"]')].map(row => coverageGapParts(row.dataset.gapId).label);
  elements.cohortBoundarySummary.hidden = false;
  elements.cohortBoundaryTitle.textContent = accepted.length ? "A deliberate cohort with documented boundaries" : "The intended viewpoints are represented";
  elements.cohortBoundaryDetail.textContent = accepted.length
    ? `This cohort will not independently represent ${accepted.join(", ")}. Findings will be interpreted within that boundary.`
    : "The planned cohort represents every viewpoint you identified as important. The diagnostic will still distinguish evidence from inference and keep uncertainty visible.";
}

function showCoverageGaps(gaps) {
  elements.coverageGapList.replaceChildren();
  elements.coverageGapTitle.textContent = `${gaps.length} intended viewpoint${gaps.length === 1 ? " is" : "s are"} not represented`;
  for (const gapId of gaps) {
    const row = document.createElement("div");
    row.className = "coverage-gap";
    row.dataset.gapId = gapId;
    const { label: plainLabel, explanation } = coverageGapParts(gapId);
    const copy = document.createElement("div"), label = document.createElement("strong"), detail = document.createElement("p");
    label.textContent = plainLabel; detail.textContent = explanation; copy.append(label, detail);
    const actions = document.createElement("div"); actions.className = "coverage-gap-actions";
    for (const [action, text] of [["add", "Add this perspective"], ["remove", "Remove from intended coverage"], ["accept", "Proceed without it"]]) {
      const button = document.createElement("button"); button.type = "button"; button.dataset.gapAction = action; button.textContent = text; button.className = action === "add" ? "secondary-button" : "text-button"; actions.append(button);
    }
    const reason = document.createElement("input");
    reason.type = "text";
    reason.maxLength = 500;
    reason.placeholder = "Why is it appropriate to proceed without this viewpoint?";
    reason.setAttribute("aria-label", `Why proceed without ${plainLabel}?`);
    reason.hidden = true;
    const consequence = document.createElement("p"); consequence.className = "coverage-gap-consequence"; consequence.textContent = `The findings will not independently reflect how ${plainLabel} experiences this system.`; consequence.hidden = true;
    row.append(copy, actions, consequence, reason);
    elements.coverageGapList.append(row);
  }
  elements.coverageGaps.hidden = gaps.length === 0;
  elements.approveParticipantPlan.textContent = "Approve perspective cohort";
  updateCohortBoundarySummary();
}

function setPerspectiveStage(active) {
  document.body.classList.toggle("workspace-stage-perspectives", active);
  if (active) {
    document.title = "Perspective Design | Organizational Capacity Workspace";
    return;
  }
  document.title = "Organizational Capacity Workspace | Senger Advisory";
}

async function openParticipantDesign(diagnosticId) {
  selectedDiagnosticId = diagnosticId;
  hideSponsorTaskSections();
  showSponsorJourney("perspectives", diagnosticId);
  setPerspectiveStage(true);
  participantSlotMaximum = diagnosticsById.get(diagnosticId)?.entitlementType === "poc" ? 10 : 50;
  elements.diagnosticContext.hidden = true;
  elements.participantDesign.hidden = false;
  if (diagnosticsById.get(diagnosticId)?.entitlementType === "poc") {
    elements.sponsorPocFeedback.hidden = false;
    elements.sponsorPocFeedbackForm.elements.checkpoint.value = "sponsor-setup";
  }
  elements.participantDesignMessage.textContent = "Loading perspective design…";
  const data = await workspaceRequest(`/api/workspace/diagnostic-participants?diagnosticId=${encodeURIComponent(diagnosticId)}`);
  elements.participantDesignMessage.textContent = "";
  const approved = Boolean(data.participantPlan);
  elements.scopePerspectiveGuide.hidden = !data.scope;
  if (data.scope) {
    elements.scopePerspectiveTitle.textContent = `${data.scope.scopeName} · ${data.scope.scopeType.replaceAll("-", " ")}`;
    elements.scopePerspectiveBoundary.textContent = data.scope.scopeBoundary;
    elements.scopePerspectiveList.replaceChildren(...data.scope.guidance.map(value => Object.assign(document.createElement("li"), { textContent: value })));
    elements.scopePerspectiveDependencies.textContent = `Boundary dependencies to represent: ${data.scope.crossBoundaryDependencies}`;
    elements.cohortStartingPoints.hidden = false;
    elements.cohortStartingPointList.replaceChildren(...data.scope.guidance.map(value => Object.assign(document.createElement("li"), { textContent: value })));
  } else {
    elements.cohortStartingPoints.hidden = true;
    elements.cohortStartingPointList.replaceChildren();
  }
  elements.participantDesignForm.hidden = approved;
  elements.participantPlanApproved.hidden = !approved;
  if (approved) {
    const acceptedGapCount = data.participantPlan.acceptedGaps?.length || 0;
    elements.participantPlanSummary.textContent = `${data.participantPlan.participantSlots.length} identity-free viewpoints approved${acceptedGapCount ? ` · ${acceptedGapCount} acknowledged coverage ${acceptedGapCount === 1 ? "limitation" : "limitations"}` : " · no acknowledged coverage limitations"}.`;
    renderApprovedCohort(data.participantPlan);
    showSponsorJourney("protocol", diagnosticId);
  } else {
    elements.participantDesignForm.reset();
    elements.participantDesignForm.elements.diagnosticId.value = diagnosticId;
    elements.participantSlots.replaceChildren();
    participantSlotCount = 0;
    addParticipantSlot(); addParticipantSlot(); addParticipantSlot(); addParticipantSlot(); addParticipantSlot();
    showCoverageGaps([]);
    showPerspectiveStep(0);
  }
  elements.participantDesign.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderProtocolQuestions(questions) {
  elements.protocolQuestionList.replaceChildren();
  protocolQuestionReviews = new Map();
  for (const question of questions) {
    const row = document.createElement("div");
    row.className = "protocol-question";
    row.dataset.templateId = question.templateId;
    row.dataset.contextualizationNote = question.contextualizationNote;
    const number = document.createElement("span");
    number.textContent = String(question.position || elements.protocolQuestionList.children.length + 1).padStart(2, "0");
    const content = document.createElement("div");
    const prompt = document.createElement("p");
    prompt.textContent = question.questionText;
    prompt.dataset.protocolQuestionText = "";
    const governance = document.createElement("small");
    governance.textContent = question.evidenceLayerId
      ? `${question.evidenceLayerId.replaceAll("-", " ")} · ${(question.mechanismIds || []).map(value => value.replaceAll("-", " ")).join(", ") || "cross-cutting"} · governed template ${question.templateId}`
      : `${question.domainId} · ${question.evidenceObjectiveId} · governed template ${question.templateId}`;
    const actions = document.createElement("div");
    actions.className = "protocol-question-actions";
    const approve = document.createElement("button");
    approve.type = "button"; approve.className = "secondary-button"; approve.dataset.approveProtocolQuestion = ""; approve.textContent = "Approve question";
    const select = document.createElement("select");
    select.dataset.protocolRevisionReason = "";
    select.setAttribute("aria-label", `Reason to challenge question ${question.position}`);
    select.innerHTML = `<option value="">Reason to request a revision</option><option value="unnecessary-sensitivity">Unnecessarily sensitive language</option><option value="organizational-terminology">Terminology does not fit</option><option value="unclear-or-complex">Unclear or overly complex</option><option value="factually-inaccurate-premise">Factually inaccurate premise</option><option value="not-applicable-across-perspectives">May not apply across perspectives</option><option value="identity-or-disclosure-risk">Identity or disclosure concern</option><option value="duplicative-wording">Appears duplicative</option>`;
    const revise = document.createElement("button");
    revise.type = "button"; revise.className = "text-button"; revise.dataset.reframeProtocolQuestion = ""; revise.textContent = "Ask AI to reframe";
    const state = document.createElement("span");
    state.className = "protocol-question-state"; state.dataset.protocolQuestionState = ""; state.textContent = "Awaiting your review";
    actions.append(approve, select, revise, state);
    content.append(prompt, governance, actions);
    row.append(number, content);
    elements.protocolQuestionList.append(row);
    protocolQuestionReviews.set(question.templateId, { templateId: question.templateId, originalQuestion: question.questionText, revisions: [], status: "pending", contextualizationNote: question.contextualizationNote });
  }
  updateProtocolApprovalReadiness();
}

function updateProtocolApprovalReadiness() {
  const reviews = [...protocolQuestionReviews.values()];
  const approved = reviews.length > 0 && reviews.every(review => review.status === "approved");
  elements.approveProtocol.disabled = !approved;
  elements.protocolMessage.textContent = approved ? "All questions are approved. The common protocol is ready for final approval." : `${reviews.filter(review => review.status === "approved").length} of ${reviews.length} questions approved.`;
}

function perspectiveLabel(slot) {
  return [slot.leadershipLevel, slot.executionProximity, slot.functionalLens]
    .map(value => value.replace(/-/g, " "))
    .join(" · ");
}

async function loadDiagnosticInvitations(diagnosticId) {
  elements.diagnosticInvitationMessage.textContent = "Loading approved perspective slots…";
  const data = await workspaceRequest(`/api/workspace/diagnostic-invitations?diagnosticId=${encodeURIComponent(diagnosticId)}`);
  elements.diagnosticCollectionProgress.replaceChildren();
  const progressLabels = [
    [data.progress.submitted, "Completed perspectives"],
    [data.progress.inProgress, "Active interviews"],
    [data.progress.invited, "Invitations sent"],
    [data.progress.total, "Planned perspectives"]
  ];
  for (const [value, label] of progressLabels) {
    const item = document.createElement("div");
    const count = document.createElement("strong");
    const caption = document.createElement("span");
    count.textContent = value;
    caption.textContent = label;
    item.append(count, caption);
    elements.diagnosticCollectionProgress.append(item);
  }
  elements.invitationReadiness.replaceChildren();
  const readinessTitle = document.createElement("strong");
  const readinessCopy = document.createElement("span");
  const remaining = data.progress.remaining;
  readinessTitle.textContent = remaining ? `${remaining} perspective${remaining === 1 ? "" : "s"} still need an invitation` : "All planned perspectives have been invited";
  readinessCopy.textContent = remaining
    ? "Collection can begin as invitations are accepted. Shared findings remain withheld until at least five confidential interviews are complete."
    : "Collection is underway. Progress appears only in aggregate, and findings remain withheld until the confidentiality threshold is met.";
  elements.invitationReadiness.dataset.state = remaining ? "incomplete" : "ready";
  elements.invitationReadiness.append(readinessTitle, readinessCopy);
  elements.diagnosticInvitationSlots.replaceChildren();
  for (const slot of data.planSlots) {
    const card = document.createElement("article");
    card.className = "diagnostic-invitation-slot";
    const copy = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = slot.slotId;
    const perspective = document.createElement("span");
    perspective.textContent = perspectiveLabel(slot);
    copy.append(title, perspective);
    if (slot.invitation) {
      const status = document.createElement("span");
      const invitationAccepted = slot.invitation.status === "accepted";
      status.textContent = `${slot.invitation.emailAddress} · ${invitationAccepted ? "Invitation accepted" : "Invitation sent"}`;
      status.dataset.invitationStatus = invitationAccepted ? "accepted" : "sent";
      card.append(copy, status);
    } else if (data.canInvite) {
      const form = document.createElement("form");
      form.dataset.planSlotId = slot.slotId;
      const email = document.createElement("input");
      email.type = "email";
      email.required = true;
      email.maxLength = 254;
      email.placeholder = "participant@example.com";
      email.setAttribute("aria-label", `Email for ${slot.slotId}`);
      const send = document.createElement("button");
      send.type = "submit";
      send.textContent = "Send invitation";
      form.append(email, send);
      card.append(copy, form);
    } else {
      const status = document.createElement("span");
      status.textContent = "Not invited before collection closed";
      card.append(copy, status);
    }
    elements.diagnosticInvitationSlots.append(card);
  }
  elements.diagnosticInvitationMessage.textContent = "";
}

async function openProtocolReview(diagnosticId) {
  selectedDiagnosticId = diagnosticId;
  hideSponsorTaskSections();
  showSponsorJourney("protocol", diagnosticId);
  elements.protocolReview.hidden = false;
  elements.protocolMessage.textContent = "Compiling the governed protocol…";
  const data = await workspaceRequest(`/api/workspace/diagnostic-protocol-sponsor-review-v2?diagnosticId=${encodeURIComponent(diagnosticId)}`);
  const lifecycleState = diagnosticsById.get(diagnosticId)?.state;
  showSponsorJourney(data.canInvite ? (lifecycleState === "collecting" ? "collection" : "invitations") : "protocol", diagnosticId);
  elements.protocolMessage.textContent = "";
  const protocol = data.protocol;
  const approved = new Set(["awaiting-steward-finalization", "finalized"]).has(data.state);
  elements.protocolReviewForm.hidden = data.state !== "sponsor-review";
  elements.protocolApproved.hidden = !approved;
  elements.diagnosticInvitationPanel.hidden = !data.canInvite;
  if (!protocol) {
    elements.protocolQuestionList.replaceChildren();
    elements.protocolCoverage.replaceChildren();
    elements.protocolMessage.textContent = "Your steward is preparing the 18-question protocol from the approved context and perspective design. Return here when you are notified that it is ready for review.";
    elements.protocolReview.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  renderProtocolQuestions(protocol.questions);
  elements.protocolCoverage.replaceChildren(
    ...[
      `${data.policy.requiredQuestionCount} common questions`,
      "Sponsor-controlled review",
      "Steward finalization required",
      "Same finalized protocol for everyone"
    ].map(label => Object.assign(document.createElement("span"), { textContent: label }))
  );
  if (approved) {
    elements.protocolApprovedSummary.textContent = data.state === "finalized"
      ? `The sponsor-reviewed 18-question protocol was finalized by the steward ${formattedDate(protocol.stewardFinalizedAt)}.`
      : "Sponsor review is complete. The assigned steward must now finalize the exact question set before collection can be activated.";
    if (data.canInvite) await loadDiagnosticInvitations(diagnosticId);
  } else {
    elements.protocolReviewForm.reset();
    renderProtocolQuestions(protocol.questions);
  }
  elements.protocolReview.scrollIntoView({ behavior: "smooth", block: "start" });
}

function leadershipList(titleText, values) {
  const section = document.createElement("section");
  const title = document.createElement("strong");
  title.textContent = titleText;
  const list = document.createElement("ul");
  for (const value of values) {
    const item = document.createElement("li");
    item.textContent = value;
    list.append(item);
  }
  section.append(title, list);
  return section;
}

function renderExecutiveCapacityBrief(brief) {
  elements.executiveCapacityBrief.replaceChildren();
  const sections = [
    ["Capacity for what?", [brief.capacityForWhat?.commitment, brief.capacityForWhat?.successDefinition]],
    ["Current capacity fit", [brief.currentCapacityFit?.statement, brief.currentCapacityFit?.confidenceBasis]],
    ["What the evidence suggests", (brief.themes || []).map(theme => `${theme.title}: ${theme.summary}`)],
    ["Business exposure", brief.businessExposure || []],
    ["Evidence-informed Intervention Directions", (brief.interventionDirections?.options || []).map(option => `${option.recommended ? "Recommended first move" : `Alternative ${option.rank}`}: ${option.title}. ${option.proposedMechanism} Priority ${option.weighting?.weightedPriority}/100—decision support, not probability of success. Observable signal: ${option.timeToObservableSignal}`)],
    ["Paid activation boundary", [brief.interventionDirections?.commercialBoundary]],
    ["Uncertainty retained", [brief.uncertainty?.statement]]
  ];
  for (const [title, values] of sections) elements.executiveCapacityBrief.append(leadershipList(title, values.filter(Boolean)));
  const confidentiality = document.createElement("p");
  confidentiality.className = "leadership-intervention-direction";
  confidentiality.textContent = brief.confidentialityStatement;
  elements.executiveCapacityBrief.append(confidentiality);
  elements.executiveCapacityBrief.hidden = false;
}

async function openLeadershipValidation(diagnosticId) {
  selectedDiagnosticId = diagnosticId;
  hideSponsorTaskSections();
  showSponsorJourney("finding", diagnosticId);
  elements.leadershipValidation.hidden = false;
  elements.leadershipFinding.hidden = true;
  elements.executiveCapacityBrief.hidden = true;
  elements.downloadExecutiveBrief.hidden = true;
  elements.leadershipValidationForm.hidden = true;
  elements.leadershipFinding.replaceChildren();
  elements.leadershipValidationMessage.textContent = "Checking collection and confidentiality gates…";
  const briefData = await workspaceRequest(`/api/workspace/diagnostic-executive-brief?diagnosticId=${encodeURIComponent(diagnosticId)}`);
  elements.sponsorPocFeedback.hidden = true;
  if (briefData.state !== "available") {
    elements.leadershipReleaseState.textContent = briefData.state === "expired" ? "Your online POC Brief access has ended. A paid engagement restores permanent sponsor access." : "Your steward has not released the Executive Capacity Brief yet.";
    elements.leadershipReleaseState.dataset.state = "withheld";
    elements.leadershipValidationMessage.textContent = briefData.state === "expired" ? "The 30-day POC access and download window has closed." : "You will be notified when the Brief is ready for your Revelation Session.";
    elements.leadershipValidation.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  renderExecutiveCapacityBrief(briefData.brief);
  elements.downloadExecutiveBrief.hidden = false;
  elements.downloadExecutiveBrief.dataset.diagnosticId = diagnosticId;
  const accessLabel = briefData.access.permanent ? "Permanent sponsor access" : `POC access and download through ${new Date(briefData.access.expiresAt).toLocaleDateString()}`;
  const data = await workspaceRequest(`/api/workspace/diagnostic-leadership-validation?diagnosticId=${encodeURIComponent(diagnosticId)}`);
  if (data.state !== "ready") {
    const reason = data.reason === "advisor-validation"
      ? "The protected synthesis still requires advisor approval."
      : data.reason === "evidence-review"
        ? "Disclosure review must finish before any organizational finding can appear."
        : `Organizational findings remain withheld until every assigned perspective is complete and at least ${data.requiredCompleted} perspectives have contributed.`;
    elements.leadershipReleaseState.textContent = reason;
    elements.leadershipReleaseState.dataset.state = "withheld";
    elements.leadershipValidationMessage.textContent = "No participant-level or organizational finding data has been released.";
    elements.leadershipValidation.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  elements.leadershipReleaseState.textContent = `${data.confidentiality.completed} completed perspectives · Identity protected · Raw responses excluded · ${accessLabel}`;
  elements.leadershipReleaseState.dataset.state = "ready";
  const hypothesis = document.createElement("article");
  const heading = document.createElement("strong");
  heading.textContent = `Organizational constraint hypothesis · ${data.finding.confidence} confidence`;
  const statement = document.createElement("p");
  statement.textContent = data.finding.hypothesis.statement;
  const basis = document.createElement("p");
  basis.textContent = `Confidence basis: ${data.finding.hypothesis.confidenceBasis}`;
  const direction = document.createElement("p");
  direction.className = "leadership-intervention-direction";
  direction.textContent = `Intervention Direction: ${data.finding.hypothesis.interventionDirection}`;
  hypothesis.append(heading, statement, basis,
    leadershipList("Competing explanations", data.finding.hypothesis.competingExplanations.map(item => `${item.statement} Evidence needed: ${item.evidenceNeeded}`)),
    leadershipList("Blind spots and limitations", data.finding.hypothesis.blindSpots), direction);
  elements.leadershipFinding.append(hypothesis);
  for (const theme of data.finding.themes) {
    const card = document.createElement("article");
    const themeTitle = document.createElement("strong");
    themeTitle.textContent = `${theme.title} · ${theme.confidence} confidence`;
    const summary = document.createElement("p");
    summary.textContent = theme.summary;
    const themeBasis = document.createElement("p");
    themeBasis.textContent = `Confidence basis: ${theme.confidenceBasis}`;
    card.append(themeTitle, summary, themeBasis);
    elements.leadershipFinding.append(card);
  }
  elements.leadershipFinding.hidden = false;
  if (data.engagement?.pocBoundary === "intervention-directions") {
    elements.sponsorPocFeedback.hidden = false;
    elements.sponsorPocFeedbackForm.elements.checkpoint.value = data.validation?.decision === "accepted" ? "final-debrief" : "finding-release";
  }
  elements.leadershipValidationForm.hidden = Boolean(data.validation);
  elements.leadershipValidationMessage.textContent = data.validation
    ? data.validation.decision === "accepted"
      ? data.engagement?.pocBoundary === "intervention-directions"
        ? "POC complete. The governed finding and Intervention Directions are ready for the final debrief. Detailed intervention design, delivery, and reassessment require paid activation."
        : "Leadership accepted this finding. Paid intervention design is the next governed gate."
      : "Leadership requested revision. The finding has returned to protected synthesis review."
    : "This is an organizational finding for leadership validation—not participant-level reporting or a final causal conclusion.";
  elements.leadershipValidation.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function openInterventionAcceptance(diagnosticId) {
  selectedDiagnosticId = diagnosticId;
  hideSponsorTaskSections();
  showSponsorJourney("finding", diagnosticId);
  elements.interventionAcceptance.hidden = false;
  elements.clientInterventionAcceptance.hidden = true;
  elements.interventionCheckout.hidden = true;
  elements.clientInterventionProposal.replaceChildren();
  elements.interventionAcceptanceMessage.textContent = "Loading the governed intervention proposal…";
  const data = await workspaceRequest(`/api/workspace/diagnostic-intervention-acceptance?diagnosticId=${encodeURIComponent(diagnosticId)}`);
  if (data.state === "blocked") {
    elements.interventionAcceptanceMessage.textContent = "A governed intervention proposal is not yet available.";
    return;
  }
  const proposal = data.intervention;
  const heading = document.createElement("article");
  const title = document.createElement("strong"); title.textContent = proposal.objective;
  const rationale = document.createElement("p"); rationale.textContent = proposal.rationale;
  const scope = document.createElement("p"); scope.textContent = `Scope: ${proposal.scope}`;
  const terms = document.createElement("p"); terms.textContent = `${proposal.serviceRoute} · ${proposal.duration} · Offer ${proposal.commercialOfferRef}`;
  heading.append(title,rationale,scope,terms,
    leadershipList("Operating changes",proposal.operatingChanges),
    leadershipList("Accountable commitments",proposal.commitments.map(item=>`${item.ownerRole}: ${item.action} · ${item.timing}`)),
    leadershipList("Learning requirements",proposal.learningRequirements.length?proposal.learningRequirements:["No separate learning requirement proposed."]),
    leadershipList("Evidence plan",proposal.evidencePlan.map(item=>`${item.evidenceClass}: ${item.measure} · ${item.observationCadence}`)));
  elements.clientInterventionProposal.append(heading);
  elements.clientInterventionAcceptance.hidden=data.state!=="review"||!data.canAccept;
  elements.interventionCheckout.hidden=data.state!=="review"||!data.paymentRequired;
  elements.interventionAcceptanceMessage.textContent=data.state==="accepted"?"Intervention accepted. Capacity Operating Brief activation is the next gate.":data.paymentRequired?"Payment and intervention access must be verified before this proposal can be accepted.":"Review the complete scope and commercial terms before accepting.";
  elements.interventionAcceptance.scrollIntoView({behavior:"smooth",block:"start"});
}

function renderCapacityBrief(brief){elements.capacityBriefContent.replaceChildren();const focus=document.createElement("article");const focusTitle=document.createElement("strong");focusTitle.textContent="Current diagnosed constraint";const constraint=document.createElement("p");constraint.textContent=brief.currentFocus.constraint;const confidence=document.createElement("p");confidence.textContent=`${brief.currentFocus.confidence} confidence · ${brief.currentFocus.confidenceBasis}`;focus.append(focusTitle,constraint,confidence);const intervention=document.createElement("article");const interventionTitle=document.createElement("strong");interventionTitle.textContent=brief.intervention.objective;const detail=document.createElement("p");detail.textContent=`${brief.intervention.serviceRoute} · ${brief.intervention.duration} · ${brief.intervention.reviewCadence}`;intervention.append(interventionTitle,detail,leadershipList("Operating changes",brief.intervention.operatingChanges),leadershipList("Accountable commitments",brief.intervention.commitments.map(item=>`${item.ownerRole}: ${item.action} · ${item.timing}`)),leadershipList("Evidence plan",brief.intervention.evidencePlan.map(item=>`${item.evidenceClass}: ${item.measure} · ${item.observationCadence}`)));const uncertainty=document.createElement("article");const uncertaintyTitle=document.createElement("strong");uncertaintyTitle.textContent="Uncertainty kept visible";uncertainty.append(uncertaintyTitle,leadershipList("Competing explanations",brief.uncertainty.competingExplanations.map(item=>item.statement)),leadershipList("Blind spots",brief.uncertainty.blindSpots));elements.capacityBriefContent.append(focus,intervention,uncertainty);}
async function loadGuidedPlan(){const data=await workspaceRequest(`/api/workspace/capacity-brief-guided-plan?diagnosticId=${encodeURIComponent(selectedDiagnosticId)}`);elements.guidedPlan.hidden=data.state!=="active"||data.plan.status==="configured";elements.generateGuidedPlan.hidden=data.plan.status==="configured";elements.guidedPlanMessage.textContent=data.plan.status==="configured"?`${data.plan.actionItems} action commitments, ${data.plan.learningItems} learning items, and ${data.plan.checkIns} check-ins are configured.`:"No operating records exist yet. Generate a reviewable first draft from the accepted intervention.";}
function renderCapacityAttention(data){elements.capacityBriefAttention.hidden=data.state!=="active";if(data.state!=="active")return;elements.capacityAttentionList.replaceChildren();elements.capacityAttentionHeading.textContent=data.items.length?`${data.summary.total} item${data.summary.total===1?"":"s"} require leadership attention.`:"No current leadership decision requires attention.";for(const item of data.items){const card=document.createElement("article"),title=document.createElement("strong"),summary=document.createElement("p"),decision=document.createElement("p");title.textContent=`${item.priority} priority · ${item.title}`;summary.textContent=item.summary;decision.textContent=`Decision needed: ${item.decisionNeeded||"Review the item and establish the next accountable action."}`;card.append(title,summary,decision);if(item.dueAt){const due=document.createElement("small");due.textContent=`Due ${formattedDate(item.dueAt)}`;card.append(due);}elements.capacityAttentionList.append(card);}}
async function loadCapacityAttention(){renderCapacityAttention(await workspaceRequest(`/api/workspace/capacity-brief-attention?diagnosticId=${encodeURIComponent(selectedDiagnosticId)}`));}
function renderAdvisorEscalations(data){elements.advisorEscalation.hidden=data.state!=="active";if(data.state!=="active")return;elements.advisorEscalationList.replaceChildren();for(const item of data.requests){const card=document.createElement("article"),title=document.createElement("strong"),context=document.createElement("p"),outcome=document.createElement("p");title.textContent=`${item.supportType} · ${item.urgency} · ${item.status}`;context.textContent=item.context;outcome.textContent=`Desired outcome: ${item.desiredOutcome}`;card.append(title,context,outcome);elements.advisorEscalationList.append(card);}const active=data.requests.some(x=>["requested","contacted"].includes(x.status));elements.advisorEscalationForm.hidden=active;elements.advisorEscalationMessage.textContent=active?"Advisor support has been requested. The existing diagnostic and intervention history remain unchanged.":"Use this only when the platform-guided route needs targeted human judgment or delivery support.";}
async function loadAdvisorEscalations(){renderAdvisorEscalations(await workspaceRequest(`/api/workspace/intervention-advisor-escalation?diagnosticId=${encodeURIComponent(selectedDiagnosticId)}`));}
function renderDecisionHistory(data){elements.decisionHistory.hidden=data.state!=="active";if(data.state!=="active")return;elements.decisionHistoryList.replaceChildren();for(const event of data.events){const card=document.createElement("article"),title=document.createElement("strong"),summary=document.createElement("p"),date=document.createElement("small");title.textContent=`${event.title} · ${event.status}`;summary.textContent=event.summary;date.textContent=formattedDate(event.decidedAt);card.append(title,summary,date);elements.decisionHistoryList.append(card);}elements.decisionHistoryMessage.textContent=data.events.length?`${data.events.length} governed decision event${data.events.length===1?"":"s"}, newest first.`:"No governed decision events have been recorded yet.";}
async function loadDecisionHistory(){renderDecisionHistory(await workspaceRequest(`/api/workspace/capacity-brief-decision-history?diagnosticId=${encodeURIComponent(selectedDiagnosticId)}`));}
function renderCapacityLearning(items){elements.capacityLearningList.replaceChildren();for(const item of items){const card=document.createElement("article"),title=document.createElement("strong"),purpose=document.createElement("p"),details=document.createElement("small");title.textContent=`${item.title} · ${item.status}`;purpose.textContent=item.purpose;details.textContent=`${item.accountableRole} · Due ${formattedDate(item.dueAt)}`;card.append(title,purpose,details);if(item.status==="planned"){const prompt=document.createElement("p");prompt.textContent=`Application prompt: ${item.applicationPrompt}`;const form=document.createElement("form");form.dataset.learningCompletion=item.itemId;const note=document.createElement("textarea");note.name="applicationNote";note.minLength=20;note.maxLength=1200;note.required=true;note.placeholder="How was this applied in real work?";const complete=document.createElement("button");complete.className="secondary-button";complete.type="submit";complete.textContent="Record applied learning";form.append(note,complete);card.append(prompt,form);}else if(item.applicationNote){const note=document.createElement("p");note.textContent=`Applied learning: ${item.applicationNote}`;card.append(note);}elements.capacityLearningList.append(card);}elements.capacityLearningMessage.textContent=items.length?`${items.length} focused learning item${items.length===1?"":"s"}. Completion remains separate from outcome evidence.`:"No focused learning has been assigned yet.";}
async function loadCapacityLearning(){const data=await workspaceRequest(`/api/workspace/capacity-brief-learning?diagnosticId=${encodeURIComponent(selectedDiagnosticId)}`);elements.capacityLearningPath.hidden=data.state!=="active";if(data.state==="active"){renderCapacityLearning(data.items);if(!elements.capacityLearningForm.elements.dueAt.value){const due=new Date(Date.now()+14*24*60*60*1000-new Date().getTimezoneOffset()*60000);elements.capacityLearningForm.elements.dueAt.value=due.toISOString().slice(0,16);}}}
function renderCapacityActions(items){elements.capacityActionList.replaceChildren();for(const item of items){const card=document.createElement("article"),title=document.createElement("strong"),commitment=document.createElement("p"),gate=document.createElement("p"),evidence=document.createElement("small");title.textContent=`Day ${item.phaseDays} · ${item.status} · ${item.accountableRole}`;commitment.textContent=item.commitment;gate.textContent=`Decision gate: ${item.decisionGate}`;evidence.textContent=`Evidence prompt: ${item.evidencePrompt} · Due ${formattedDate(item.dueAt)}`;card.append(title,commitment,gate,evidence);if(item.status==="planned"){const form=document.createElement("form");form.dataset.actionResolution=item.itemId;const note=document.createElement("textarea");note.name="resolutionNote";note.minLength=20;note.maxLength=1200;note.required=true;note.placeholder="What happened, or what is blocking the commitment?";for(const [status,label,style] of [["completed","Mark completed","secondary-button"],["blocked","Flag for attention","text-button"]]){const button=document.createElement("button");button.type="submit";button.name="status";button.value=status;button.className=style;button.textContent=label;form.append(button);}form.prepend(note);card.append(form);}else if(item.resolutionNote){const note=document.createElement("p");note.textContent=`Resolution: ${item.resolutionNote}`;card.append(note);}elements.capacityActionList.append(card);}const blocked=items.filter(x=>x.status==="blocked").length;elements.capacityActionMessage.textContent=blocked?`${blocked} commitment${blocked===1?"":"s"} flagged for leadership attention.`:items.length?`${items.length} sequenced operating commitment${items.length===1?"":"s"}.`:"No 30/60/90-day commitments have been sequenced yet.";}
async function loadCapacityActions(){const data=await workspaceRequest(`/api/workspace/capacity-brief-action-path?diagnosticId=${encodeURIComponent(selectedDiagnosticId)}`);elements.capacityActionPath.hidden=data.state!=="active";if(data.state==="active"){renderCapacityActions(data.items);if(!elements.capacityActionForm.elements.dueAt.value){const due=new Date(Date.now()+30*24*60*60*1000-new Date().getTimezoneOffset()*60000);elements.capacityActionForm.elements.dueAt.value=due.toISOString().slice(0,16);}await loadGuidedPlan();await loadCapacityAttention();await loadAdvisorEscalations();await loadDecisionHistory();}}
function renderCapacityCheckIns(checkIns){elements.capacityCheckInList.replaceChildren();for(const item of checkIns){const card=document.createElement("article"),title=document.createElement("strong"),prompt=document.createElement("p");title.textContent=`${item.attention?"Attention · ":""}${item.status} · ${formattedDate(item.dueAt)}`;prompt.textContent=item.prompt;card.append(title,prompt);if(item.status==="open"){const form=document.createElement("form");form.dataset.checkInResolution=item.checkInId;const note=document.createElement("textarea");note.name="note";note.minLength=20;note.maxLength=1500;note.required=true;note.placeholder="What was observed, or why does this require attention?";for(const [status,label,style] of [["responded","Record response","secondary-button"],["escalated","Escalate","text-button"]]){const button=document.createElement("button");button.type="submit";button.value=status;button.textContent=label;button.className=style;form.append(button);}form.prepend(note);card.append(form);}else{const detail=document.createElement("p");detail.textContent=item.response||item.attentionReason;card.append(detail);}elements.capacityCheckInList.append(card);}const attention=checkIns.filter(x=>x.attention).length;elements.capacityCheckInMessage.textContent=attention?`${attention} check-in${attention===1?" requires":"s require"} leadership attention.`:checkIns.length?`${checkIns.length} guided check-in${checkIns.length===1?"":"s"} scheduled or resolved.`:"No guided check-ins have been scheduled yet.";}
async function loadCapacityCheckIns(){const data=await workspaceRequest(`/api/workspace/capacity-brief-check-ins?diagnosticId=${encodeURIComponent(selectedDiagnosticId)}`);elements.capacityCheckIns.hidden=data.state!=="active";if(data.state==="active"){renderCapacityCheckIns(data.checkIns);if(!elements.capacityCheckInForm.elements.dueAt.value){const due=new Date(Date.now()+7*24*60*60*1000-new Date().getTimezoneOffset()*60000);elements.capacityCheckInForm.elements.dueAt.value=due.toISOString().slice(0,16);}await loadCapacityAttention();await loadDecisionHistory();}}
function renderCapacityEvidence(entries){elements.capacityEvidenceList.replaceChildren();for(const entry of entries){const card=document.createElement("article");const title=document.createElement("strong");title.textContent=`${entry.evidenceClass} · ${formattedDate(entry.observedAt)}`;const observation=document.createElement("p");observation.textContent=entry.observation;const source=document.createElement("small");source.textContent=`Source: ${entry.sourceNote}`;card.append(title,observation,source);elements.capacityEvidenceList.append(card);}elements.capacityEvidenceMessage.textContent=entries.length?`${entries.length} evidence observation${entries.length===1?"":"s"} recorded.`:"No evidence observations have been recorded yet.";}
async function loadCapacityEvidence(){const data=await workspaceRequest(`/api/workspace/capacity-brief-evidence?diagnosticId=${encodeURIComponent(selectedDiagnosticId)}`);elements.capacityEvidenceJournal.hidden=data.state!=="active";if(data.state==="active"){renderCapacityEvidence(data.entries);if(!elements.capacityEvidenceForm.elements.observedAt.value){const now=new Date(Date.now()-new Date().getTimezoneOffset()*60000);elements.capacityEvidenceForm.elements.observedAt.value=now.toISOString().slice(0,16);}}}
function renderCapacityReviews(reviews){elements.capacityReviewList.replaceChildren();for(const review of reviews){const card=document.createElement("article");const title=document.createElement("strong");title.textContent=`${review.decision} · ${formattedDate(review.createdAt)}`;const summary=document.createElement("p");summary.textContent=review.summary;const assessment=document.createElement("p");assessment.textContent=`Evidence assessment: ${review.evidenceAssessment}`;card.append(title,summary,assessment);if(review.adjustments.length)card.append(leadershipList("Adjustments",review.adjustments));if(review.nextReviewAt){const next=document.createElement("small");next.textContent=`Next review: ${formattedDate(review.nextReviewAt)}`;card.append(next);}elements.capacityReviewList.append(card);}elements.capacityReviewMessage.textContent=reviews.length?`${reviews.length} intervention review${reviews.length===1?"":"s"} recorded.`:"No formal intervention reviews have been recorded yet.";}
async function loadCapacityReviews(){const data=await workspaceRequest(`/api/workspace/capacity-brief-reviews?diagnosticId=${encodeURIComponent(selectedDiagnosticId)}`);elements.capacityReviewJournal.hidden=data.state!=="active";if(data.state==="active"){renderCapacityReviews(data.reviews);if(!elements.capacityReviewForm.elements.nextReviewAt.value){const next=new Date(Date.now()+14*24*60*60*1000-new Date().getTimezoneOffset()*60000);elements.capacityReviewForm.elements.nextReviewAt.value=next.toISOString().slice(0,16);}}}
function renderReassessment(plan){elements.reassessmentSummary.replaceChildren();if(!plan)return;const card=document.createElement("article"),title=document.createElement("strong"),method=document.createElement("p"),coverage=document.createElement("p"),privacy=document.createElement("p");title.textContent=`Reassessment planned for ${formattedDate(plan.targetAt)}`;method.textContent=`Method ${plan.methodVersion} · Protocol ${plan.protocol.protocolVersion} · Question library ${plan.protocol.questionLibraryVersion}`;coverage.textContent=`Original coverage preserved across ${(plan.coverage.coverageObjectives?.leadershipLevels||[]).length} leadership levels, ${(plan.coverage.coverageObjectives?.executionProximities||[]).length} execution proximities, and ${(plan.coverage.coverageObjectives?.functionalLenses||[]).length} functional lenses.`;privacy.textContent="Participant identities and response content are not copied. New invitations create a separate confidential evidence set.";card.append(title,method,coverage,privacy);if(plan.status==="planned"){const activate=document.createElement("button");activate.className="primary-button";activate.type="button";activate.dataset.activateReassessment="";activate.textContent="Open reassessment collection";card.append(activate);}else{const state=document.createElement("strong");state.textContent="Reassessment collection opened";const next=document.createElement("p");next.textContent="The linked diagnostic is ready for new participant invitations. Comparison remains withheld.";card.append(state,next);}elements.reassessmentSummary.append(card);elements.reassessmentForm.hidden=true;elements.reassessmentMessage.textContent=plan.comparison.message;}
function renderReassessmentComparison(data){elements.reassessmentComparison.replaceChildren();if(data.state!=="released")return;const value=data.comparison,card=document.createElement("article"),title=document.createElement("strong"),changed=document.createElement("p"),persisted=document.createElement("p"),emerged=document.createElement("p"),uncertainty=document.createElement("p"),implication=document.createElement("p"),trace=document.createElement("small");title.textContent=`Governed comparison · ${value.changeAssessment}`;changed.textContent=`Changed: ${value.changed}`;persisted.textContent=`Persisted: ${value.persisted}`;emerged.textContent=`Newly emerged: ${value.emerged||"No separate newly emerged pattern was established."}`;uncertainty.textContent=`Still uncertain: ${value.uncertainty}`;implication.textContent=`Leadership implication: ${value.leadershipImplication}`;trace.textContent=`Evidence trace: ${value.evidenceTrace.baselineThemeTitles.length} baseline themes · ${value.evidenceTrace.followupThemeTitles.length} reassessment themes · ${value.confidentiality.completed} confidential perspectives`;card.append(title,changed,persisted,emerged,uncertainty,implication,trace);elements.reassessmentComparison.append(card);}
async function loadReassessment(){const data=await workspaceRequest(`/api/workspace/diagnostic-reassessment?diagnosticId=${encodeURIComponent(selectedDiagnosticId)}`);elements.reassessmentPlanning.hidden=!new Set(["reassessment","completed"]).has(data.state);if(!elements.reassessmentPlanning.hidden){renderReassessment(data.plan);if(!data.plan&&!elements.reassessmentForm.elements.targetAt.value){const next=new Date(Date.now()+30*24*60*60*1000-new Date().getTimezoneOffset()*60000);elements.reassessmentForm.elements.targetAt.value=next.toISOString().slice(0,16);}if(data.plan){const comparison=await workspaceRequest(`/api/workspace/diagnostic-reassessment-comparison?baselineDiagnosticId=${encodeURIComponent(selectedDiagnosticId)}`);renderReassessmentComparison(comparison);elements.reassessmentMessage.textContent=comparison.state==="released"?"Comparison released after method, confidentiality, advisor, leadership, and evidence-trace gates passed.":data.plan.comparison.message;}else elements.reassessmentMessage.textContent=data.comparison.message;}}
async function openCapacityBrief(diagnosticId){selectedDiagnosticId=diagnosticId;elements.diagnosticContext.hidden=true;elements.participantDesign.hidden=true;elements.protocolReview.hidden=true;elements.leadershipValidation.hidden=true;elements.interventionAcceptance.hidden=true;elements.capacityBrief.hidden=false;elements.capacityLearningPath.hidden=true;elements.capacityActionPath.hidden=true;elements.capacityCheckIns.hidden=true;elements.capacityEvidenceJournal.hidden=true;elements.capacityReviewJournal.hidden=true;elements.reassessmentPlanning.hidden=true;elements.activateCapacityBrief.hidden=true;elements.capacityBriefContent.replaceChildren();elements.capacityBriefMessage.textContent="Preparing the Capacity Operating Brief…";const data=await workspaceRequest(`/api/workspace/capacity-operating-brief?diagnosticId=${encodeURIComponent(diagnosticId)}`);if(data.state==="blocked"){elements.capacityBriefMessage.textContent="The intervention must be accepted before the Brief can be activated.";return;}if(data.state==="ready"){elements.activateCapacityBrief.hidden=false;elements.capacityBriefMessage.textContent="The accepted intervention is ready to become the active executive workspace.";return;}renderCapacityBrief(data.brief);await loadCapacityActions();await loadCapacityCheckIns();await loadCapacityLearning();await loadCapacityEvidence();await loadCapacityReviews();await loadReassessment();elements.capacityBriefMessage.textContent=`Brief ${data.brief.briefVersion} active · Next review ${data.brief.nextReview.cadence}`;elements.capacityBrief.scrollIntoView({behavior:"smooth",block:"start"});}

function diagnosticList(value) {
  return String(value || "").split(/\n+/).map(item => item.trim()).filter(Boolean);
}

const diagnosticContextSteps = [
  { label: "Orientation 1 of 2", name: "Define your vantage point" },
  { label: "Orientation 2 of 2", name: "Define the system being examined" },
  { label: "Question 1 of 6", name: "What is happening now?" },
  { label: "Question 2 of 6", name: "What matters most?" },
  { label: "Question 3 of 6", name: "What is at risk?" },
  { label: "Question 4 of 6", name: "What decision must this inform?" },
  { label: "Question 5 of 6", name: "What has changed or already been tried?" },
  { label: "Question 6 of 6", name: "What should we handle carefully?" }
];
let diagnosticContextStep = 0;
const sponsorResponsibilityField=elements.diagnosticContextForm.elements.sponsorResponsibility,sponsorResponsibilityCount=document.querySelector("[data-sponsor-responsibility-count]");
function updateSponsorResponsibilityCount(){sponsorResponsibilityCount.textContent=`${sponsorResponsibilityField.value.length.toLocaleString()} / 2,000`;}
sponsorResponsibilityField.addEventListener("input",updateSponsorResponsibilityCount);
const contextApprovalNoteField=elements.diagnosticContextForm.elements.approvalNote;
function updateContextApprovalNoteCount(){elements.contextApprovalNoteCount.textContent=`${contextApprovalNoteField.value.length.toLocaleString()} / 2,000`;}
contextApprovalNoteField.addEventListener("input",updateContextApprovalNoteCount);
const scopeSizeLabels={enterprise:"Enterprise headcount","business-unit":"Business-unit headcount",function:"Function headcount","leadership-layer":"Leadership-layer headcount","cross-functional-system":"Cross-functional-system headcount"};
function organizationSizeBand(headcount){return headcount<25?"under-25":headcount<50?"25-49":headcount<150?"50-149":headcount<400?"150-399":"400-plus";}
function syncDiagnosticScopeSize(){const form=elements.diagnosticContextForm.elements,type=form.diagnosticScopeType.value,total=Number(form.organizationHeadcount.value)||0,scope=form.diagnosticScopeHeadcount,label=document.querySelector("[data-scope-size-label]"),guidance=document.querySelector("[data-scope-size-guidance]");label.textContent=scopeSizeLabels[type]||"System headcount";form.organizationSizeBand.value=total?organizationSizeBand(total):"";scope.max=total||1000000;if(type==="enterprise"){scope.value=total||"";scope.readOnly=true;guidance.textContent="Enterprise scope automatically matches the total organization headcount.";}else{scope.readOnly=false;if(total&&Number(scope.value)>total)scope.value="";guidance.textContent="This lets the diagnostic understand the scope relative to the full organization.";}}
elements.diagnosticContextForm.elements.diagnosticScopeType.addEventListener("change",syncDiagnosticScopeSize);
elements.diagnosticContextForm.elements.organizationHeadcount.addEventListener("input",syncDiagnosticScopeSize);

function diagnosticContextReviewPayload() {
  const values = Object.fromEntries(new FormData(elements.diagnosticContextForm));
  return {
    diagnosticId: selectedDiagnosticId,
    organizationSizeBand: values.organizationSizeBand,
    organizationHeadcount: Number(values.organizationHeadcount),
    sponsorPerspective: values.sponsorPerspective,
    sponsorRoleTitle: values.sponsorRoleTitle,
    sponsorOrganizationalLevel: values.sponsorOrganizationalLevel,
    sponsorFunction: values.sponsorFunction,
    sponsorResponsibility: values.sponsorResponsibility,
    industry: values.industry,
    businessModel: values.businessModel,
    operatingEnvironment: values.operatingEnvironment,
    organizationOffering: values.organizationOffering,
    diagnosticScopeType: values.diagnosticScopeType,
    diagnosticScopeName: values.diagnosticScopeName,
    diagnosticScopeHeadcount: Number(values.diagnosticScopeHeadcount),
    diagnosticScopeBoundary: values.diagnosticScopeBoundary,
    crossBoundaryDependencies: values.crossBoundaryDependencies,
    organizationContext: values.organizationContext,
    strategicPriority: values.strategicPriority,
    triggeringConcern: values.triggeringConcern,
    decisionsAtRisk: values.decisionsAtRisk,
    recentChanges: diagnosticList(values.recentChanges),
    priorInterventions: diagnosticList(values.priorInterventions),
    knownSensitivities: values.knownSensitivities,
    decisionNeeded: values.decisionNeeded,
    approvalNote: values.approvalNote || ""
  };
}

function renderDiagnosticContextReview() {
  const values = Object.fromEntries(new FormData(elements.diagnosticContextForm));
  const summaries = [
    ["Your vantage point", `${values.sponsorRoleTitle} · ${values.sponsorOrganizationalLevel} · ${values.sponsorFunction}\n${values.sponsorResponsibility}`],
    ["Business and operating context", `${values.industry} · ${values.businessModel} · ${values.operatingEnvironment}\n${values.organizationOffering}`],
    ["System being examined", `${values.diagnosticScopeName} · ${values.diagnosticScopeType}\n${Number(values.diagnosticScopeHeadcount).toLocaleString()} of ${Number(values.organizationHeadcount).toLocaleString()} people (${Math.round(Number(values.diagnosticScopeHeadcount)/Number(values.organizationHeadcount)*100)}% of the organization)\nInside the inquiry: ${values.diagnosticScopeBoundary}\nBoundary dependencies: ${values.crossBoundaryDependencies}`],
    ["What is happening now?", [values.organizationContext, values.triggeringConcern].filter(Boolean).join("\n\n")],
    ["What matters most?", values.strategicPriority],
    ["What is at risk?", values.decisionsAtRisk],
    ["Decision to inform", values.decisionNeeded],
    ["Recent changes", values.recentChanges || "No recent changes added."],
    ["What has already been tried", values.priorInterventions || "No prior interventions added."],
    ["Handle carefully", values.knownSensitivities || "No additional sensitivities added."]
  ];
  elements.contextReviewList.replaceChildren(...summaries.map(([label, value]) => {
    const card = document.createElement("article");
    const title = document.createElement("strong");
    const content = document.createElement("p");
    title.textContent = label;
    content.textContent = value;
    card.append(title, content);
    return card;
  }));
}

function synthesisSection(title, content) {
  const section = document.createElement("section"), heading = document.createElement("strong"), body = document.createElement("p");
  heading.textContent = title; body.textContent = content; section.append(heading, body); return section;
}

async function loadDiagnosticContextSynthesis() {
  elements.contextAiStatus.textContent = "Connecting the organizational moment, execution tension, stakes, and decision…";
  elements.contextAiContent.hidden = true;
  const data = await workspaceRequest("/api/workspace/diagnostic-context-synthesis", { method: "POST", body: diagnosticContextReviewPayload() });
  const value = data.synthesis;
  const areas = document.createElement("ul");
  for (const area of value.areasToExplore) areas.append(Object.assign(document.createElement("li"), { textContent: area }));
  const exploration = document.createElement("section"), explorationTitle = document.createElement("strong"), explorationNote = document.createElement("p");
  explorationTitle.textContent = "What the diagnostic will explore";
  explorationNote.textContent = "You do not need to answer these now. The diagnostic will examine them through the perspectives you select.";
  exploration.append(explorationTitle, explorationNote, areas);
  elements.contextAiContent.replaceChildren(
    synthesisSection("The moment, in one frame", value.executiveFrame),
    synthesisSection("The tension underneath it", value.centralTension),
    synthesisSection("Why this matters now", value.businessStakes),
    synthesisSection("The decision at the center", value.decisionAtCenter),
    synthesisSection("A working implication—not a finding", value.workingImplication),
    exploration
  );
  elements.contextAiStatus.textContent = data.boundary;
  elements.contextAiContent.hidden = false;
}

function updateContextApprovalReadiness() {
  if (diagnosticContextStep !== elements.contextSteps.length) return;
  elements.approveDiagnosticContext.disabled = !elements.diagnosticContextForm.elements.approved.checked;
}

function showDiagnosticContextStep(step = 0) {
  diagnosticContextStep = Math.max(0, Math.min(step, elements.contextSteps.length));
  const reviewing = diagnosticContextStep === elements.contextSteps.length;
  elements.contextSteps.forEach((section, index) => { section.hidden = index !== diagnosticContextStep; });
  elements.contextReview.hidden = !reviewing;
  if (reviewing) {
    renderDiagnosticContextReview();
    loadDiagnosticContextSynthesis().catch(error => {
      elements.contextAiStatus.textContent = `${error.message} You can still verify your answers and approve the bounded context.`;
    });
  }
  elements.contextProgressLabel.textContent = reviewing ? "Review and approve" : diagnosticContextSteps[diagnosticContextStep].label;
  elements.contextProgressName.textContent = reviewing ? "Confirm the bounded starting point" : diagnosticContextSteps[diagnosticContextStep].name;
  elements.contextProgressBar.style.width = `${reviewing ? 100 : ((diagnosticContextStep + 1) / elements.contextSteps.length) * 100}%`;
  elements.contextBack.hidden = diagnosticContextStep === 0;
  elements.contextBack.textContent = reviewing ? "Modify my answers" : "Back";
  elements.contextNext.hidden = reviewing;
  elements.approveDiagnosticContext.hidden = !reviewing;
  elements.diagnosticContextMessage.textContent = "";
  delete elements.diagnosticContextMessage.dataset.tone;
  updateContextApprovalReadiness();
}

function validateDiagnosticContextStep() {
  const fields = elements.contextSteps[diagnosticContextStep]?.querySelectorAll("input, select, textarea") || [];
  for (const field of fields) if (!field.reportValidity()) return false;
  return true;
}

async function openDiagnosticContext(diagnosticId) {
  selectedDiagnosticId = diagnosticId;
  hideSponsorTaskSections();
  showSponsorJourney("discovery", diagnosticId);
  elements.diagnosticContext.hidden = false;
  elements.diagnosticContextForm.elements.diagnosticId.value = diagnosticId;
  elements.diagnosticContextMessage.textContent = "Loading governed discovery…";
  const data = await workspaceRequest(`/api/workspace/diagnostic-context?diagnosticId=${encodeURIComponent(diagnosticId)}`);
  elements.diagnosticContextMessage.textContent = "";
  const approved = Boolean(data.context);
  elements.diagnosticContextForm.hidden = approved;
  elements.diagnosticContextApproved.hidden = !approved;
  if (approved) {
    elements.diagnosticContextTitle.textContent = "Diagnostic context approved";
    elements.diagnosticContextIntroduction.textContent = "The bounded starting point is established. Continue into perspective design to determine who can reveal how this system is actually operating.";
    showSponsorJourney("perspectives", diagnosticId);
    const summaries = [
      ["System being examined", `${data.context.diagnosticScopeName} · ${data.context.diagnosticScopeType}`],
      ["Organizational moment", data.context.triggeringConcern],
      ["Decision to inform", data.context.decisionNeeded]
    ];
    elements.diagnosticContextSummary.replaceChildren(...summaries.map(([label, value]) => {
      const article = document.createElement("article"), strong = document.createElement("strong"), paragraph = document.createElement("p");
      strong.textContent = label; paragraph.textContent = value; article.append(strong, paragraph); return article;
    }));
    elements.closeDiagnosticContext.textContent = "Return to workspace";
  } else {
    elements.diagnosticContextTitle.textContent = "Approve the Diagnostic Context Brief";
    elements.diagnosticContextIntroduction.textContent = "Establish the organizational moment and the leadership decision this diagnostic must inform. Approved context guides participant design without predetermining findings.";
    elements.closeDiagnosticContext.textContent = "Close";
    elements.diagnosticContextForm.reset();
    updateSponsorResponsibilityCount();
    updateContextApprovalNoteCount();
    syncDiagnosticScopeSize();
    elements.diagnosticContextForm.elements.diagnosticId.value = diagnosticId;
    showDiagnosticContextStep(0);
  }
  elements.diagnosticContext.scrollIntoView({ behavior: "smooth", block: "start" });
}

let workspaceDiagnosticMethodVersion = "1.0.0",currentOwnerDiagnostic=null;
async function loadDiagnostics() {
  const data = await workspaceRequest("/api/workspace/diagnostics");
  workspaceDiagnosticMethodVersion = data.policy.methodVersion;
  renderDiagnostics(data.diagnostics);
  return data.diagnostics;
}

function setCollectionMessage(message = "", tone = null) {
  elements.collectionMessage.textContent = message;
  if (tone) elements.collectionMessage.dataset.tone = tone;
  else delete elements.collectionMessage.dataset.tone;
}

function setInvitationMessage(message = "", tone = null) {
  elements.invitationMessage.textContent = message;
  if (tone) elements.invitationMessage.dataset.tone = tone;
  else delete elements.invitationMessage.dataset.tone;
}

async function workspaceRequest(path, options = {}) {
  const token = await clerk?.session?.getToken({ organizationId: clerk?.organization?.id });
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.body === undefined ? {} : { "Content-Type": "application/json" })
    },
    ...options,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
  const responseText = await response.text();
  let data;
  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    if (response.status === 404) {
      throw new Error("This local workspace server is out of date. Stop it, restart the development server, and try again.");
    }
    throw new Error(response.ok
      ? "The workspace returned an unreadable response. Please try again."
      : responseText || "The workspace operation could not be completed.");
  }
  if (!response.ok) throw new Error(data.error || "The workspace operation could not be completed.");
  return data;
}

function actionButton(label, action, roundId) {
  const button = document.createElement("button");
  button.className = "round-action";
  button.type = "button";
  button.dataset.action = action;
  button.dataset.roundId = roundId;
  button.textContent = label;
  return button;
}

function renderRounds(rounds) {
  elements.roundList.replaceChildren();
  for (const round of rounds) {
    const card = document.createElement("article");
    card.className = "round-card";
    const copy = document.createElement("div");
    const title = document.createElement("h4");
    title.textContent = round.label;
    const dates = document.createElement("p");
    dates.textContent = `${formattedDate(round.opensAt)}–${formattedDate(round.closesAt)} · ${round.minimumParticipants} responses required`;
    const status = document.createElement("span");
    status.className = "round-status";
    status.textContent = round.status;
    const side = document.createElement("div");
    side.className = "round-card-side";
    const actions = document.createElement("div");
    actions.className = "round-actions";
    if (round.status === "draft") {
      actions.append(
        actionButton("Edit", "edit", round.id),
        actionButton("Open round", "open", round.id),
        actionButton("Delete", "delete", round.id)
      );
    } else if (round.status === "open") {
      actions.append(actionButton("Manage invitations", "invitations", round.id));
    } else if (
      round.status === "closed"
      && !rounds.some(value => value.priorRoundId === round.id)
    ) {
      actions.append(actionButton("Create follow-up", "follow-up", round.id));
    }
    side.append(status, actions);
    copy.append(title, dates);
    card.append(copy, side);
    elements.roundList.append(card);
  }
  elements.roundsSection.hidden = rounds.length === 0;
}

async function loadCollectionRounds() {
  const data = await workspaceRequest("/api/workspace/rounds");
  elements.thresholdValue.textContent = String(data.policy.minimumParticipants);
  collectionRounds = data.rounds;
  renderRounds(collectionRounds);
  return collectionRounds;
}

function resetRoundForm() {
  editingRoundId = null;
  followUpRoundId = null;
  elements.collectionForm.reset();
  elements.createRound.textContent = "Create draft round";
  elements.cancelEdit.hidden = true;
  const today = localDateValue();
  elements.collectionForm.elements.opensAt.min = today;
  elements.collectionForm.elements.closesAt.min = today;
}

function prepareFollowUp(round) {
  resetRoundForm();
  followUpRoundId = round.id;
  const opensAt = new Date();
  opensAt.setDate(opensAt.getDate() + 1);
  const closesAt = new Date(opensAt);
  closesAt.setDate(closesAt.getDate() + 30);
  elements.collectionForm.elements.label.value = `${round.label} Follow-up`;
  elements.collectionForm.elements.opensAt.value = localDateValue(opensAt);
  elements.collectionForm.elements.closesAt.value = localDateValue(closesAt);
  elements.createRound.textContent = "Create linked follow-up draft";
  elements.cancelEdit.hidden = false;
  setCollectionMessage(
    "This follow-up will preserve the baseline assessment and scoring versions."
  );
  elements.collectionForm.scrollIntoView({ behavior: "smooth", block: "center" });
}

function editRound(round) {
  editingRoundId = round.id;
  elements.collectionForm.elements.label.value = round.label;
  elements.collectionForm.elements.opensAt.value = localDateValue(new Date(round.opensAt));
  elements.collectionForm.elements.closesAt.value = localDateValue(new Date(round.closesAt));
  elements.createRound.textContent = "Save draft changes";
  elements.cancelEdit.hidden = false;
  setCollectionMessage("Editing the draft. Opening it will lock these setup details.");
  elements.collectionForm.scrollIntoView({ behavior: "smooth", block: "center" });
}

function renderInvitations(data) {
  elements.invitedCount.textContent = String(data.counts.invited);
  elements.acceptedCount.textContent = String(data.counts.accepted);
  elements.pendingCount.textContent = String(data.counts.pending);
  elements.submittedCount.textContent = String(data.counts.submitted);
  elements.invitationList.replaceChildren();
  currentNonrespondents = data.invitations.filter(
    invitation => ["pending", "accepted", "started"].includes(invitation.participationStatus)
  );
  elements.reminderActions.hidden = currentNonrespondents.length === 0;
  elements.reminderSummary.textContent = currentNonrespondents.length === 1
    ? "1 invited participant has not yet submitted."
    : `${currentNonrespondents.length} invited participants have not yet submitted.`;
  for (const invitation of data.invitations) {
    const card = document.createElement("article");
    card.className = "invitation-card";
    const copy = document.createElement("div");
    const email = document.createElement("strong");
    email.textContent = invitation.emailAddress;
    const status = document.createElement("span");
    const participationLabel = {
      pending: "Invitation pending",
      accepted: "Accepted · not started",
      started: "Assessment started",
      submitted: "Submitted",
      revoked: "Invitation revoked",
      expired: "Invitation expired"
    }[invitation.participationStatus] || invitation.participationStatus;
    status.textContent = participationLabel;
    copy.append(email, status);
    card.append(copy);
    const actions = document.createElement("div");
    actions.className = "invitation-card-actions";
    if (["pending", "accepted", "started"].includes(invitation.participationStatus)) {
      const reminder = document.createElement("button");
      reminder.className = "round-action";
      reminder.type = "button";
      reminder.dataset.reminderEmail = invitation.emailAddress;
      reminder.textContent = "Draft reminder";
      actions.append(reminder);
    }
    if (invitation.status === "pending") {
      const revoke = document.createElement("button");
      revoke.className = "round-action";
      revoke.type = "button";
      revoke.dataset.invitationId = invitation.id;
      revoke.textContent = "Revoke";
      actions.append(revoke);
    }
    if (actions.childElementCount > 0) card.append(actions);
    elements.invitationList.append(card);
  }
}

function reminderUrl(emailAddresses) {
  const round = collectionRounds.find(value => value.id === selectedRoundId);
  const subject = `Reminder: ${round?.label || "Organizational Capacity assessment"}`;
  const body = [
    "Your private Organizational Capacity perspective has not yet been submitted.",
    "",
    "Please use your original invitation and complete the assessment before the collection closes.",
    "",
    "Your individual answers and scores are never shown to the workspace Owner or Facilitator."
  ].join("\n");
  const url = new URL("mailto:");
  if (emailAddresses.length === 1) url.pathname = emailAddresses[0];
  else url.searchParams.set("bcc", emailAddresses.join(","));
  url.searchParams.set("subject", subject);
  url.searchParams.set("body", body);
  return url.toString();
}

function renderWorkspaceResults(data) {
  const result = data.result;
  const minimumRequired = result.minimumRequired || 5;
  const participantCount = result.participantCount || 0;
  const percentage = Math.min(100, Math.round((participantCount / minimumRequired) * 100));
  elements.resultsCount.textContent = `${participantCount} of ${minimumRequired}`;
  elements.resultsProgress.setAttribute("aria-valuemax", String(minimumRequired));
  elements.resultsProgress.setAttribute("aria-valuenow", String(participantCount));
  elements.resultsProgressFill.style.width = `${percentage}%`;
  elements.aggregateProfile.hidden = result.policy !== "aggregate";

  if (result.policy === "suppressed") {
    const perspectiveWord = participantCount === 1 ? "perspective" : "perspectives";
    const remainingWord = result.remaining === 1 ? "perspective" : "perspectives";
    elements.resultsMessage.textContent =
      `${participantCount} private ${perspectiveWord} submitted. ` +
      `${result.remaining} more ${remainingWord} needed before shared results appear.`;
    elements.aggregateDomains.replaceChildren();
    elements.constraintQuestions.replaceChildren();
    return;
  }

  if (result.policy !== "aggregate") {
    elements.resultsMessage.textContent =
      "These submissions use incompatible assessment versions and cannot be combined.";
    elements.aggregateDomains.replaceChildren();
    elements.constraintQuestions.replaceChildren();
    return;
  }

  elements.resultsMessage.textContent =
    `${participantCount} private perspectives submitted. The privacy threshold is met.`;
  elements.aggregateIndex.textContent = String(result.overallIndex);
  elements.aggregateDomains.replaceChildren();
  for (const [domain, score] of Object.entries(result.domainScores)) {
    const card = document.createElement("article");
    const heading = document.createElement("div");
    const label = document.createElement("strong");
    const value = document.createElement("span");
    const track = document.createElement("div");
    const fill = document.createElement("span");
    const pattern = document.createElement("p");
    label.textContent = domainLabels[domain] || domain;
    value.textContent = String(score.mean);
    heading.append(label, value);
    track.className = "aggregate-domain-track";
    fill.style.width = `${score.mean}%`;
    track.append(fill);
    pattern.textContent = `Perspectives: ${score.perspectivePattern.replaceAll("-", " ")}`;
    card.append(heading, track, pattern);
    elements.aggregateDomains.append(card);
  }
  const constraints = result.primaryConstraintIds
    .map(domain => domainLabels[domain] || domain)
    .join(", ");
  const primaryConstraint = result.primaryConstraintIds[0];
  const interpretation = constraintContent[primaryConstraint];
  elements.aggregateConstraint.textContent = constraints;
  elements.constraintHypothesis.textContent = interpretation.hypothesis;
  elements.constraintQuestions.replaceChildren();
  for (const question of interpretation.questions) {
    const item = document.createElement("li");
    item.textContent = question;
    elements.constraintQuestions.append(item);
  }
  elements.actionConstraint.replaceChildren();
  for (const domain of result.primaryConstraintIds) {
    const option = document.createElement("option");
    option.value = domain;
    option.textContent = domainLabels[domain] || domain;
    elements.actionConstraint.append(option);
  }
  elements.actionCycleForm.elements.reviewDate.min = localDateValue();
}

function renderActionCycles(actionCycles) {
  elements.actionCycleList.replaceChildren();
  elements.actionCycleEmpty.hidden = actionCycles.length > 0;
  for (const cycle of actionCycles) {
    const card = document.createElement("article");
    card.className = "workspace-action-card";
    const heading = document.createElement("div");
    const title = document.createElement("h6");
    const status = document.createElement("span");
    title.textContent = domainLabels[cycle.constraintDomainId] || cycle.constraintDomainId;
    const today = localDateValue();
    const lifecycle = ["completed", "stopped"].includes(cycle.status)
      ? cycle.status
      : cycle.reviewDate < today
        ? "review overdue"
        : cycle.reviewDate === today
          ? "review due"
          : cycle.status;
    status.textContent = lifecycle;
    heading.append(title, status);
    const hypothesis = document.createElement("p");
    hypothesis.textContent = cycle.hypothesis;
    const details = document.createElement("dl");
    const values = [
      ["Commitment", cycle.commitment],
      ["Responsible owner", cycle.responsibleOwner],
      ["Evidence", `${evidenceLabels[cycle.evidenceMeasureId]} — ${cycle.evidenceDescription}`],
      ["Review date", formattedDate(`${cycle.reviewDate}T12:00:00Z`)]
    ];
    for (const [label, value] of values) {
      const row = document.createElement("div");
      const term = document.createElement("dt");
      const description = document.createElement("dd");
      term.textContent = label;
      description.textContent = value;
      row.append(term, description);
      details.append(row);
    }
    const reviewNote = cycle.reviewNote ? document.createElement("p") : null;
    if (reviewNote) {
      reviewNote.className = "workspace-action-review-note";
      reviewNote.textContent = `Latest review: ${cycle.reviewNote}`;
    }
    const reviewForm = document.createElement("form");
    reviewForm.className = "workspace-action-review";
    reviewForm.dataset.actionReview = cycle.actionCycleId;
    const statusLabel = document.createElement("label");
    const statusText = document.createElement("span");
    const statusSelect = document.createElement("select");
    statusSelect.name = "status";
    statusText.textContent = "Cycle status";
    for (const [value, label] of [
      ["active", "Active"],
      ["completed", "Completed"],
      ["stopped", "Stopped"]
    ]) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      option.selected = cycle.status === value;
      statusSelect.append(option);
    }
    statusLabel.append(statusText, statusSelect);
    const noteLabel = document.createElement("label");
    noteLabel.className = "action-review-note";
    const noteText = document.createElement("span");
    const note = document.createElement("textarea");
    note.name = "reviewNote";
    note.maxLength = 500;
    note.rows = 2;
    note.required = true;
    note.placeholder = "What did the team observe? Record context, not proof of causality.";
    noteText.textContent = "Review observation";
    noteLabel.append(noteText, note);
    const submit = document.createElement("button");
    submit.className = "secondary-button";
    submit.type = "submit";
    submit.textContent = "Save review";
    reviewForm.append(statusLabel, noteLabel, submit);
    card.append(heading, hypothesis, details);
    if (reviewNote) card.append(reviewNote);
    card.append(reviewForm);
    elements.actionCycleList.append(card);
  }
  elements.actionCycleForm.hidden = actionCycles.some(
    cycle => ["planned", "active"].includes(cycle.status)
  );
  const currentRound = collectionRounds.find(round => round.id === selectedRoundId);
  elements.closeRound.hidden = !(
    currentRound?.status === "open"
    && actionCycles.some(cycle => ["completed", "stopped"].includes(cycle.status))
    && !actionCycles.some(cycle => ["planned", "active"].includes(cycle.status))
  );
}

async function loadActionCycles(roundId) {
  const data = await workspaceRequest(
    `/api/workspace/action-cycles?roundId=${encodeURIComponent(roundId)}`
  );
  renderActionCycles(data.actionCycles);
}

function renderComparison(data) {
  const comparison = data.comparison;
  elements.workspaceComparison.hidden = false;
  elements.comparisonDomains.replaceChildren();
  if (comparison.policy === "unavailable") {
    elements.comparisonBaselineIndex.textContent = "—";
    elements.comparisonFollowUpIndex.textContent = "—";
    elements.comparisonMessage.textContent =
      "Both linked collection rounds must meet the privacy threshold before change is shown.";
    return;
  }
  elements.comparisonBaselineIndex.textContent = String(comparison.baselineOverallIndex);
  elements.comparisonFollowUpIndex.textContent = String(comparison.followUpOverallIndex);
  if (comparison.policy === "side-by-side-only") {
    elements.comparisonMessage.textContent = comparison.reason;
    return;
  }
  const overallDirection = comparison.overallDelta > 0 ? "+" : "";
  elements.comparisonMessage.textContent =
    `${data.baselineRound.label} to ${data.followUpRound.label}: ` +
    `${overallDirection}${comparison.overallDelta} overall. ` +
    comparison.interpretation;
  for (const [domain, value] of Object.entries(comparison.domainDeltas)) {
    const card = document.createElement("article");
    const label = document.createElement("strong");
    const scores = document.createElement("span");
    const delta = document.createElement("em");
    label.textContent = domainLabels[domain] || domain;
    scores.textContent = `${value.baseline} → ${value.followUp}`;
    delta.textContent = `${value.delta > 0 ? "+" : ""}${value.delta}`;
    card.append(label, scores, delta);
    elements.comparisonDomains.append(card);
  }
}

async function loadComparison(roundId) {
  const data = await workspaceRequest(
    `/api/workspace/comparison?roundId=${encodeURIComponent(roundId)}`
  );
  renderComparison(data);
}

async function loadInvitations(roundId) {
  const round = collectionRounds.find(value => value.id === roundId && value.status === "open");
  if (!round) return;
  selectedRoundId = roundId;
  elements.invitationPanel.hidden = false;
  elements.invitationRound.textContent = `${round.label} · ${formattedDate(round.opensAt)}–${formattedDate(round.closesAt)}`;
  const [invitations, results] = await Promise.all([
    workspaceRequest(`/api/workspace/invitations?roundId=${encodeURIComponent(roundId)}`),
    workspaceRequest(`/api/workspace/results?roundId=${encodeURIComponent(roundId)}`)
  ]);
  renderInvitations(invitations);
  renderWorkspaceResults(results);
  if (results.result.policy === "aggregate") await loadActionCycles(roundId);
  else renderActionCycles([]);
  if (round.priorRoundId) await loadComparison(roundId);
  else elements.workspaceComparison.hidden = true;
}

async function prepareOwnerCollection() {
  elements.diagnosticPanel.hidden = false;
  const diagnostics = await loadDiagnostics();
  if (diagnostics.length) {
    currentOwnerDiagnostic = diagnostics[0];
    elements.collectionPanel.hidden = true;
    elements.focusTitle.textContent = new Set(["draft", "discovery"]).has(currentOwnerDiagnostic.state)
      ? "Frame the decision this diagnostic must inform."
      : "Continue the Organizational Capacity Diagnostic.";
    elements.focusDescription.textContent = "Begin with the six-question sponsor context, then design the internal perspectives needed to see how the organization actually works.";
    elements.primaryAction.textContent = new Set(["draft", "discovery"]).has(currentOwnerDiagnostic.state)
      ? "Begin diagnostic discovery"
      : "Continue diagnostic";
    elements.diagnosticPanel.hidden = true;
    return;
  }
  currentOwnerDiagnostic = null;
  elements.collectionPanel.hidden = false;
  const today = localDateValue();
  const opensInput = elements.collectionForm.elements.opensAt;
  const closesInput = elements.collectionForm.elements.closesAt;
  opensInput.min = today;
  closesInput.min = opensInput.value || today;
  const rounds = await loadCollectionRounds();
  if (rounds.length > 0) {
    const openRound = rounds.find(round => round.status === "open");
    if (openRound) {
      elements.focusTitle.textContent = "Invite perspectives into the open collection.";
      elements.focusDescription.textContent = "Invitation status is visible, while assessment completion and individual responses remain separated from identity.";
      elements.primaryAction.textContent = "Manage participant invitations";
      await loadInvitations(selectedRoundId || openRound.id);
    } else {
      const draftRound = rounds.find(round => round.status === "draft");
      elements.focusTitle.textContent = draftRound
        ? "Review the current collection draft."
        : "Prepare the next Organizational Capacity observation.";
      elements.focusDescription.textContent = draftRound
        ? "Confirm the name and dates, then open the round to enable participant invitations."
        : "A linked follow-up preserves the baseline method and enables a privacy-protected comparison.";
      elements.primaryAction.textContent = draftRound
        ? "Review collection setup"
        : "Create a follow-up collection";
      elements.invitationPanel.hidden = true;
    }
  }
}

async function prepareParticipant() {
  const diagnosticParticipation = await workspaceRequest("/api/workspace/diagnostic-participation");
  if (diagnosticParticipation.state !== "unavailable") {
    currentParticipation = { ...diagnosticParticipation, kind: "diagnostic" };
    elements.participantPanel.hidden = false;
    elements.primaryAction.disabled = false;
    elements.focusTitle.textContent = "Complete your confidential diagnostic interview.";
    elements.focusDescription.textContent = "Your identity confirms the intended perspective slot. Your interview content remains separated from workspace identity records.";
    elements.primaryAction.textContent = diagnosticParticipation.noticeAccepted
      ? "Interview workspace coming next"
      : "Review diagnostic privacy";
    elements.participantRound.textContent = "Organizational Capacity Diagnostic";
    elements.participantDates.textContent = `${diagnosticParticipation.route === "automated" ? "Automated written" : "Advisor-led"} route · Common protocol ${diagnosticParticipation.protocol?.version || "1.0"}`;
    elements.assessmentNotice.hidden=true;
    elements.diagnosticOrientation.hidden=false;
    elements.diagnosticTerms.hidden=false;
    elements.diagnosticTermsLink.hidden=false;
    elements.participantNotice.querySelector("label span").textContent = "I have reviewed the Capacity Lens orientation and agree to the diagnostic participation and confidentiality terms.";
    elements.participantNotice.hidden = diagnosticParticipation.noticeAccepted;
    elements.participantAcknowledgement.checked = diagnosticParticipation.noticeAccepted;
    elements.beginAssessment.textContent = diagnosticParticipation.noticeAccepted
      ? "Guided interview coming next"
      : "Accept notice and continue";
    elements.beginAssessment.disabled = diagnosticParticipation.noticeAccepted;
    elements.participantMessage.textContent = diagnosticParticipation.noticeAccepted
      ? "Diagnostic privacy accepted. The protected interview response workspace is the next development gate."
      : "Accept the diagnostic privacy notice before interview access is prepared.";
    if (diagnosticParticipation.noticeAccepted) await loadParticipantInterview(diagnosticParticipation.diagnosticId);
    return;
  }
  currentParticipation = { ...(await workspaceRequest("/api/workspace/participation")), kind: "assessment" };
  elements.assessmentNotice.hidden=false;
  elements.diagnosticOrientation.hidden=true;
  elements.diagnosticTerms.hidden=true;
  elements.diagnosticTermsLink.hidden=true;
  elements.participantPanel.hidden = false;
  elements.primaryAction.disabled = false;
  if (currentParticipation.state === "unavailable") {
    elements.participantRound.textContent = "No collection is currently available.";
    elements.participantDates.textContent = "The workspace Owner will notify you when a collection round opens.";
    elements.participantNotice.hidden = true;
    elements.beginAssessment.disabled = true;
    return;
  }

  const { round } = currentParticipation;
  elements.participantRound.textContent = round.label;
  elements.participantDates.textContent = `${formattedDate(round.opensAt)}–${formattedDate(round.closesAt)} · shared results require ${round.minimumParticipants} valid submissions`;
  if (currentParticipation.submitted) {
    elements.participantNotice.hidden = true;
    elements.beginAssessment.disabled = true;
    elements.beginAssessment.textContent = "Perspective submitted";
    elements.participantMessage.textContent = "Your private contribution is complete. Its identity cannot be connected to the organizational result.";
    elements.primaryAction.textContent = "Perspective submitted";
    return;
  }
  if (currentParticipation.state === "scheduled") {
    elements.participantNotice.hidden = true;
    elements.beginAssessment.disabled = true;
    elements.participantMessage.textContent = `This collection opens ${formattedDate(round.opensAt)}.`;
    return;
  }
  if (currentParticipation.state === "ended") {
    elements.participantNotice.hidden = true;
    elements.beginAssessment.disabled = true;
    elements.participantMessage.textContent = "This collection period has ended.";
    return;
  }

  elements.participantNotice.hidden = currentParticipation.noticeAccepted;
  elements.participantAcknowledgement.checked = currentParticipation.noticeAccepted;
  elements.beginAssessment.disabled = !currentParticipation.noticeAccepted;
  elements.beginAssessment.textContent = "Begin private assessment";
  elements.participantMessage.textContent = currentParticipation.noticeAccepted
    ? "Privacy notice accepted. You may begin when ready."
    : "Acknowledge the workspace privacy notice to continue.";
}

async function loadParticipantInterview(diagnosticId) {
  const localAnswers=new Map([...elements.participantInterviewQuestions.querySelectorAll("textarea")].map(input=>[input.name,input.value]));
  const interviewEndpoint=currentParticipation.interviewVersion==="2.0.0"?"/api/workspace/diagnostic-interview-v2":"/api/workspace/diagnostic-interview";
  const interview=await workspaceRequest(`${interviewEndpoint}?diagnosticId=${encodeURIComponent(diagnosticId)}`);
  const answers=new Map(interview.answers.map(answer=>[answer.questionId,answer.answerText]));
  const followUpAnswers=new Map((interview.followUpAnswers||[]).map(answer=>[answer.followUpId,answer.answerText]));
  elements.participantInterviewQuestions.replaceChildren();
  for(const question of interview.questions){const label=document.createElement("label");const number=document.createElement("span");number.textContent=String(question.position).padStart(2,"0");const body=document.createElement("div");const prompt=document.createElement("p");prompt.textContent=question.questionText;const answer=document.createElement("textarea");answer.name=question.questionId;answer.dataset.coreAnswer="";answer.maxLength=6000;answer.required=true;answer.value=localAnswers.has(question.questionId)?localAnswers.get(question.questionId):(answers.get(question.questionId)||"");body.append(prompt,answer);label.append(number,body);elements.participantInterviewQuestions.append(label);}
  for(const followUp of interview.followUps||[]){const label=document.createElement("label");label.className="participant-follow-up";const marker=document.createElement("span");marker.textContent="CLARIFY";const body=document.createElement("div");const context=document.createElement("small");const question=interview.questions.find(item=>item.questionId===followUp.questionId);context.textContent=`Follow-up to question ${question?.position||followUp.questionId}`;const prompt=document.createElement("p");prompt.textContent=followUp.promptText;const answer=document.createElement("textarea");answer.name=followUp.followUpId;answer.dataset.followUpAnswer="";answer.maxLength=4000;answer.minLength=40;answer.required=true;answer.value=localAnswers.has(followUp.followUpId)?localAnswers.get(followUp.followUpId):(followUpAnswers.get(followUp.followUpId)||"");body.append(context,prompt,answer);label.append(marker,body);elements.participantInterviewQuestions.append(label);}
  elements.participantInterview.hidden=interview.status!=="in-progress";
  elements.beginAssessment.hidden=true;
  if(interview.status==="submitted")renderDiagnosticInterviewComplete();
  else elements.interviewMessage.textContent=(interview.followUps||[]).length?"Complete the bounded clarifications below, then submit once more. Your draft remains encrypted.":"Your draft is encrypted before it is stored.";
}

function renderDiagnosticInterviewComplete(){
  elements.focusTitle.textContent="Your confidential diagnostic interview is complete.";
  elements.focusDescription.textContent="Your responses were received and securely recorded. They remain separated from your workspace identity.";
  elements.primaryAction.textContent="Responses received";
  elements.primaryAction.disabled=true;
  elements.participantNotice.hidden=true;
  elements.beginAssessment.hidden=false;
  elements.beginAssessment.textContent="Diagnostic responses submitted";
  elements.beginAssessment.disabled=true;
  elements.participantInterview.hidden=true;
  elements.participantMessage.textContent="Submission confirmed. No further action is required right now. Senger Advisory will synthesize de-identified evidence across the approved participant group and will contact the organization if anything further is needed.";
  elements.participantMessage.dataset.tone="success";
  elements.interviewMessage.textContent="Your confidential diagnostic interview has been submitted.";
  elements.participantPocFeedback.hidden=false;
}

function interviewPayload(){const payload={diagnosticId:currentParticipation.diagnosticId,answers:[...elements.participantInterviewQuestions.querySelectorAll("[data-core-answer]")].filter(input=>input.value.trim()).map(input=>({questionId:input.name,answerText:input.value}))};if(currentParticipation.interviewVersion==="2.0.0")payload.followUpAnswers=[...elements.participantInterviewQuestions.querySelectorAll("[data-follow-up-answer]")].filter(input=>input.value.trim()).map(input=>({followUpId:input.name,answerText:input.value}));return payload;}

function saveInterviewDraft(){
  clearTimeout(interviewAutosaveTimer);
  const payload=interviewPayload();
  const interviewEndpoint=currentParticipation.interviewVersion==="2.0.0"?"/api/workspace/diagnostic-interview-v2":"/api/workspace/diagnostic-interview";
  interviewSavePromise=interviewSavePromise.then(async()=>{elements.interviewMessage.textContent="Saving encrypted draft…";await workspaceRequest(interviewEndpoint,{method:"PATCH",body:payload});interviewDirty=false;elements.interviewMessage.textContent="Private draft saved.";}).catch(error=>{elements.interviewMessage.textContent=error.message;elements.interviewMessage.dataset.tone="error";});
  return interviewSavePromise;
}

async function sessionState() {
  const token = await clerk?.session?.getToken({
    organizationId: clerk?.organization?.id,
    skipCache: true
  });
  const response = await fetch("/api/workspace/session", {
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  if (response.status === 401 || response.status === 403) {
    const payload = await response.json().catch(() => ({}));
    return { denied: true, reason: payload.reason || "access-policy" };
  }
  if (!response.ok) throw new Error("The workspace service is temporarily unavailable.");
  return response.json();
}

function showWorkspaceAccessIssue(reason) {
  const title = elements.membershipState.querySelector("h2");
  const detail = elements.membershipState.querySelector("p:last-of-type");
  const messages = {
    "sign-in": ["We couldn’t verify this sign-in.", "Sign out, sign back in, and try the workspace again."],
    "organization-context": ["Your organization is not active yet.", "Select or activate the organization associated with this workspace, then check again."],
    "organization-role": ["Your organization role is not assigned for this workspace.", "Ask the Senger Advisory platform administrator to confirm your workspace role."],
    "workspace-mapping": ["This organization has not been connected to a workspace.", "Ask the Senger Advisory platform administrator to complete workspace provisioning."]
  };
  const message = messages[reason] || ["Workspace access is not ready yet.", "Ask the Senger Advisory platform administrator to verify your access."];
  title.textContent = message[0];
  detail.textContent = `${message[1]}${reason.startsWith("clerk-") ? ` Access reference: ${reason}.` : ""}`;
}

async function ensureActiveOrganization() {
  if (clerk.organization) return true;
  let memberships = clerk.user?.organizationMemberships || [];
  let totalCount = memberships.length;
  if (typeof clerk.user?.getOrganizationMemberships === "function") {
    const response = await clerk.user.getOrganizationMemberships({ pageSize: 2 });
    memberships = response?.data || [];
    totalCount = response?.totalCount ?? memberships.length;
  }
  let organization = totalCount === 1 && memberships.length === 1
    ? memberships[0].organization.id
    : null;
  if (!organization) {
    const token = await clerk?.session?.getToken();
    const response = await fetch("/api/workspace/organization-bootstrap", {
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    if (!response.ok) return false;
    organization = (await response.json()).organization;
  }
  await clerk.setActive({ organization });
  clerk.session?.clearCache();
  return true;
}

function workspaceReturnUrl() {
  return new URL("/workspace/", window.location.origin).href;
}

async function render() {
  if (!clerk.user) {
    elements.account.hidden = true;
    showState("signInState");
    if (!signInMounted) {
      const returnUrl = workspaceReturnUrl();
      clerk.mountSignIn(elements.signInMount, {
        routing: "hash",
        forceRedirectUrl: returnUrl,
        fallbackRedirectUrl: returnUrl,
        signUpForceRedirectUrl: returnUrl,
        signUpFallbackRedirectUrl: returnUrl,
        appearance: {
          variables: {
            colorPrimary: "#d45b31",
            colorText: "#161c25",
            colorBackground: "#fffdf8",
            borderRadius: "14px",
            fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
          }
        }
      });
      signInMounted = true;
    }
    return;
  }

  if (signInMounted) {
    clerk.unmountSignIn(elements.signInMount);
    signInMounted = false;
  }

  elements.accountLabel.textContent = clerk.user.primaryEmailAddress?.emailAddress || "Signed in";
  elements.account.hidden = false;

  if (!(await ensureActiveOrganization())) {
    showState("membershipState");
    return;
  }

  const session = await sessionState();
  if (session.denied) {
    showWorkspaceAccessIssue(session.reason);
    showState("membershipState");
    return;
  }

  const content = roleContent(session.role);
  currentRole = session.role;
  elements.roleLabel.textContent = content.label;
  elements.organizationName.textContent = clerk.organization.name;
  elements.focusTitle.textContent = content.title;
  elements.focusDescription.textContent = content.description;
  elements.primaryAction.textContent = content.action;
  elements.primaryAction.disabled = session.role !== "org:admin";
  elements.sponsorGuide.hidden = session.role !== "org:admin";
  elements.collectionPanel.hidden = true;
  elements.diagnosticPanel.hidden = true;
  elements.participantPanel.hidden = true;
  if (session.role === "org:admin") await prepareOwnerCollection();
  if (session.role === "org:member") await prepareParticipant();
  showState("readyState");
}

function currentClerkContextKey() {
  return `${clerk?.user?.id || "signed-out"}:${clerk?.organization?.id || "no-organization"}`;
}

function refreshWorkspace() {
  if (workspaceRenderPromise) return workspaceRenderPromise;
  workspaceRenderPromise = render().finally(() => {
    workspaceRenderPromise = null;
    clerkContextKey = currentClerkContextKey();
  });
  return workspaceRenderPromise;
}

async function initialize() {
  showState("loading");
  try {
    if (!clerk) {
      const config = await fetchConfig();
      await loadExternalScript(config.clerkUiUrl);
      await loadExternalScript(config.clerkJsUrl, config.publishableKey);
      clerk = window.Clerk;
      if (!clerk) throw new Error("Secure sign-in did not initialize.");
      if (!window.__internal_ClerkUICtor) throw new Error("Secure sign-in UI did not initialize.");
      await clerk.load({
        ui: { ClerkUI: window.__internal_ClerkUICtor }
      });
      clerkContextKey = currentClerkContextKey();
      clerk.addListener(() => {
        if (currentParticipation?.kind === "diagnostic" && !elements.participantInterview.hidden) return;
        if (currentClerkContextKey() === clerkContextKey) return;
        refreshWorkspace().catch(() => showError("The workspace could not refresh your session."));
      });
    }
    await refreshWorkspace();
  } catch (error) {
    showError(error instanceof Error ? error.message : "The workspace could not be prepared.");
  }
}

elements.retry.addEventListener("click", () => initialize());
elements.pocSupportForm.addEventListener("submit",async event=>{event.preventDefault();if(!elements.pocSupportForm.reportValidity())return;const button=elements.pocSupportForm.querySelector("button[type=submit]"),caseReference=`POC-${crypto.randomUUID().slice(0,8).toUpperCase()}`;elements.supportCaseReference.value=caseReference;button.disabled=true;elements.pocSupportMessage.textContent="Sending your support request…";try{const response=await fetch("/",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams(new FormData(elements.pocSupportForm)).toString()});if(!response.ok)throw new Error();elements.pocSupportForm.reset();elements.pocSupportMessage.textContent=`Support request received. Keep this reference: ${caseReference}.`; }catch{elements.pocSupportMessage.textContent="We could not send the request. Please retry, or use the Connect page on sengeradvisory.com.";}finally{button.disabled=false;}});
elements.refresh.addEventListener("click", () => refreshWorkspace().catch(() => showError("The workspace could not refresh your session.")));
elements.signOut.addEventListener("click", () => clerk?.signOut({ redirectUrl: workspaceReturnUrl() }));
elements.primaryAction.addEventListener("click", () => {
  if (currentRole === "org:member") {
    elements.participantPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    if (!elements.participantNotice.hidden) {
      elements.participantAcknowledgement.focus({ preventScroll: true });
    }
    return;
  }
  if (currentRole !== "org:admin") return;
  if (currentOwnerDiagnostic) {
    elements.diagnosticList.querySelector(`[data-diagnostic-id="${currentOwnerDiagnostic.id}"]`)?.click();
    return;
  }
  if (!elements.invitationPanel.hidden) {
    elements.invitationPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    elements.invitationForm.elements.emailAddress.focus({ preventScroll: true });
    return;
  }
  elements.collectionPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  elements.collectionForm.elements.label.focus({ preventScroll: true });
});
elements.goToCurrentStep.addEventListener("click", () => elements.primaryAction.click());
elements.journeyHome.addEventListener("click", showSponsorHome);
window.addEventListener("popstate", () => {
  if (currentRole === "org:admin" && !signInMounted && !location.hash.startsWith("#diagnostic/")) {
    showSponsorHome();
  }
});
async function beginDiagnosticCheckout(diagnosticId,entitlementKind="diagnostic"){elements.diagnosticMessage.textContent="Preparing secure payment checkout…";elements.diagnosticMessage.dataset.tone="";const data=await workspaceRequest("/api/workspace/commerce-checkout",{method:"POST",body:{diagnosticId,entitlementKind}});if(!data.checkout?.checkoutUrl)throw new Error("Secure checkout did not return a destination.");window.location.assign(data.checkout.checkoutUrl);}
elements.diagnosticList.addEventListener("click", event => {
  const button = event.target.closest("[data-diagnostic-id]");
  if (!button || button.disabled) return;
  const stage = button.dataset.diagnosticStage;
  const journeyStage = new Set(["draft", "discovery"]).has(stage) ? "discovery"
    : stage === "participant-design" ? "perspectives"
    : stage === "protocol-review" ? "protocol"
    : stage === "collecting" ? "collection"
    : "finding";
  showSponsorJourney(journeyStage, button.dataset.diagnosticId);
  const operation = button.textContent === "Complete payment"
    ? beginDiagnosticCheckout(button.dataset.diagnosticId)
    : new Set(["draft", "discovery"]).has(stage)
    ? openDiagnosticContext(button.dataset.diagnosticId)
    : stage === "participant-design"
      ? openParticipantDesign(button.dataset.diagnosticId)
      : new Set(["synthesis", "leadership-validation"]).has(stage)
        ? openLeadershipValidation(button.dataset.diagnosticId)
        : stage === "intervention-proposed"
          ? openInterventionAcceptance(button.dataset.diagnosticId)
          : new Set(["intervention-accepted","active-intervention","reassessment"]).has(stage)
            ? openCapacityBrief(button.dataset.diagnosticId)
            : openProtocolReview(button.dataset.diagnosticId);
  operation.catch(error => {
    const isCheckout=button.textContent==="Complete payment";
    const message = isCheckout
      ? elements.diagnosticMessage
      : new Set(["intervention-accepted","active-intervention","reassessment"]).has(stage)
      ? elements.capacityBriefMessage
      : stage === "intervention-proposed"
      ? elements.interventionAcceptanceMessage
      : new Set(["synthesis", "leadership-validation"]).has(stage)
      ? elements.leadershipValidationMessage
      : stage === "participant-design"
      ? elements.participantDesignMessage
      : new Set(["draft", "discovery"]).has(stage)
        ? elements.diagnosticContextMessage
        : elements.protocolMessage;
    const surface = isCheckout
      ? elements.diagnosticPanel
      : new Set(["intervention-accepted","active-intervention"]).has(stage)
      ? elements.capacityBrief
      : stage === "intervention-proposed"
      ? elements.interventionAcceptance
      : new Set(["synthesis", "leadership-validation"]).has(stage)
      ? elements.leadershipValidation
      : stage === "participant-design"
      ? elements.participantDesign
      : new Set(["draft", "discovery"]).has(stage)
        ? elements.diagnosticContext
        : elements.protocolReview;
    surface.hidden = false;
    message.textContent = error.message;
    message.dataset.tone = "error";
  });
});
elements.closeLeadershipValidation.addEventListener("click", () => {
  selectedDiagnosticId = null;
  showSponsorHome();
});
elements.downloadExecutiveBrief.addEventListener("click",async()=>{const diagnosticId=elements.downloadExecutiveBrief.dataset.diagnosticId;if(!diagnosticId)return;elements.downloadExecutiveBrief.disabled=true;try{const token=await clerk?.session?.getToken({organizationId:clerk?.organization?.id});const response=await fetch(`/api/workspace/diagnostic-executive-brief?diagnosticId=${encodeURIComponent(diagnosticId)}&download=1`,{credentials:"same-origin",headers:{...(token?{Authorization:`Bearer ${token}`}:{})}});if(!response.ok){const payload=await response.json().catch(()=>({}));throw new Error(payload.error||"The Brief could not be downloaded.");}const blob=await response.blob(),url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download="executive-capacity-brief.html";document.body.append(link);link.click();link.remove();URL.revokeObjectURL(url);}catch(error){elements.leadershipValidationMessage.textContent=error.message;}finally{elements.downloadExecutiveBrief.disabled=false;}});
elements.closeInterventionAcceptance.addEventListener("click",()=>{selectedDiagnosticId=null;showSponsorHome();});
elements.closeCapacityBrief.addEventListener("click",()=>{selectedDiagnosticId=null;showSponsorHome();});
elements.activateCapacityBrief.addEventListener("click",async()=>{if(!selectedDiagnosticId)return;elements.activateCapacityBrief.disabled=true;elements.capacityBriefMessage.textContent="Verifying the accepted intervention and activating the Brief…";try{const data=await workspaceRequest("/api/workspace/capacity-operating-brief",{method:"POST",body:{diagnosticId:selectedDiagnosticId}});renderCapacityBrief(data.brief);elements.activateCapacityBrief.hidden=true;await loadCapacityActions();await loadCapacityCheckIns();await loadCapacityLearning();await loadCapacityEvidence();await loadCapacityReviews();elements.capacityBriefMessage.textContent=`Brief ${data.brief.briefVersion} active · Next review ${data.brief.nextReview.cadence}`;await loadDiagnostics();}catch(error){elements.capacityBriefMessage.textContent=error.message;elements.activateCapacityBrief.disabled=false;}});
elements.capacityActionForm.addEventListener("submit",async event=>{event.preventDefault();if(!selectedDiagnosticId||!elements.capacityActionForm.reportValidity())return;const values=Object.fromEntries(new FormData(elements.capacityActionForm)),button=elements.capacityActionForm.querySelector("button");button.disabled=true;elements.capacityActionMessage.textContent="Adding the operating commitment…";try{await workspaceRequest("/api/workspace/capacity-brief-action-path",{method:"POST",body:{diagnosticId:selectedDiagnosticId,phaseDays:Number(values.phaseDays),commitment:values.commitment,accountableRole:values.accountableRole,decisionGate:values.decisionGate,evidencePrompt:values.evidencePrompt,dueAt:new Date(values.dueAt).toISOString()}});elements.capacityActionForm.reset();await loadCapacityActions();}catch(error){elements.capacityActionMessage.textContent=error.message;}finally{button.disabled=false;}});
elements.generateGuidedPlan.addEventListener("click",async()=>{if(!selectedDiagnosticId)return;elements.generateGuidedPlan.disabled=true;elements.guidedPlanMessage.textContent="Generating the reviewable operating draft…";try{const data=await workspaceRequest("/api/workspace/capacity-brief-guided-plan",{method:"POST",body:{diagnosticId:selectedDiagnosticId}});elements.guidedPlanMessage.textContent=`Generated ${data.plan.actionItems} action commitments, ${data.plan.learningItems} learning items, and ${data.plan.checkIns} guided check-ins.`;await loadCapacityActions();await loadCapacityLearning();await loadCapacityCheckIns();}catch(error){elements.guidedPlanMessage.textContent=error.message;elements.generateGuidedPlan.disabled=false;}});
elements.sponsorPocFeedbackForm.addEventListener("submit",async event=>{event.preventDefault();if(!selectedDiagnosticId||!elements.sponsorPocFeedbackForm.reportValidity())return;const values=Object.fromEntries(new FormData(elements.sponsorPocFeedbackForm)),button=elements.sponsorPocFeedbackForm.querySelector("button");button.disabled=true;try{await workspaceRequest("/api/workspace/poc-feedback",{method:"POST",body:{diagnosticId:selectedDiagnosticId,checkpoint:values.checkpoint,clarityRating:values.clarityRating||null,trustRating:null,actionabilityRating:values.actionabilityRating||null,supportRequired:Boolean(values.supportRequired),purchaseIntent:values.purchaseIntent,feedback:values.feedback||null}});elements.sponsorPocFeedbackForm.reset();elements.sponsorPocFeedbackMessage.textContent="POC checkpoint feedback recorded outside the diagnostic evidence record.";}catch(error){elements.sponsorPocFeedbackMessage.textContent=error.message;}finally{button.disabled=false;}});
elements.capacityActionList.addEventListener("submit",async event=>{const form=event.target.closest("[data-action-resolution]");if(!form)return;event.preventDefault();if(!form.reportValidity())return;const submitter=event.submitter;if(!submitter)return;submitter.disabled=true;try{await workspaceRequest("/api/workspace/capacity-brief-action-path",{method:"PATCH",body:{itemId:form.dataset.actionResolution,status:submitter.value,resolutionNote:form.elements.resolutionNote.value}});await loadCapacityActions();}catch(error){elements.capacityActionMessage.textContent=error.message;submitter.disabled=false;}});
elements.capacityCheckInForm.addEventListener("submit",async event=>{event.preventDefault();if(!selectedDiagnosticId||!elements.capacityCheckInForm.reportValidity())return;const values=Object.fromEntries(new FormData(elements.capacityCheckInForm)),button=elements.capacityCheckInForm.querySelector("button");button.disabled=true;try{await workspaceRequest("/api/workspace/capacity-brief-check-ins",{method:"POST",body:{diagnosticId:selectedDiagnosticId,prompt:values.prompt,dueAt:new Date(values.dueAt).toISOString()}});elements.capacityCheckInForm.reset();await loadCapacityCheckIns();}catch(error){elements.capacityCheckInMessage.textContent=error.message;}finally{button.disabled=false;}});
elements.capacityCheckInList.addEventListener("submit",async event=>{const form=event.target.closest("[data-check-in-resolution]");if(!form)return;event.preventDefault();if(!form.reportValidity())return;const submitter=event.submitter;if(!submitter)return;submitter.disabled=true;const note=form.elements.note.value;try{await workspaceRequest("/api/workspace/capacity-brief-check-ins",{method:"PATCH",body:{checkInId:form.dataset.checkInResolution,status:submitter.value,response:submitter.value==="responded"?note:null,attentionReason:submitter.value==="escalated"?note:null}});await loadCapacityCheckIns();}catch(error){elements.capacityCheckInMessage.textContent=error.message;submitter.disabled=false;}});
elements.advisorEscalationForm.addEventListener("submit",async event=>{event.preventDefault();if(!selectedDiagnosticId||!elements.advisorEscalationForm.reportValidity())return;const values=Object.fromEntries(new FormData(elements.advisorEscalationForm)),button=elements.advisorEscalationForm.querySelector("button");button.disabled=true;elements.advisorEscalationMessage.textContent="Recording the advisor-support request…";try{await workspaceRequest("/api/workspace/intervention-advisor-escalation",{method:"POST",body:{diagnosticId:selectedDiagnosticId,supportType:values.supportType,urgency:values.urgency,context:values.context,desiredOutcome:values.desiredOutcome}});elements.advisorEscalationForm.reset();await loadAdvisorEscalations();await loadDecisionHistory();}catch(error){elements.advisorEscalationMessage.textContent=error.message;}finally{button.disabled=false;}});
elements.capacityLearningForm.addEventListener("submit",async event=>{event.preventDefault();if(!selectedDiagnosticId||!elements.capacityLearningForm.reportValidity())return;const values=Object.fromEntries(new FormData(elements.capacityLearningForm)),button=elements.capacityLearningForm.querySelector("button");button.disabled=true;elements.capacityLearningMessage.textContent="Adding focused learning to the intervention…";try{await workspaceRequest("/api/workspace/capacity-brief-learning",{method:"POST",body:{diagnosticId:selectedDiagnosticId,title:values.title,purpose:values.purpose,accountableRole:values.accountableRole,dueAt:new Date(values.dueAt).toISOString(),applicationPrompt:values.applicationPrompt}});elements.capacityLearningForm.reset();await loadCapacityLearning();}catch(error){elements.capacityLearningMessage.textContent=error.message;}finally{button.disabled=false;}});
elements.capacityLearningList.addEventListener("submit",async event=>{const form=event.target.closest("[data-learning-completion]");if(!form)return;event.preventDefault();if(!form.reportValidity())return;const button=form.querySelector("button");button.disabled=true;try{await workspaceRequest("/api/workspace/capacity-brief-learning",{method:"PATCH",body:{itemId:form.dataset.learningCompletion,status:"completed",applicationNote:form.elements.applicationNote.value}});await loadCapacityLearning();}catch(error){elements.capacityLearningMessage.textContent=error.message;button.disabled=false;}});
elements.capacityEvidenceForm.addEventListener("submit",async event=>{event.preventDefault();if(!selectedDiagnosticId||!elements.capacityEvidenceForm.reportValidity())return;const values=Object.fromEntries(new FormData(elements.capacityEvidenceForm));const button=elements.capacityEvidenceForm.querySelector("button");button.disabled=true;elements.capacityEvidenceMessage.textContent="Recording the evidence observation…";try{await workspaceRequest("/api/workspace/capacity-brief-evidence",{method:"POST",body:{diagnosticId:selectedDiagnosticId,evidenceClass:values.evidenceClass,observation:values.observation,sourceNote:values.sourceNote,observedAt:new Date(values.observedAt).toISOString()}});elements.capacityEvidenceForm.elements.observation.value="";elements.capacityEvidenceForm.elements.sourceNote.value="";await loadCapacityEvidence();}catch(error){elements.capacityEvidenceMessage.textContent=error.message;}finally{button.disabled=false;}});
elements.capacityReviewForm.addEventListener("submit",async event=>{event.preventDefault();if(!selectedDiagnosticId||!elements.capacityReviewForm.reportValidity())return;const values=Object.fromEntries(new FormData(elements.capacityReviewForm)),ongoing=new Set(["continue","adjust","escalate"]);const button=elements.capacityReviewForm.querySelector("button");button.disabled=true;elements.capacityReviewMessage.textContent="Recording the intervention review…";try{await workspaceRequest("/api/workspace/capacity-brief-reviews",{method:"POST",body:{diagnosticId:selectedDiagnosticId,decision:values.decision,summary:values.summary,evidenceAssessment:values.evidenceAssessment,adjustments:lines(values.adjustments),nextReviewAt:ongoing.has(values.decision)&&values.nextReviewAt?new Date(values.nextReviewAt).toISOString():null}});elements.capacityReviewForm.elements.summary.value="";elements.capacityReviewForm.elements.evidenceAssessment.value="";elements.capacityReviewForm.elements.adjustments.value="";await loadCapacityReviews();await loadDiagnostics();}catch(error){elements.capacityReviewMessage.textContent=error.message;}finally{button.disabled=false;}});
elements.reassessmentForm.addEventListener("submit",async event=>{event.preventDefault();if(!selectedDiagnosticId||!elements.reassessmentForm.reportValidity())return;const values=Object.fromEntries(new FormData(elements.reassessmentForm)),button=elements.reassessmentForm.querySelector("button");button.disabled=true;elements.reassessmentMessage.textContent="Preserving the baseline method and planning reassessment…";try{const data=await workspaceRequest("/api/workspace/diagnostic-reassessment",{method:"POST",body:{diagnosticId:selectedDiagnosticId,targetAt:new Date(values.targetAt).toISOString(),planningNote:values.planningNote}});renderReassessment(data.plan);}catch(error){elements.reassessmentMessage.textContent=error.message;}finally{button.disabled=false;}});
elements.reassessmentSummary.addEventListener("click",async event=>{const button=event.target.closest("[data-activate-reassessment]");if(!button||!selectedDiagnosticId)return;button.disabled=true;elements.reassessmentMessage.textContent="Opening a separate confidential reassessment collection…";try{const data=await workspaceRequest("/api/workspace/diagnostic-reassessment",{method:"PUT",body:{diagnosticId:selectedDiagnosticId}});renderReassessment(data.plan);await loadDiagnostics();elements.reassessmentMessage.textContent="Reassessment collection opened. Assign new invitations from the linked diagnostic; baseline identities and responses were not copied.";}catch(error){elements.reassessmentMessage.textContent=error.message;button.disabled=false;}});
elements.clientInterventionAcceptance.addEventListener("submit",async event=>{event.preventDefault();if(!selectedDiagnosticId||!elements.clientInterventionAcceptance.reportValidity())return;const button=elements.clientInterventionAcceptance.querySelector("button");button.disabled=true;elements.interventionAcceptanceMessage.textContent="Verifying entitlement and recording acceptance…";try{await workspaceRequest("/api/workspace/diagnostic-intervention-acceptance",{method:"POST",body:{diagnosticId:selectedDiagnosticId,scopeAccepted:elements.clientInterventionAcceptance.elements.scopeAccepted.checked,commercialTermsAccepted:elements.clientInterventionAcceptance.elements.commercialTermsAccepted.checked}});elements.clientInterventionAcceptance.hidden=true;elements.interventionAcceptanceMessage.textContent="Intervention accepted. Capacity Operating Brief activation is the next gate.";await loadDiagnostics();}catch(error){elements.interventionAcceptanceMessage.textContent=error.message;button.disabled=false;}});
elements.interventionCheckout.addEventListener("click",async()=>{if(!selectedDiagnosticId)return;elements.interventionCheckout.disabled=true;elements.interventionAcceptanceMessage.textContent="Preparing secure intervention checkout…";try{await beginDiagnosticCheckout(selectedDiagnosticId,"intervention");}catch(error){elements.interventionAcceptanceMessage.textContent=error.message;elements.interventionCheckout.disabled=false;}});
elements.leadershipValidationForm.addEventListener("submit", async event => {
  event.preventDefault();
  const submitter = event.submitter;
  if (!submitter || !selectedDiagnosticId || !elements.leadershipValidationForm.reportValidity()) return;
  const values = Object.fromEntries(new FormData(elements.leadershipValidationForm));
  for (const button of elements.leadershipValidationForm.querySelectorAll("button")) button.disabled = true;
  elements.leadershipValidationMessage.textContent = "Recording the leadership validation decision…";
  try {
    const data = await workspaceRequest("/api/workspace/diagnostic-leadership-validation", { method: "POST", body: {
      diagnosticId: selectedDiagnosticId,
      resonance: values.resonance,
      completeness: values.completeness,
      surprised: elements.leadershipValidationForm.elements.surprised.checked,
      missingEvidence: values.missingEvidence || "",
      materialObjection: elements.leadershipValidationForm.elements.materialObjection.checked,
      objection: values.objection || "",
      decision: submitter.value,
      decisionNote: values.decisionNote
    }});
    elements.leadershipValidationForm.hidden = true;
    elements.leadershipValidationMessage.textContent = data.validation.decision === "accepted"
      ? "Finding accepted. Intervention design is the next governed gate."
      : "Revision requested. The finding has returned to protected synthesis review.";
    await loadDiagnostics();
  } catch (error) {
    elements.leadershipValidationMessage.textContent = error.message;
    elements.leadershipValidationMessage.dataset.tone = "error";
    for (const button of elements.leadershipValidationForm.querySelectorAll("button")) button.disabled = false;
  }
});
elements.closeDiagnosticContext.addEventListener("click", () => {
  selectedDiagnosticId = null;
  showSponsorHome();
});
elements.closeParticipantDesign.addEventListener("click", () => {
  selectedDiagnosticId = null;
  setPerspectiveStage(false);
  showSponsorHome();
});
elements.closeProtocolReview.addEventListener("click", () => {
  selectedDiagnosticId = null;
  showSponsorHome();
});
elements.addParticipantSlot.addEventListener("click", () => addParticipantSlot());
elements.coverageGapList.addEventListener("click", event => {
  const button = event.target.closest("[data-gap-action]"), row = event.target.closest("[data-gap-id]");
  if (!button || !row) return;
  if (button.dataset.gapAction === "add") { addSlotForGap(row.dataset.gapId); return; }
  if (button.dataset.gapAction === "remove") { removeCoverageObjective(row.dataset.gapId); return; }
  row.dataset.gapResolution = "accept";
  row.querySelector(".coverage-gap-consequence").hidden = false;
  row.querySelector("input").hidden = false;
  row.querySelector("input").focus();
  updateCohortBoundarySummary();
});
elements.perspectiveNext.addEventListener("click", () => showPerspectiveStep(perspectiveStep + 1));
elements.perspectiveBack.addEventListener("click", () => showPerspectiveStep(perspectiveStep - 1));
elements.contextNext.addEventListener("click", () => {
  if (!validateDiagnosticContextStep()) return;
  showDiagnosticContextStep(diagnosticContextStep + 1);
});
elements.contextBack.addEventListener("click", () => showDiagnosticContextStep(diagnosticContextStep === elements.contextSteps.length ? 0 : diagnosticContextStep - 1));
elements.designParticipantPerspectives.addEventListener("click", () => openParticipantDesign(selectedDiagnosticId).catch(error => {
  elements.diagnosticContextMessage.textContent = error.message;
  elements.diagnosticContextMessage.dataset.tone = "error";
}));
elements.reviewApprovedContext.addEventListener("click", () => elements.diagnosticContextSummary.scrollIntoView({ behavior: "smooth", block: "center" }));
elements.returnToWorkspace.addEventListener("click", showSponsorHome);
elements.reviewApprovedCohort.addEventListener("click", () => elements.approvedCohortList.scrollIntoView({ behavior: "smooth", block: "center" }));
elements.returnPerspectiveWorkspace.addEventListener("click", () => { setPerspectiveStage(false); showSponsorHome(); });
elements.reviewQuestionProtocol.addEventListener("click", () => {
  elements.reviewQuestionProtocol.disabled = true;
  elements.reviewQuestionProtocol.textContent = "Preparing the protocol…";
  setPerspectiveStage(false);
  openProtocolReview(selectedDiagnosticId).catch(error => {
    elements.participantDesign.hidden = false;
    elements.participantDesignMessage.textContent = error.message;
    elements.participantDesignMessage.dataset.tone = "error";
  }).finally(() => {
    elements.reviewQuestionProtocol.disabled = false;
    elements.reviewQuestionProtocol.textContent = "Review the 18-question protocol";
  });
});
elements.diagnosticContextForm.elements.approved.addEventListener("change", updateContextApprovalReadiness);
elements.diagnosticContextForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (currentRole !== "org:admin" || !selectedDiagnosticId || !elements.diagnosticContextForm.elements.approved.checked || !elements.diagnosticContextForm.reportValidity()) return;
  elements.approveDiagnosticContext.disabled = true;
  elements.diagnosticContextMessage.textContent = "Approving the bounded context…";
  delete elements.diagnosticContextMessage.dataset.tone;
  const values = Object.fromEntries(new FormData(elements.diagnosticContextForm));
  try {
    await workspaceRequest("/api/workspace/diagnostic-context", {
      method: "POST",
      body: {
        diagnosticId: selectedDiagnosticId,
        organizationSizeBand: values.organizationSizeBand,
        organizationHeadcount: Number(values.organizationHeadcount),
        sponsorPerspective: values.sponsorPerspective,
        sponsorRoleTitle: values.sponsorRoleTitle,
        sponsorOrganizationalLevel: values.sponsorOrganizationalLevel,
        sponsorFunction: values.sponsorFunction,
        sponsorResponsibility: values.sponsorResponsibility,
        industry: values.industry,
        businessModel: values.businessModel,
        operatingEnvironment: values.operatingEnvironment,
        organizationOffering: values.organizationOffering,
        diagnosticScopeType: values.diagnosticScopeType,
        diagnosticScopeName: values.diagnosticScopeName,
        diagnosticScopeHeadcount: Number(values.diagnosticScopeHeadcount),
        diagnosticScopeBoundary: values.diagnosticScopeBoundary,
        crossBoundaryDependencies: values.crossBoundaryDependencies,
        organizationContext: values.organizationContext,
        strategicPriority: values.strategicPriority,
        triggeringConcern: values.triggeringConcern,
        decisionsAtRisk: values.decisionsAtRisk,
        recentChanges: diagnosticList(values.recentChanges),
        priorInterventions: diagnosticList(values.priorInterventions),
        knownSensitivities: values.knownSensitivities,
        decisionNeeded: values.decisionNeeded,
        approvalNote: values.approvalNote,
        approved: elements.diagnosticContextForm.elements.approved.checked
      }
    });
    elements.diagnosticContextMessage.textContent = "Context approved. Participant design is now the next governed step.";
    elements.diagnosticContextMessage.dataset.tone = "success";
    await loadDiagnostics();
    await openDiagnosticContext(selectedDiagnosticId);
  } catch (error) {
    elements.diagnosticContextMessage.textContent = error.message;
    elements.diagnosticContextMessage.dataset.tone = "error";
  } finally {
    updateContextApprovalReadiness();
  }
});
elements.participantDesignForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (currentRole !== "org:admin" || !selectedDiagnosticId || !elements.participantDesignForm.reportValidity()) return;
  const draft = participantPlanDraft();
  if (!draft.targetLeadershipLevels.length || !draft.targetExecutionProximities.length || !draft.targetFunctionalLenses.length) {
    elements.participantDesignMessage.textContent = "Choose at least one objective in every coverage dimension.";
    elements.participantDesignMessage.dataset.tone = "error";
    return;
  }
  if (draft.participantSlots.length < 5) {
    elements.participantDesignMessage.textContent = "Add at least five identity-free perspective slots.";
    elements.participantDesignMessage.dataset.tone = "error";
    return;
  }
  const gaps = participantCoverageGaps(draft);
  let displayedGaps = [...elements.coverageGapList.querySelectorAll("[data-gap-id]")];
  if (gaps.join("|") !== displayedGaps.map(row => row.dataset.gapId).join("|")) {
    showCoverageGaps(gaps);
    if (gaps.length) {
      elements.participantDesignMessage.textContent = "The cohort changed. Review each viewpoint below and choose how you want to resolve it.";
      delete elements.participantDesignMessage.dataset.tone;
      return;
    }
    displayedGaps = [...elements.coverageGapList.querySelectorAll("[data-gap-id]")];
  }
  if (displayedGaps.some(row => row.dataset.gapResolution !== "accept")) {
    elements.participantDesignMessage.textContent = "Choose how to resolve every viewpoint that is not represented.";
    elements.participantDesignMessage.dataset.tone = "error";
    return;
  }
  const acceptedGaps = displayedGaps.map(row => ({
    gapId: row.dataset.gapId,
    reason: row.querySelector("input").value.trim()
  }));
  if (acceptedGaps.some(gap => !gap.reason)) {
    elements.participantDesignMessage.textContent = "Explain why it is appropriate to proceed without each omitted viewpoint.";
    elements.participantDesignMessage.dataset.tone = "error";
    return;
  }
  elements.approveParticipantPlan.disabled = true;
  elements.participantDesignMessage.textContent = "Approving the identity-free participant design…";
  delete elements.participantDesignMessage.dataset.tone;
  try {
    await workspaceRequest("/api/workspace/diagnostic-participants", {
      method: "POST",
      body: {
        diagnosticId: selectedDiagnosticId,
        ...draft,
        acceptedGaps,
        approvalNote: elements.participantDesignForm.elements.approvalNote.value
      }
    });
    await loadDiagnostics();
    await openParticipantDesign(selectedDiagnosticId);
  } catch (error) {
    elements.participantDesignMessage.textContent = error.message;
    elements.participantDesignMessage.dataset.tone = "error";
  } finally {
    elements.approveParticipantPlan.disabled = false;
  }
});
elements.protocolReviewForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (currentRole !== "org:admin" || !selectedDiagnosticId || !elements.protocolReviewForm.reportValidity()) return;
  const reviews = [...protocolQuestionReviews.values()];
  if (!reviews.length || reviews.some(review => review.status !== "approved")) {
    elements.protocolMessage.textContent = "Approve or resolve every question before approving the protocol.";
    return;
  }
  const questions = reviews.map(review => ({ templateId: review.templateId, questionText: review.revisions.at(-1)?.questionText || review.originalQuestion }));
  elements.approveProtocol.disabled = true;
  elements.protocolMessage.textContent = "Validating coverage and approving the common protocol…";
  delete elements.protocolMessage.dataset.tone;
  try {
    await workspaceRequest("/api/workspace/diagnostic-protocol-sponsor-review-v2", {
      method: "POST",
      body: {
        diagnosticId: selectedDiagnosticId,
        questions,
        questionReviews: reviews.map(({ templateId, originalQuestion, revisions, status }) => ({ templateId, originalQuestion, revisions, status })),
        approvalNote: elements.protocolReviewForm.elements.approvalNote.value
      }
    });
    await openProtocolReview(selectedDiagnosticId);
  } catch (error) {
    elements.protocolMessage.textContent = error.message;
    elements.protocolMessage.dataset.tone = "error";
  } finally {
    elements.approveProtocol.disabled = false;
  }
});
elements.protocolQuestionList.addEventListener("click", async event => {
  const row = event.target.closest("[data-template-id]");
  if (!row) return;
  const review = protocolQuestionReviews.get(row.dataset.templateId);
  if (!review) return;
  if (event.target.closest("[data-approve-protocol-question]")) {
    review.status = "approved";
    row.dataset.reviewState = "approved";
    row.querySelector("[data-protocol-question-state]").textContent = "Approved";
    updateProtocolApprovalReadiness();
    return;
  }
  const button = event.target.closest("[data-reframe-protocol-question]");
  if (!button) return;
  const reason = row.querySelector("[data-protocol-revision-reason]").value;
  if (!reason) { row.querySelector("[data-protocol-question-state]").textContent = "Choose why this question needs revision."; return; }
  if (review.revisions.length >= 3) { row.querySelector("[data-protocol-question-state]").textContent = "Revision limit reached. Contact Senger Advisory for review."; return; }
  button.disabled = true;
  row.querySelector("[data-protocol-question-state]").textContent = "Creating a governed reframing…";
  try {
    const currentQuestion = review.revisions.at(-1)?.questionText || review.originalQuestion;
    const data = await workspaceRequest("/api/workspace/diagnostic-protocol-sponsor-review-v2", { method: "POST", body: { action: "reframe-question", diagnosticId: selectedDiagnosticId, templateId: review.templateId, currentQuestion, reason } });
    review.revisions.push({ reason, questionText: data.revision.questionText, token: data.revision.token });
    review.status = "pending";
    row.dataset.reviewState = "revised";
    row.querySelector("[data-protocol-question-text]").textContent = data.revision.questionText;
    row.querySelector("[data-protocol-question-state]").textContent = "Reframed—review and approve this version.";
    updateProtocolApprovalReadiness();
  } catch (error) {
    row.querySelector("[data-protocol-question-state]").textContent = error.message;
  } finally { button.disabled = false; }
});
elements.diagnosticInvitationSlots.addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.target.closest("form[data-plan-slot-id]");
  if (!form || !selectedDiagnosticId || !form.reportValidity()) return;
  const button = form.querySelector("button");
  button.disabled = true;
  elements.diagnosticInvitationMessage.textContent = "Sending the protected participant invitation…";
  delete elements.diagnosticInvitationMessage.dataset.tone;
  try {
    await workspaceRequest("/api/workspace/diagnostic-invitations", {
      method: "POST",
      body: {
        diagnosticId: selectedDiagnosticId,
        planSlotId: form.dataset.planSlotId,
        emailAddress: form.querySelector("input").value
      }
    });
    elements.diagnosticInvitationMessage.textContent = "Invitation sent. Interview access remains gated by notice acceptance.";
    elements.diagnosticInvitationMessage.dataset.tone = "success";
    await loadDiagnosticInvitations(selectedDiagnosticId);
  } catch (error) {
    elements.diagnosticInvitationMessage.textContent = error.message;
    elements.diagnosticInvitationMessage.dataset.tone = "error";
  } finally {
    button.disabled = false;
  }
});
elements.collectionForm.elements.opensAt.addEventListener("change", event => {
  elements.collectionForm.elements.closesAt.min = event.currentTarget.value || localDateValue();
});
elements.collectionForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (currentRole !== "org:admin" || !elements.collectionForm.reportValidity()) return;
  setCollectionMessage(editingRoundId ? "Saving the protected draft…" : "Creating the protected draft…");
  elements.createRound.disabled = true;
  const formData = new FormData(elements.collectionForm);
  try {
    const draft = {
      label: formData.get("label"),
      opensAt: openingBoundary(formData.get("opensAt")),
      closesAt: dateBoundary(formData.get("closesAt"), true)
    };
    await workspaceRequest("/api/workspace/rounds", {
      method: editingRoundId ? "PATCH" : "POST",
      body: editingRoundId
        ? { action: "update", roundId: editingRoundId, ...draft }
        : followUpRoundId
          ? { priorRoundId: followUpRoundId, ...draft }
          : draft
    });
    const message = editingRoundId ? "Draft changes saved." : "Draft created. Review it before opening invitations.";
    resetRoundForm();
    setCollectionMessage(message, "success");
    await prepareOwnerCollection();
  } catch (error) {
    setCollectionMessage(error instanceof Error ? error.message : "The draft could not be saved.", "error");
  } finally {
    elements.createRound.disabled = false;
  }
});
elements.cancelEdit.addEventListener("click", () => {
  resetRoundForm();
  setCollectionMessage();
});
elements.roundList.addEventListener("click", async event => {
  const button = event.target.closest("[data-action]");
  if (!button || currentRole !== "org:admin") return;
  const round = collectionRounds.find(value => value.id === button.dataset.roundId);
  if (!round) return;
  if (button.dataset.action === "edit") {
    editRound(round);
    return;
  }
  if (button.dataset.action === "invitations") {
    await loadInvitations(round.id).catch(error => setCollectionMessage(error.message, "error"));
    elements.invitationPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (button.dataset.action === "follow-up") {
    prepareFollowUp(round);
    return;
  }
  if (button.dataset.action === "open") {
    const confirmed = window.confirm(
      `Open “${round.label}” for invitations? The collection name and dates will be locked.`
    );
    if (!confirmed) return;
    button.disabled = true;
    try {
      await workspaceRequest("/api/workspace/rounds", {
        method: "PATCH",
        body: { action: "open", roundId: round.id }
      });
      selectedRoundId = round.id;
      resetRoundForm();
      setCollectionMessage("Round opened. Participant invitations are now available.", "success");
      await prepareOwnerCollection();
    } catch (error) {
      setCollectionMessage(error.message, "error");
    } finally {
      button.disabled = false;
    }
    return;
  }
  if (button.dataset.action === "delete") {
    const confirmed = window.confirm(
      `Delete the draft “${round.label}”? This cannot be undone.`
    );
    if (!confirmed) return;
    button.disabled = true;
    try {
      await workspaceRequest("/api/workspace/rounds", {
        method: "DELETE",
        body: { roundId: round.id }
      });
      if (editingRoundId === round.id) resetRoundForm();
      setCollectionMessage("Draft deleted.", "success");
      await prepareOwnerCollection();
    } catch (error) {
      setCollectionMessage(error.message, "error");
    } finally {
      button.disabled = false;
    }
  }
});
elements.invitationForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (
    currentRole !== "org:admin"
    || !selectedRoundId
    || !elements.invitationForm.reportValidity()
  ) return;
  elements.sendInvitation.disabled = true;
  setInvitationMessage("Sending the participant invitation…");
  const formData = new FormData(elements.invitationForm);
  try {
    await workspaceRequest("/api/workspace/invitations", {
      method: "POST",
      body: {
        roundId: selectedRoundId,
        emailAddress: formData.get("emailAddress")
      }
    });
    elements.invitationForm.reset();
    setInvitationMessage("Invitation sent. Identity remains separate from assessment responses.", "success");
    await loadInvitations(selectedRoundId);
  } catch (error) {
    setInvitationMessage(error.message, "error");
  } finally {
    elements.sendInvitation.disabled = false;
  }
});
elements.invitationList.addEventListener("click", async event => {
  const reminderButton = event.target.closest("[data-reminder-email]");
  if (reminderButton) {
    window.location.assign(reminderUrl([reminderButton.dataset.reminderEmail]));
    return;
  }
  const button = event.target.closest("[data-invitation-id]");
  if (!button || !selectedRoundId || currentRole !== "org:admin") return;
  if (!window.confirm("Revoke this pending invitation? Its email link will stop working.")) return;
  button.disabled = true;
  try {
    await workspaceRequest("/api/workspace/invitations", {
      method: "DELETE",
      body: {
        roundId: selectedRoundId,
        invitationId: button.dataset.invitationId
      }
    });
    setInvitationMessage("Invitation revoked.", "success");
    await loadInvitations(selectedRoundId);
  } catch (error) {
    setInvitationMessage(error.message, "error");
  } finally {
    button.disabled = false;
  }
});
elements.remindNonrespondents.addEventListener("click", () => {
  if (currentNonrespondents.length === 0) return;
  window.location.assign(reminderUrl(
    currentNonrespondents.map(invitation => invitation.emailAddress)
  ));
});
elements.actionCycleForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (
    currentRole !== "org:admin"
    || !selectedRoundId
    || !elements.actionCycleForm.reportValidity()
  ) return;
  elements.saveActionCycle.disabled = true;
  elements.actionCycleMessage.textContent = "Starting the shared action cycle…";
  delete elements.actionCycleMessage.dataset.tone;
  try {
    const values = Object.fromEntries(new FormData(elements.actionCycleForm));
    await workspaceRequest("/api/workspace/action-cycles", {
      method: "POST",
      body: { roundId: selectedRoundId, ...values }
    });
    elements.actionCycleForm.reset();
    elements.actionCycleMessage.textContent =
      "Shared action cycle started. This records a hypothesis, not proof of causality.";
    elements.actionCycleMessage.dataset.tone = "success";
    await loadActionCycles(selectedRoundId);
  } catch (error) {
    elements.actionCycleMessage.textContent = error.message;
    elements.actionCycleMessage.dataset.tone = "error";
  } finally {
    elements.saveActionCycle.disabled = false;
  }
});
elements.actionCycleList.addEventListener("submit", async event => {
  const form = event.target.closest("[data-action-review]");
  if (!form || currentRole !== "org:admin" || !selectedRoundId) return;
  event.preventDefault();
  if (!form.reportValidity()) return;
  const submit = form.querySelector("button[type='submit']");
  submit.disabled = true;
  elements.actionCycleMessage.textContent = "Saving the organizational review…";
  delete elements.actionCycleMessage.dataset.tone;
  try {
    const values = Object.fromEntries(new FormData(form));
    await workspaceRequest("/api/workspace/action-cycles", {
      method: "PATCH",
      body: {
        roundId: selectedRoundId,
        actionCycleId: form.dataset.actionReview,
        ...values
      }
    });
    elements.actionCycleMessage.textContent =
      "Review saved. The observation remains context, not proof of causality.";
    elements.actionCycleMessage.dataset.tone = "success";
    await loadActionCycles(selectedRoundId);
  } catch (error) {
    elements.actionCycleMessage.textContent = error.message;
    elements.actionCycleMessage.dataset.tone = "error";
    submit.disabled = false;
  }
});
elements.closeRound.addEventListener("click", async () => {
  if (!selectedRoundId || currentRole !== "org:admin") return;
  if (!window.confirm(
    "Close this collection? Participation will end and the round will become the baseline for a linked follow-up."
  )) return;
  elements.closeRound.disabled = true;
  elements.actionCycleMessage.textContent = "Closing the threshold-qualified collection…";
  try {
    await workspaceRequest("/api/workspace/rounds", {
      method: "PATCH",
      body: { action: "close", roundId: selectedRoundId }
    });
    selectedRoundId = null;
    setCollectionMessage(
      "Collection closed. Create the linked follow-up when the organization is ready to reassess.",
      "success"
    );
    await prepareOwnerCollection();
  } catch (error) {
    elements.actionCycleMessage.textContent = error.message;
    elements.actionCycleMessage.dataset.tone = "error";
  } finally {
    elements.closeRound.disabled = false;
  }
});
elements.participantAcknowledgement.addEventListener("change", event => {
  elements.beginAssessment.disabled = !event.currentTarget.checked;
  elements.participantMessage.textContent = event.currentTarget.checked
    ? "Ready to confirm and begin."
    : "Acknowledge the workspace privacy notice to continue.";
});
elements.beginAssessment.addEventListener("click", async () => {
  if (
    currentRole !== "org:member"
    || !currentParticipation
    || (currentParticipation.kind === "assessment" && currentParticipation.state !== "ready")
    || (currentParticipation.kind === "assessment" && currentParticipation.submitted)
    || (currentParticipation.kind === "diagnostic" && currentParticipation.noticeAccepted)
  ) return;
  elements.beginAssessment.disabled = true;
  try {
    if (currentParticipation.kind === "diagnostic") {
      if (!elements.participantAcknowledgement.checked) return;
      await workspaceRequest("/api/workspace/diagnostic-participation", {
        method: "POST",
        body: {
          diagnosticId: currentParticipation.diagnosticId,
          noticeVersion: currentParticipation.noticeVersion
        }
      });
      await prepareParticipant();
      return;
    }
    if (!currentParticipation.noticeAccepted) {
      if (!elements.participantAcknowledgement.checked) return;
      await workspaceRequest("/api/workspace/participation", {
        method: "POST",
        body: {
          roundId: currentParticipation.round.id,
          noticeVersion: currentParticipation.noticeVersion
        }
      });
    }
    const assessmentUrl = new URL("/assessment.html", window.location.origin);
    assessmentUrl.searchParams.set("workspaceRound", currentParticipation.round.id);
    window.location.assign(assessmentUrl);
  } catch (error) {
    elements.participantMessage.textContent = error.message;
    elements.participantMessage.dataset.tone = "error";
    elements.beginAssessment.disabled = false;
  }
});
elements.participantInterviewQuestions.addEventListener("input",()=>{interviewDirty=true;elements.interviewMessage.textContent="Draft changes not yet saved.";clearTimeout(interviewAutosaveTimer);interviewAutosaveTimer=setTimeout(()=>saveInterviewDraft(),1200);});
elements.saveInterview.addEventListener("click",async()=>{elements.saveInterview.disabled=true;await saveInterviewDraft();elements.saveInterview.disabled=false;});
elements.participantInterview.addEventListener("submit",async event=>{event.preventDefault();if(!elements.participantInterview.reportValidity())return;try{clearTimeout(interviewAutosaveTimer);await interviewSavePromise;const interviewEndpoint=currentParticipation.interviewVersion==="2.0.0"?"/api/workspace/diagnostic-interview-v2":"/api/workspace/diagnostic-interview";const result=await workspaceRequest(interviewEndpoint,{method:"POST",body:interviewPayload()});interviewDirty=false;if(result.clarificationRequired){elements.interviewMessage.textContent=`Evidence-depth review requested ${result.followUpCount} bounded clarifications.`;await loadParticipantInterview(currentParticipation.diagnosticId);}else renderDiagnosticInterviewComplete();}catch(error){elements.interviewMessage.textContent=error.message;elements.interviewMessage.dataset.tone="error";}});
elements.participantPocFeedback.addEventListener("submit",async event=>{event.preventDefault();if(!currentParticipation?.diagnosticId||!elements.participantPocFeedback.reportValidity())return;const values=Object.fromEntries(new FormData(elements.participantPocFeedback)),button=elements.participantPocFeedback.querySelector("button");button.disabled=true;try{await workspaceRequest("/api/workspace/poc-feedback",{method:"POST",body:{diagnosticId:currentParticipation.diagnosticId,checkpoint:"interview-completion",clarityRating:values.clarityRating,trustRating:values.trustRating,actionabilityRating:null,supportRequired:Boolean(values.supportRequired),purchaseIntent:"not-asked",feedback:values.feedback||null}});elements.participantPocFeedback.hidden=true;elements.participantMessage.textContent="Optional product feedback received without adding your identity or entering it into diagnostic evidence.";}catch(error){elements.participantPocFeedbackMessage.textContent=error.message;button.disabled=false;}});
window.addEventListener("beforeunload",event=>{if(!interviewDirty)return;event.preventDefault();event.returnValue="";});

initialize();
