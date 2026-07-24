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
  primaryAction: document.querySelector("[data-primary-action]")
};

let clerk = null;
let signInMounted = false;

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
      description: "Identity and tenant isolation are active. Invitation and collection controls arrive in the next milestone.",
      action: "Collection setup coming next"
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
        afterSignInUrl: "/workspace/",
        afterSignUpUrl: "/workspace/",
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
  elements.roleLabel.textContent = content.label;
  elements.organizationName.textContent = clerk.organization.name;
  elements.focusTitle.textContent = content.title;
  elements.focusDescription.textContent = content.description;
  elements.primaryAction.textContent = content.action;
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

initialize();
