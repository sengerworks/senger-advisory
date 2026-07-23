import {
  decryptSavedProfile,
  encryptSavedProfile,
  recoveryCredentialsFromUrl,
  recoverySecretFromUrl,
  rotateRecoveryLink
} from "./saved-results-crypto.js";
import {
  deletePrivateResult,
  privateResultsEnvironment,
  readPrivateResult,
  rotatePrivateResult,
  updatePrivateResult
} from "./private-results-api.js";

const app = document.querySelector("[data-private-results]");
const elements = {
  loading: app.querySelector("[data-loading]"),
  error: app.querySelector("[data-error]"),
  errorMessage: app.querySelector("[data-error-message]"),
  profile: app.querySelector("[data-profile]"),
  label: app.querySelector("[data-profile-label]"),
  date: app.querySelector("[data-profile-date]"),
  index: app.querySelector("[data-profile-index]"),
  band: app.querySelector("[data-profile-band]"),
  context: app.querySelector("[data-profile-context]"),
  domains: app.querySelector("[data-private-domains]"),
  constraint: app.querySelector("[data-private-constraint]"),
  expires: app.querySelector("[data-private-expires]"),
  storage: app.querySelector("[data-private-storage]"),
  copy: app.querySelector("[data-copy-link]"),
  print: app.querySelector("[data-print-profile]"),
  renew: app.querySelector("[data-renew-profile]"),
  rotate: app.querySelector("[data-rotate-profile]"),
  requestDelete: app.querySelector("[data-request-delete]"),
  confirmDelete: app.querySelector("[data-confirm-delete]"),
  cancelDelete: app.querySelector("[data-cancel-delete]"),
  deleteConfirmation: app.querySelector("[data-delete-confirmation]"),
  status: app.querySelector("[data-private-status]")
};

const domainNames = {
  leadership: "Leadership",
  decisions: "Decision Velocity",
  rhythm: "Operating Rhythm",
  alignment: "Alignment",
  technology: "Technology",
  culture: "Culture"
};

let state = null;

function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" }).format(new Date(value));
}

function showError(message) {
  elements.loading.hidden = true;
  elements.profile.hidden = true;
  elements.error.hidden = false;
  elements.errorMessage.textContent = message;
  elements.error.focus();
}

function setBusy(busy) {
  [elements.copy, elements.print, elements.renew, elements.rotate, elements.requestDelete].forEach(button => { button.disabled = busy; });
}

function renderProfile(profile, envelope) {
  const assessment = profile.assessmentInstances.at(-1);
  elements.label.textContent = profile.displayLabel || "Organizational Capacity";
  elements.date.textContent = `Completed ${formatDate(assessment.completedAt)}`;
  elements.index.textContent = assessment.overallIndex;
  elements.band.textContent = assessment.interpretationBand;
  elements.band.dataset.band = assessment.interpretationBand.toLowerCase();
  const context = Object.values(assessment.context).filter(Boolean);
  elements.context.hidden = context.length === 0;
  elements.context.textContent = context.length ? `Context: ${context.join(" · ")}` : "";
  elements.domains.innerHTML = Object.entries(assessment.domainScores).map(([id, score]) => `<article class="domain-result">
    <div><h3>${domainNames[id]}</h3><span>${score}/100</span></div>
    <div class="domain-score-track" aria-label="${domainNames[id]}: ${score} out of 100"><span style="width:${score}%"></span></div>
  </article>`).join("");
  elements.constraint.textContent = assessment.primaryConstraintIds.map(id => domainNames[id]).join(" + ");
  elements.expires.textContent = formatDate(envelope.expiresAt);
  if (privateResultsEnvironment.localDevelopment) elements.storage.textContent = "Local development mock · ciphertext only";
}

async function openProfile() {
  try {
    const credentials = await recoveryCredentialsFromUrl(location.href);
    const stored = await readPrivateResult(credentials);
    const restored = await decryptSavedProfile(stored.envelope, location.href);
    state = { credentials, envelope: stored.envelope, etag: stored.etag, profile: restored.profile };
    renderProfile(state.profile, state.envelope);
    elements.loading.hidden = true;
    elements.error.hidden = true;
    elements.profile.hidden = false;
    elements.profile.focus();
  } catch (error) {
    showError(error.message || "The recovery link may be missing, expired, deleted, or invalid.");
  }
}

elements.copy.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(location.href);
    elements.status.textContent = "Recovery link copied. Protect it like a password.";
  } catch {
    elements.status.textContent = "Copy was unavailable. Copy the complete address from your browser’s address bar.";
  }
});

elements.print.addEventListener("click", () => window.print());

elements.renew.addEventListener("click", async () => {
  if (!state) return;
  setBusy(true);
  elements.status.textContent = "Renewing encrypted profile…";
  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 365 * 86400000);
    const profile = { ...state.profile, updatedAt: now.toISOString(), expiresAt: expiresAt.toISOString() };
    const encrypted = await encryptSavedProfile(profile, {
      secret: recoverySecretFromUrl(location.href),
      baseUrl: location.href,
      createdAt: state.envelope.createdAt,
      now,
      expiresAt
    });
    const saved = await updatePrivateResult({ ...state.credentials, envelope: encrypted.envelope, expectedEtag: state.etag });
    state = { credentials: state.credentials, envelope: encrypted.envelope, etag: saved.etag, profile };
    renderProfile(profile, encrypted.envelope);
    elements.status.textContent = `Encrypted profile renewed through ${formatDate(expiresAt)}.`;
  } catch (error) {
    elements.status.textContent = error.message;
  } finally {
    setBusy(false);
  }
});

elements.rotate.addEventListener("click", async () => {
  if (!state) return;
  setBusy(true);
  elements.status.textContent = "Rotating recovery link…";
  try {
    const rotated = await rotateRecoveryLink(state.envelope, location.href, { baseUrl: location.href });
    const newCredentials = await recoveryCredentialsFromUrl(rotated.recoveryUrl);
    const saved = await rotatePrivateResult({
      ...state.credentials,
      newAccessId: newCredentials.accessId,
      newAuthenticationCapability: newCredentials.authenticationCapability,
      envelope: rotated.envelope
    });
    history.replaceState(null, "", rotated.recoveryUrl);
    state = { credentials: newCredentials, envelope: rotated.envelope, etag: saved.etag, profile: state.profile };
    renderProfile(state.profile, state.envelope);
    elements.status.textContent = "Recovery link rotated. Copy the new link now; the previous link no longer works.";
  } catch (error) {
    elements.status.textContent = error.message;
  } finally {
    setBusy(false);
  }
});

elements.requestDelete.addEventListener("click", () => {
  elements.deleteConfirmation.hidden = false;
  elements.confirmDelete.focus();
});

elements.cancelDelete.addEventListener("click", () => {
  elements.deleteConfirmation.hidden = true;
  elements.requestDelete.focus();
});

elements.confirmDelete.addEventListener("click", async () => {
  if (!state) return;
  elements.confirmDelete.disabled = true;
  elements.status.textContent = "Deleting encrypted profile…";
  try {
    await deletePrivateResult(state.credentials);
    history.replaceState(null, "", `${location.pathname}${location.search}`);
    state = null;
    showError("This encrypted profile was deleted. Its recovery link no longer works.");
  } catch (error) {
    elements.status.textContent = error.message;
    elements.confirmDelete.disabled = false;
  }
});

openProfile();
