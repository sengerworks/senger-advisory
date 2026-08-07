const PROFILE_SCHEMA_VERSION = "1.2.0";
const ENVELOPE_VERSION = "1.0.0";
const CIPHER = "AES-256-GCM";
const RECOVERY_PREFIX = "v1.";
const DEFAULT_RETENTION_DAYS = 365;
const DOMAINS = ["leadership", "decisions", "rhythm", "alignment", "technology", "culture"];
const BANDS = new Set(["Constrained", "Strained", "Developing", "Enabling"]);
const CONTEXT = {
  organizationSize: new Set(["", "Fewer than 25 people", "25–49 people", "50–149 people", "150–399 people", "400 or more people"]),
  respondentRole: new Set(["", "CEO or founder", "Executive leader", "Functional leader", "People or operations leader", "Advisor or board member"]),
  growthPressure: new Set(["", "Stable", "Increasing", "High", "Transformational change"])
};
const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });

function requireCrypto() {
  if (!globalThis.crypto?.subtle || !globalThis.crypto?.getRandomValues) {
    throw new Error("This browser does not support the Web Crypto features required for private saved results.");
  }
  return globalThis.crypto;
}

function bytesToBase64Url(bytes) {
  let binary = "";
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("Invalid recovery value.");
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  try {
    return Uint8Array.from(atob(padded), character => character.charCodeAt(0));
  } catch {
    throw new Error("Invalid recovery value.");
  }
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(value, keys) {
  if (!isObject(value)) return false;
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function isTimestamp(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function isUuid(value) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isScore(value) {
  return Number.isInteger(value) && value >= 0 && value <= 100;
}

function validateAssessmentInstance(instance) {
  const keys = ["assessmentInstanceId", "completedAt", "assessmentVersion", "scoringVersion", "reportVersion", "contextVersion", "context", "domainScores", "overallIndex", "interpretationBand", "primaryConstraintIds", "accuracyRating"];
  if (!hasExactKeys(instance, keys) || !isUuid(instance.assessmentInstanceId) || !isTimestamp(instance.completedAt)) return false;
  if (![instance.assessmentVersion, instance.scoringVersion, instance.reportVersion, instance.contextVersion].every(value => /^\d+\.\d+\.\d+$/.test(value))) return false;
  if (!hasExactKeys(instance.context, ["organizationSize", "respondentRole", "growthPressure"])) return false;
  if (!Object.entries(instance.context).every(([key, value]) => CONTEXT[key].has(value))) return false;
  if (!hasExactKeys(instance.domainScores, DOMAINS) || !DOMAINS.every(domain => isScore(instance.domainScores[domain]))) return false;
  if (!isScore(instance.overallIndex) || !BANDS.has(instance.interpretationBand)) return false;
  if (!Array.isArray(instance.primaryConstraintIds) || instance.primaryConstraintIds.length < 1 || instance.primaryConstraintIds.length > 6) return false;
  if (!instance.primaryConstraintIds.every(domain => DOMAINS.includes(domain)) || new Set(instance.primaryConstraintIds).size !== instance.primaryConstraintIds.length) return false;
  return instance.accuracyRating === null || (Number.isInteger(instance.accuracyRating) && instance.accuracyRating >= 1 && instance.accuracyRating <= 5);
}

function validateOutcomeSnapshot(snapshot) {
  const keys = ["outcomeSnapshotId", "observedAt", "outcomeMeasureVersion", "observationWindow", "decisionPace", "leadershipEscalationLoad", "crossFunctionalCoordinationLoad", "executionReliability", "changeAbsorption", "evidenceSource"];
  if (!hasExactKeys(snapshot, keys) || !isUuid(snapshot.outcomeSnapshotId) || !isTimestamp(snapshot.observedAt)) return false;
  if (!/^\d+\.\d+\.\d+$/.test(snapshot.outcomeMeasureVersion) || !["30-days", "90-days"].includes(snapshot.observationWindow)) return false;
  if (![snapshot.decisionPace, snapshot.leadershipEscalationLoad, snapshot.crossFunctionalCoordinationLoad, snapshot.executionReliability, snapshot.changeAbsorption].every(value => Number.isInteger(value) && value >= 1 && value <= 5)) return false;
  return ["self-report", "operating-measure", "mixed"].includes(snapshot.evidenceSource);
}

function validateChangeRecord(record) {
  const keys = ["changeRecordId", "startedAt", "endedAt", "category", "targetDomainIds", "magnitude", "status", "note"];
  const categories = ["leadership", "decision-rights", "operating-cadence", "structure", "process", "technology", "talent", "culture", "strategy", "external-event", "other"];
  if (!hasExactKeys(record, keys) || !isUuid(record.changeRecordId) || !isTimestamp(record.startedAt)) return false;
  if (record.endedAt !== null && !isTimestamp(record.endedAt)) return false;
  if (!categories.includes(record.category) || !["limited", "material", "enterprise-wide"].includes(record.magnitude)) return false;
  if (!["planned", "active", "completed", "discontinued"].includes(record.status)) return false;
  if (!Array.isArray(record.targetDomainIds) || record.targetDomainIds.length > 6 || !record.targetDomainIds.every(domain => DOMAINS.includes(domain)) || new Set(record.targetDomainIds).size !== record.targetDomainIds.length) return false;
  return typeof record.note === "string" && record.note.length <= 500;
}

function validateActionCycle(cycle) {
  const keys = ["actionCycleId", "actionCycleVersion", "createdAt", "updatedAt", "constraintDomainId", "hypothesis", "commitment", "evidenceMeasureId", "evidenceDescription", "reviewDate", "status", "closedAt", "reviewNote"];
  const evidenceMeasures = ["decisionPace", "leadershipEscalationLoad", "crossFunctionalCoordinationLoad", "executionReliability", "changeAbsorption", "other"];
  if (!hasExactKeys(cycle, keys) || !isUuid(cycle.actionCycleId) || !/^\d+\.\d+\.\d+$/.test(cycle.actionCycleVersion)) return false;
  if (![cycle.createdAt, cycle.updatedAt].every(isTimestamp) || Date.parse(cycle.createdAt) > Date.parse(cycle.updatedAt)) return false;
  if (!DOMAINS.includes(cycle.constraintDomainId) || !evidenceMeasures.includes(cycle.evidenceMeasureId)) return false;
  if (typeof cycle.hypothesis !== "string" || cycle.hypothesis.length < 1 || cycle.hypothesis.length > 500) return false;
  if (typeof cycle.commitment !== "string" || cycle.commitment.length < 1 || cycle.commitment.length > 500) return false;
  if (typeof cycle.evidenceDescription !== "string" || cycle.evidenceDescription.length < 1 || cycle.evidenceDescription.length > 300) return false;
  const reviewDate = new Date(`${cycle.reviewDate}T12:00:00Z`);
  if (typeof cycle.reviewNote !== "string" || cycle.reviewNote.length > 500 || !/^\d{4}-\d{2}-\d{2}$/.test(cycle.reviewDate) || !Number.isFinite(reviewDate.getTime()) || reviewDate.toISOString().slice(0, 10) !== cycle.reviewDate) return false;
  if (!["planned", "active", "completed", "stopped"].includes(cycle.status)) return false;
  if (cycle.closedAt !== null && !isTimestamp(cycle.closedAt)) return false;
  return ["completed", "stopped"].includes(cycle.status) === (cycle.closedAt !== null);
}

function isBoundedString(value, minimum, maximum) {
  return typeof value === "string" && value.length >= minimum && value.length <= maximum;
}

function validateSignalPattern(pattern) {
  return hasExactKeys(pattern, ["patternId", "statement", "evidenceLevel", "sourceItemIds"])
    && isBoundedString(pattern.patternId, 1, 80)
    && isBoundedString(pattern.statement, 1, 500)
    && ["emerging", "pronounced"].includes(pattern.evidenceLevel)
    && Array.isArray(pattern.sourceItemIds)
    && pattern.sourceItemIds.length >= 1
    && pattern.sourceItemIds.length <= 5
    && pattern.sourceItemIds.every(value => isBoundedString(value, 1, 100));
}

function validateSignalInstance(instance) {
  const keys = ["resultVersion", "assessmentVersion", "resultId", "completedAt", "context", "executionDemand", "frictionPatterns", "compensationPatterns", "operatingSignals", "questionsRaised", "alternativeExplanations", "boundedFirstAction", "diagnosticNeed", "boundary"];
  if (!hasExactKeys(instance, keys) || instance.resultVersion !== "2.0.0" || instance.assessmentVersion !== "2.0.0") return false;
  if (!isUuid(instance.resultId) || !isTimestamp(instance.completedAt)) return false;
  if (!hasExactKeys(instance.context, ["demandSource", "executionPriority", "timeHorizon", "organizationSize", "respondentRole"])) return false;
  if (![instance.context.demandSource, instance.context.timeHorizon].every(value => isBoundedString(value, 1, 80))) return false;
  if (!isBoundedString(instance.context.executionPriority, 40, 500) || !isBoundedString(instance.context.organizationSize, 0, 80) || !isBoundedString(instance.context.respondentRole, 0, 80)) return false;
  if (!hasExactKeys(instance.executionDemand, ["evidenceLevel", "dimensionsObserved", "sourceItemIds"])) return false;
  if (!["limited", "emerging", "pronounced"].includes(instance.executionDemand.evidenceLevel)) return false;
  if (![instance.executionDemand.dimensionsObserved, instance.executionDemand.sourceItemIds].every(values => Array.isArray(values) && values.length <= 10 && values.every(value => isBoundedString(value, 1, 100)))) return false;
  if (![instance.frictionPatterns, instance.compensationPatterns, instance.operatingSignals].every(patterns => Array.isArray(patterns) && patterns.length <= 3 && patterns.every(validateSignalPattern))) return false;
  if (![instance.questionsRaised, instance.alternativeExplanations].every(values => Array.isArray(values) && values.length <= 5 && values.every(value => isBoundedString(value, 1, 1000)))) return false;
  return [instance.boundedFirstAction, instance.diagnosticNeed, instance.boundary].every(value => isBoundedString(value, 1, 2000));
}

function validateSignalProfile(profile) {
  const keys = ["schemaVersion", "profileId", "createdAt", "updatedAt", "expiresAt", "displayLabel", "signalInstances"];
  if (!hasExactKeys(profile, keys) || profile.schemaVersion !== "2.0.0" || !isUuid(profile.profileId)) return false;
  if (![profile.createdAt, profile.updatedAt, profile.expiresAt].every(isTimestamp)) return false;
  if (Date.parse(profile.createdAt) > Date.parse(profile.updatedAt) || Date.parse(profile.updatedAt) >= Date.parse(profile.expiresAt)) return false;
  if (!isBoundedString(profile.displayLabel, 0, 80)) return false;
  return Array.isArray(profile.signalInstances)
    && profile.signalInstances.length >= 1
    && profile.signalInstances.length <= 24
    && profile.signalInstances.every(validateSignalInstance);
}

export function validateSavedProfile(profile) {
  if (profile?.schemaVersion === "2.0.0") return validateSignalProfile(profile);
  const baseKeys = ["schemaVersion", "profileId", "createdAt", "updatedAt", "expiresAt", "displayLabel", "assessmentInstances", "outcomeSnapshots", "changeRecords"];
  const versionKeys = {
    "1.0.0": baseKeys,
    "1.1.0": [...baseKeys, "researchParticipation"],
    "1.2.0": [...baseKeys, "researchParticipation", "actionCycles"]
  };
  if (!versionKeys[profile?.schemaVersion] || !hasExactKeys(profile, versionKeys[profile.schemaVersion]) || !isUuid(profile.profileId)) return false;
  if (![profile.createdAt, profile.updatedAt, profile.expiresAt].every(isTimestamp)) return false;
  if (Date.parse(profile.createdAt) > Date.parse(profile.updatedAt) || Date.parse(profile.updatedAt) >= Date.parse(profile.expiresAt)) return false;
  if (typeof profile.displayLabel !== "string" || profile.displayLabel.length > 80) return false;
  if (!Array.isArray(profile.assessmentInstances) || profile.assessmentInstances.length < 1 || profile.assessmentInstances.length > 24) return false;
  if (!profile.assessmentInstances.every(validateAssessmentInstance)) return false;
  if (!Array.isArray(profile.outcomeSnapshots) || profile.outcomeSnapshots.length > 24 || !profile.outcomeSnapshots.every(validateOutcomeSnapshot)) return false;
  if (!Array.isArray(profile.changeRecords) || profile.changeRecords.length > 100 || !profile.changeRecords.every(validateChangeRecord)) return false;
  if (profile.schemaVersion !== "1.0.0" && profile.researchParticipation !== null) {
    const participation = profile.researchParticipation;
    const keys = ["subjectId", "withdrawalCapability", "consentVersion", "grantedAt", "lastContributedAt"];
    if (!hasExactKeys(participation, keys) || !isUuid(participation.subjectId)) return false;
    if (typeof participation.withdrawalCapability !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(participation.withdrawalCapability)) return false;
    if (!/^\d+\.\d+\.\d+$/.test(participation.consentVersion) || !isTimestamp(participation.grantedAt)) return false;
    if (participation.lastContributedAt !== null && !isTimestamp(participation.lastContributedAt)) return false;
  }
  if (profile.schemaVersion === PROFILE_SCHEMA_VERSION && (!Array.isArray(profile.actionCycles) || profile.actionCycles.length > 50 || !profile.actionCycles.every(validateActionCycle))) return false;
  return true;
}

export function validateEncryptedEnvelope(envelope) {
  const keys = ["envelopeVersion", "cipher", "iv", "ciphertext", "createdAt", "updatedAt", "expiresAt"];
  return hasExactKeys(envelope, keys)
    && envelope.envelopeVersion === ENVELOPE_VERSION
    && envelope.cipher === CIPHER
    && typeof envelope.iv === "string"
    && /^[A-Za-z0-9_-]{16}$/.test(envelope.iv)
    && typeof envelope.ciphertext === "string"
    && envelope.ciphertext.length >= 32
    && envelope.ciphertext.length <= 131072
    && /^[A-Za-z0-9_-]+$/.test(envelope.ciphertext)
    && [envelope.createdAt, envelope.updatedAt, envelope.expiresAt].every(isTimestamp)
    && Date.parse(envelope.createdAt) <= Date.parse(envelope.updatedAt)
    && Date.parse(envelope.updatedAt) < Date.parse(envelope.expiresAt);
}

export function createRecoverySecret() {
  const bytes = new Uint8Array(32);
  requireCrypto().getRandomValues(bytes);
  return bytes;
}

async function deriveMaterial(secret) {
  if (!(secret instanceof Uint8Array) || secret.length !== 32) throw new Error("Recovery secret must contain 256 bits.");
  const subtle = requireCrypto().subtle;
  const sourceKey = await subtle.importKey("raw", secret, "HKDF", false, ["deriveBits", "deriveKey"]);
  const salt = encoder.encode("senger-advisory/private-saved-results/v1");
  const authenticationCapability = new Uint8Array(await subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info: encoder.encode("authentication-capability") }, sourceKey, 256));
  const encryptionKey = await subtle.deriveKey({ name: "HKDF", hash: "SHA-256", salt, info: encoder.encode("profile-encryption") }, sourceKey, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  const accessDigest = new Uint8Array(await subtle.digest("SHA-256", authenticationCapability));
  return { authenticationCapability, encryptionKey, accessId: bytesToBase64Url(accessDigest) };
}

function associatedData(envelope, accessId) {
  return encoder.encode(JSON.stringify({
    envelopeVersion: envelope.envelopeVersion,
    cipher: envelope.cipher,
    createdAt: envelope.createdAt,
    updatedAt: envelope.updatedAt,
    expiresAt: envelope.expiresAt,
    accessId
  }));
}

function normalizeDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error("Invalid date.");
  return date;
}

export function createRecoveryUrl(baseUrl, secret) {
  const url = new URL(baseUrl, globalThis.location?.href || "https://sengeradvisory.com/crypto-prototype.html");
  url.hash = `recovery=${RECOVERY_PREFIX}${bytesToBase64Url(secret)}`;
  return url.toString();
}

export function recoverySecretFromUrl(value) {
  const url = new URL(value, globalThis.location?.href || "https://sengeradvisory.com/crypto-prototype.html");
  const match = url.hash.match(/^#recovery=v1\.([A-Za-z0-9_-]{43})$/);
  if (!match) throw new Error("This recovery link is invalid or unsupported.");
  const secret = base64UrlToBytes(match[1]);
  if (secret.length !== 32) throw new Error("This recovery link is invalid or unsupported.");
  return secret;
}

export async function recoveryCredentialsFromUrl(value) {
  const material = await deriveMaterial(recoverySecretFromUrl(value));
  return {
    accessId: material.accessId,
    authenticationCapability: bytesToBase64Url(material.authenticationCapability)
  };
}

export async function encryptSavedProfile(profile, options = {}) {
  if (!validateSavedProfile(profile)) throw new Error("Saved profile does not match a supported schema version.");
  const secret = options.secret || createRecoverySecret();
  const material = await deriveMaterial(secret);
  const now = normalizeDate(options.now || new Date());
  const createdAt = normalizeDate(options.createdAt || now).toISOString();
  const updatedAt = now.toISOString();
  const expiresAt = normalizeDate(options.expiresAt || profile.expiresAt || new Date(now.getTime() + DEFAULT_RETENTION_DAYS * 86400000)).toISOString();
  if (Date.parse(expiresAt) <= now.getTime()) throw new Error("Expiration must be in the future.");
  const iv = options.iv || (() => { const value = new Uint8Array(12); requireCrypto().getRandomValues(value); return value; })();
  if (!(iv instanceof Uint8Array) || iv.length !== 12) throw new Error("AES-GCM requires a 96-bit initialization vector.");
  const envelopeBase = { envelopeVersion: ENVELOPE_VERSION, cipher: CIPHER, createdAt, updatedAt, expiresAt };
  const encrypted = await requireCrypto().subtle.encrypt({ name: "AES-GCM", iv, additionalData: associatedData(envelopeBase, material.accessId), tagLength: 128 }, material.encryptionKey, encoder.encode(JSON.stringify(profile)));
  const envelope = { ...envelopeBase, iv: bytesToBase64Url(iv), ciphertext: bytesToBase64Url(new Uint8Array(encrypted)) };
  return {
    envelope,
    accessId: material.accessId,
    authenticationCapability: bytesToBase64Url(material.authenticationCapability),
    recoveryUrl: createRecoveryUrl(options.baseUrl || globalThis.location?.href || "https://sengeradvisory.com/crypto-prototype.html", secret)
  };
}

export async function decryptSavedProfile(envelope, recoveryUrl, options = {}) {
  if (!validateEncryptedEnvelope(envelope)) throw new Error("Encrypted envelope is invalid.");
  const now = normalizeDate(options.now || new Date());
  if (!options.allowExpired && Date.parse(envelope.expiresAt) <= now.getTime()) throw new Error("This saved result has expired.");
  const material = await deriveMaterial(recoverySecretFromUrl(recoveryUrl));
  let decrypted;
  try {
    decrypted = await requireCrypto().subtle.decrypt({ name: "AES-GCM", iv: base64UrlToBytes(envelope.iv), additionalData: associatedData(envelope, material.accessId), tagLength: 128 }, material.encryptionKey, base64UrlToBytes(envelope.ciphertext));
  } catch {
    throw new Error("This recovery link cannot decrypt the saved result.");
  }
  let profile;
  try {
    profile = JSON.parse(decoder.decode(decrypted));
  } catch {
    throw new Error("The decrypted saved result is invalid.");
  }
  if (!validateSavedProfile(profile)) throw new Error("The decrypted saved result does not match a supported schema.");
  return { profile, accessId: material.accessId, authenticationCapability: bytesToBase64Url(material.authenticationCapability) };
}

export async function rotateRecoveryLink(envelope, recoveryUrl, options = {}) {
  const restored = await decryptSavedProfile(envelope, recoveryUrl, { now: options.now });
  return encryptSavedProfile(restored.profile, { ...options, createdAt: envelope.createdAt, secret: options.secret || createRecoverySecret() });
}

export const savedResultsVersions = Object.freeze({
  profileSchema: PROFILE_SCHEMA_VERSION,
  envelope: ENVELOPE_VERSION,
  cipher: CIPHER
});
