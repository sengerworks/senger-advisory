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
import { comparisonForProfile, formatScoreDelta } from "./comparison-engine.js";

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
  comparison: app.querySelector("[data-private-comparison]"),
  comparisonWindow: app.querySelector("[data-comparison-window]"),
  comparisonBaseline: app.querySelector("[data-comparison-baseline]"),
  comparisonCurrent: app.querySelector("[data-comparison-current]"),
  comparisonDelta: app.querySelector("[data-comparison-delta]"),
  comparisonMethod: app.querySelector("[data-comparison-method]"),
  comparisonDomains: app.querySelector("[data-comparison-domains]"),
  comparisonConstraint: app.querySelector("[data-comparison-constraint]"),
  comparisonChanges: app.querySelector("[data-comparison-changes]"),
  comparisonChangeList: app.querySelector("[data-comparison-change-list]"),
  followUp: app.querySelector("[data-start-follow-up]"),
  assessmentCount: app.querySelector("[data-assessment-count]"),
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
const changeNames = {
  leadership: "Leadership",
  "decision-rights": "Decision rights",
  "operating-cadence": "Operating cadence",
  structure: "Structure",
  process: "Process",
  technology: "Technology",
  talent: "Talent",
  culture: "Culture",
  strategy: "Strategy",
  "external-event": "External event",
  other: "Other"
};

let state = null;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" }).format(new Date(value));
}

function formatElapsed(days) {
  if (days < 1) return "Completed on the same day";
  if (days === 1) return "1 day between observations";
  return `${days} days between observations`;
}

function constraintNames(ids) {
  return ids.map(id => domainNames[id]).join(" + ");
}

function renderComparison(profile) {
  const comparison = comparisonForProfile(profile);
  elements.assessmentCount.textContent = profile.assessmentInstances.length === 1
    ? "1 observation currently saved."
    : `${profile.assessmentInstances.length} observations currently saved.`;
  elements.comparison.hidden = comparison.policy === "unavailable";
  if (comparison.policy === "unavailable") return;

  elements.comparisonWindow.textContent = `${formatDate(comparison.baseline.completedAt)} → ${formatDate(comparison.current.completedAt)} · ${formatElapsed(comparison.elapsedDays)}`;
  elements.comparisonBaseline.textContent = comparison.baseline.overallIndex;
  elements.comparisonCurrent.textContent = comparison.current.overallIndex;
  elements.comparisonMethod.textContent = comparison.policy === "numeric-delta"
    ? "Assessment and scoring versions match. Raw point changes are shown without an improvement threshold."
    : comparison.reason;
  elements.comparisonDelta.parentElement.hidden = comparison.policy !== "numeric-delta";
  elements.comparisonDelta.textContent = comparison.policy === "numeric-delta" ? formatScoreDelta(comparison.overallDelta) : "";
  elements.comparisonDomains.innerHTML = Object.keys(domainNames).map(id => {
    const baseline = comparison.baseline.domainScores[id];
    const current = comparison.current.domainScores[id];
    const delta = comparison.policy === "numeric-delta" ? `<strong>${formatScoreDelta(comparison.domainDeltas[id])}</strong>` : "";
    return `<article>
      <h3>${domainNames[id]}</h3>
      <p><span>${baseline}</span><i aria-hidden="true">→</i><span>${current}</span>${delta}</p>
    </article>`;
  }).join("");
  const baselineConstraint = constraintNames(comparison.baseline.primaryConstraintIds);
  const currentConstraint = constraintNames(comparison.current.primaryConstraintIds);
  elements.comparisonConstraint.textContent = comparison.constraintChanged
    ? `Shifted from ${baselineConstraint} to ${currentConstraint}.`
    : `Remained ${currentConstraint}.`;
  const changes = profile.changeRecords.filter(record => {
    const started = Date.parse(record.startedAt);
    return started >= Date.parse(comparison.baseline.completedAt) && started <= Date.parse(comparison.current.completedAt) + 86400000;
  });
  elements.comparisonChanges.hidden = changes.length === 0;
  elements.comparisonChangeList.innerHTML = changes.map(record => {
    const targets = record.targetDomainIds.length
      ? ` · ${record.targetDomainIds.map(id => domainNames[id]).join(", ")}`
      : "";
    return `<article>
      <h3>${changeNames[record.category]}</h3>
      <p>${formatDate(record.startedAt)} · ${record.magnitude} · ${record.status}${targets}</p>
      ${record.note ? `<blockquote>${escapeHtml(record.note)}</blockquote>` : ""}
    </article>`;
  }).join("");
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
  elements.followUp.href = new URL(`assessment.html${location.hash}`, location.href).toString();
  renderComparison(profile);
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
