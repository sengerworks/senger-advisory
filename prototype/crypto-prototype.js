import {
  decryptSavedProfile,
  encryptSavedProfile,
  recoveryCredentialsFromUrl,
  rotateRecoveryLink
} from "../saved-results-crypto.js";

const app = document.querySelector("[data-crypto-prototype]");
const storagePrefix = "senger-private-results-prototype:";
const elements = {
  create: app.querySelector("[data-create]"),
  restore: app.querySelector("[data-restore]"),
  rotate: app.querySelector("[data-rotate]"),
  corrupt: app.querySelector("[data-corrupt]"),
  delete: app.querySelector("[data-delete]"),
  copy: app.querySelector("[data-copy]"),
  recoveryLink: app.querySelector("[data-recovery-link]"),
  status: app.querySelector("[data-status]"),
  envelopeVersion: app.querySelector("[data-envelope-version]"),
  cipher: app.querySelector("[data-cipher]"),
  accessId: app.querySelector("[data-access-id]"),
  ciphertextSize: app.querySelector("[data-ciphertext-size]"),
  expires: app.querySelector("[data-expires]"),
  envelopeOutput: app.querySelector("[data-envelope-output]"),
  profileOutput: app.querySelector("[data-profile-output]")
};

function sampleProfile() {
  const now = new Date();
  const expires = new Date(now.getTime() + 365 * 86400000);
  return {
    schemaVersion: "1.0.0",
    profileId: crypto.randomUUID(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    displayLabel: "Sample Capacity Profile",
    assessmentInstances: [{
      assessmentInstanceId: crypto.randomUUID(),
      completedAt: now.toISOString(),
      assessmentVersion: "1.0.0",
      scoringVersion: "0.1.0",
      reportVersion: "1.0.0",
      contextVersion: "1.0.0",
      context: { organizationSize: "150–399 people", respondentRole: "Executive leader", growthPressure: "Increasing" },
      domainScores: { leadership: 58, decisions: 50, rhythm: 67, alignment: 58, technology: 75, culture: 67 },
      overallIndex: 59,
      interpretationBand: "Strained",
      primaryConstraintIds: ["decisions"],
      accuracyRating: null
    }],
    outcomeSnapshots: [],
    changeRecords: []
  };
}

function storageKey(accessId) {
  return `${storagePrefix}${accessId}`;
}

function setStatus(message, state = "neutral") {
  elements.status.textContent = message;
  elements.status.dataset.state = state;
}

function updateInspection(envelope, accessId, profile = null) {
  elements.envelopeVersion.textContent = envelope.envelopeVersion;
  elements.cipher.textContent = envelope.cipher;
  elements.accessId.textContent = `${accessId.slice(0, 12)}…`;
  elements.ciphertextSize.textContent = `${envelope.ciphertext.length} encoded characters`;
  elements.expires.textContent = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(new Date(envelope.expiresAt));
  elements.envelopeOutput.textContent = JSON.stringify(envelope, null, 2);
  elements.profileOutput.textContent = profile ? JSON.stringify(profile, null, 2) : "Restore a valid profile to view plaintext.";
  elements.rotate.disabled = false;
  elements.corrupt.disabled = false;
  elements.delete.disabled = false;
}

function clearInspection() {
  [elements.envelopeVersion, elements.cipher, elements.accessId, elements.ciphertextSize, elements.expires].forEach(element => { element.textContent = "—"; });
  elements.envelopeOutput.textContent = "No envelope";
  elements.profileOutput.textContent = "Restore a valid profile to view plaintext.";
  elements.rotate.disabled = true;
  elements.corrupt.disabled = true;
  elements.delete.disabled = true;
}

async function currentRecord() {
  const credentials = await recoveryCredentialsFromUrl(location.href);
  const stored = localStorage.getItem(storageKey(credentials.accessId));
  if (!stored) throw new Error("No encrypted record matches this recovery link in this browser.");
  return { credentials, envelope: JSON.parse(stored) };
}

async function createProfile() {
  try {
    const result = await encryptSavedProfile(sampleProfile(), { baseUrl: location.href });
    localStorage.setItem(storageKey(result.accessId), JSON.stringify(result.envelope));
    history.replaceState(null, "", result.recoveryUrl);
    elements.recoveryLink.value = result.recoveryUrl;
    updateInspection(result.envelope, result.accessId);
    setStatus("Encrypted profile created. Only ciphertext was placed in local browser storage.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

async function restoreProfile() {
  try {
    const { credentials, envelope } = await currentRecord();
    const restored = await decryptSavedProfile(envelope, location.href);
    elements.recoveryLink.value = location.href;
    updateInspection(envelope, credentials.accessId, restored.profile);
    setStatus("Private profile restored and validated in this browser.", "success");
  } catch (error) {
    elements.profileOutput.textContent = "Recovery failed. No plaintext was released.";
    setStatus(error.message, "error");
  }
}

async function rotateLink() {
  try {
    const { credentials, envelope } = await currentRecord();
    const rotated = await rotateRecoveryLink(envelope, location.href, { baseUrl: location.href });
    localStorage.setItem(storageKey(rotated.accessId), JSON.stringify(rotated.envelope));
    localStorage.removeItem(storageKey(credentials.accessId));
    history.replaceState(null, "", rotated.recoveryUrl);
    elements.recoveryLink.value = rotated.recoveryUrl;
    updateInspection(rotated.envelope, rotated.accessId);
    setStatus("Recovery link rotated. The previous link no longer finds a record.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

async function corruptRecord() {
  try {
    const { credentials, envelope } = await currentRecord();
    const first = envelope.ciphertext[0] === "A" ? "B" : "A";
    const corrupted = { ...envelope, ciphertext: `${first}${envelope.ciphertext.slice(1)}` };
    localStorage.setItem(storageKey(credentials.accessId), JSON.stringify(corrupted));
    updateInspection(corrupted, credentials.accessId);
    setStatus("Ciphertext changed. Restore now to verify authenticated corruption detection.", "neutral");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

async function deleteRecord() {
  try {
    const credentials = await recoveryCredentialsFromUrl(location.href);
    localStorage.removeItem(storageKey(credentials.accessId));
    history.replaceState(null, "", `${location.pathname}${location.search}`);
    elements.recoveryLink.value = "";
    clearInspection();
    setStatus("Encrypted local record deleted. The previous recovery link no longer works.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

elements.create.addEventListener("click", createProfile);
elements.restore.addEventListener("click", restoreProfile);
elements.rotate.addEventListener("click", rotateLink);
elements.corrupt.addEventListener("click", corruptRecord);
elements.delete.addEventListener("click", deleteRecord);
elements.copy.addEventListener("click", async () => {
  if (!elements.recoveryLink.value) return setStatus("Create or restore a recovery link first.", "error");
  try {
    await navigator.clipboard.writeText(elements.recoveryLink.value);
    setStatus("Recovery link copied. Protect it like a password; it would grant access to a connected production record.", "success");
  } catch {
    elements.recoveryLink.select();
    setStatus("Copy was unavailable. The recovery link has been selected for manual copying.", "neutral");
  }
});

elements.recoveryLink.value = location.hash ? location.href : "";
if (location.hash) restoreProfile();
