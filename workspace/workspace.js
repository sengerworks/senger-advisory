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
  account: document.querySelector("[data-account]"),
  accountLabel: document.querySelector("[data-account-label]"),
  signOut: document.querySelector("[data-sign-out]"),
  roleLabel: document.querySelector("[data-role-label]"),
  organizationName: document.querySelector("[data-organization-name]"),
  focusTitle: document.querySelector("[data-focus-title]"),
  focusDescription: document.querySelector("[data-focus-description]"),
  primaryAction: document.querySelector("[data-primary-action]"),
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
  participantPanel: document.querySelector("[data-participant-panel]"),
  participantRound: document.querySelector("[data-participant-round]"),
  participantDates: document.querySelector("[data-participant-dates]"),
  participantNotice: document.querySelector("[data-participant-notice]"),
  participantAcknowledgement: document.querySelector("[data-participant-acknowledgement]"),
  participantMessage: document.querySelector("[data-participant-message]"),
  beginAssessment: document.querySelector("[data-begin-assessment]")
};

let clerk = null;
let signInMounted = false;
let currentRole = null;
let collectionRounds = [];
let editingRoundId = null;
let selectedRoundId = null;
let currentParticipation = null;
let currentNonrespondents = [];

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
      label: "Workspace owner",
      title: "Prepare the first collection round.",
      description: "Name the collection, set the participation period, and review the privacy threshold before inviting participants.",
      action: "Set up a collection round"
    };
  }
  if (role === "org:facilitator") {
    return {
      label: "Workspace facilitator",
      title: "The workspace is ready to facilitate.",
      description: "You will manage invitations and collection progress without access to any individual response.",
      action: "Facilitation tools coming next"
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
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...(options.body === undefined ? {} : { "Content-Type": "application/json" })
    },
    ...options,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
  const data = await response.json();
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
  elements.collectionForm.reset();
  elements.createRound.textContent = "Create draft round";
  elements.cancelEdit.hidden = true;
  const today = localDateValue();
  elements.collectionForm.elements.opensAt.min = today;
  elements.collectionForm.elements.closesAt.min = today;
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
}

async function loadActionCycles(roundId) {
  const data = await workspaceRequest(
    `/api/workspace/action-cycles?roundId=${encodeURIComponent(roundId)}`
  );
  renderActionCycles(data.actionCycles);
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
}

async function prepareOwnerCollection() {
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
      elements.focusTitle.textContent = "Review the current collection draft.";
      elements.focusDescription.textContent = "Confirm the name and dates, then open the round to enable participant invitations.";
      elements.primaryAction.textContent = "Review collection setup";
      elements.invitationPanel.hidden = true;
    }
  }
}

async function prepareParticipant() {
  currentParticipation = await workspaceRequest("/api/workspace/participation");
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

async function sessionState() {
  const response = await fetch("/api/workspace/session", {
    credentials: "same-origin",
    headers: { Accept: "application/json" }
  });
  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) throw new Error("The workspace service is temporarily unavailable.");
  return response.json();
}

async function ensureActiveOrganization() {
  if (clerk.organization) return true;
  const memberships = clerk.user?.organizationMemberships || [];
  if (memberships.length !== 1) return false;
  await clerk.setActive({ organization: memberships[0].organization.id });
  return Boolean(clerk.organization);
}

async function render() {
  if (!clerk.user) {
    elements.account.hidden = true;
    showState("signInState");
    if (!signInMounted) {
      clerk.mountSignIn(elements.signInMount, {
        routing: "hash",
        forceRedirectUrl: "/workspace/",
        fallbackRedirectUrl: "/workspace/",
        signUpForceRedirectUrl: "/workspace/",
        signUpFallbackRedirectUrl: "/workspace/",
        appearance: {
          variables: {
            colorPrimary: "#1c1c1c",
            colorText: "#1c1c1c",
            colorBackground: "#ffffff",
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
  if (!session) {
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
  elements.collectionPanel.hidden = true;
  elements.participantPanel.hidden = true;
  if (session.role === "org:admin") await prepareOwnerCollection();
  if (session.role === "org:participant") await prepareParticipant();
  showState("readyState");
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
      clerk.addListener(() => {
        render().catch(() => showError("The workspace could not refresh your session."));
      });
    }
    await render();
  } catch (error) {
    showError(error instanceof Error ? error.message : "The workspace could not be prepared.");
  }
}

elements.retry.addEventListener("click", () => initialize());
elements.refresh.addEventListener("click", () => render().catch(() => showError("The workspace could not refresh your session.")));
elements.signOut.addEventListener("click", () => clerk?.signOut({ redirectUrl: "/workspace/" }));
elements.primaryAction.addEventListener("click", () => {
  if (currentRole === "org:participant") {
    elements.participantPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    if (!elements.participantNotice.hidden) {
      elements.participantAcknowledgement.focus({ preventScroll: true });
    }
    return;
  }
  if (currentRole !== "org:admin") return;
  if (!elements.invitationPanel.hidden) {
    elements.invitationPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    elements.invitationForm.elements.emailAddress.focus({ preventScroll: true });
    return;
  }
  elements.collectionPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  elements.collectionForm.elements.label.focus({ preventScroll: true });
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
elements.participantAcknowledgement.addEventListener("change", event => {
  elements.beginAssessment.disabled = !event.currentTarget.checked;
  elements.participantMessage.textContent = event.currentTarget.checked
    ? "Ready to confirm and begin."
    : "Acknowledge the workspace privacy notice to continue.";
});
elements.beginAssessment.addEventListener("click", async () => {
  if (
    currentRole !== "org:participant"
    || !currentParticipation
    || currentParticipation.state !== "ready"
    || currentParticipation.submitted
  ) return;
  elements.beginAssessment.disabled = true;
  try {
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

initialize();
