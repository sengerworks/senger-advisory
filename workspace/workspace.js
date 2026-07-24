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
  invitationList: document.querySelector("[data-invitation-list]")
};

let clerk = null;
let signInMounted = false;
let currentRole = null;
let collectionRounds = [];
let editingRoundId = null;
let selectedRoundId = null;

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
    title: "Your private assessment will begin here.",
    description: "Your identity confirms participation. Your answers and individual scores will not be visible to workspace roles.",
    action: "Assessment invitation coming next"
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
  elements.invitationList.replaceChildren();
  for (const invitation of data.invitations) {
    const card = document.createElement("article");
    card.className = "invitation-card";
    const copy = document.createElement("div");
    const email = document.createElement("strong");
    email.textContent = invitation.emailAddress;
    const status = document.createElement("span");
    status.textContent = `${invitation.status} · expires ${formattedDate(invitation.expiresAt)}`;
    copy.append(email, status);
    card.append(copy);
    if (invitation.status === "pending") {
      const revoke = document.createElement("button");
      revoke.className = "round-action";
      revoke.type = "button";
      revoke.dataset.invitationId = invitation.id;
      revoke.textContent = "Revoke";
      card.append(revoke);
    }
    elements.invitationList.append(card);
  }
}

async function loadInvitations(roundId) {
  const round = collectionRounds.find(value => value.id === roundId && value.status === "open");
  if (!round) return;
  selectedRoundId = roundId;
  elements.invitationPanel.hidden = false;
  elements.invitationRound.textContent = `${round.label} · ${formattedDate(round.opensAt)}–${formattedDate(round.closesAt)}`;
  const data = await workspaceRequest(`/api/workspace/invitations?roundId=${encodeURIComponent(roundId)}`);
  renderInvitations(data);
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
  if (session.role === "org:admin") await prepareOwnerCollection();
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

initialize();
