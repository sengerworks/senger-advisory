import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import {
  createRecoveryUrl,
  decryptSavedProfile,
  encryptSavedProfile,
  recoveryCredentialsFromUrl,
  recoverySecretFromUrl,
  rotateRecoveryLink,
  validateEncryptedEnvelope,
  validateSavedProfile
} from "../saved-results-crypto.js";

const now = new Date("2026-07-22T12:00:00.000Z");
const expiresAt = new Date("2027-07-22T12:00:00.000Z");
const secret = Uint8Array.from({ length: 32 }, (_, index) => index);
const iv = Uint8Array.from({ length: 12 }, (_, index) => 160 + index);

function sampleProfile() {
  return {
    schemaVersion: "1.0.0",
    profileId: "123e4567-e89b-42d3-a456-426614174000",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    displayLabel: "Test Profile",
    assessmentInstances: [{
      assessmentInstanceId: "223e4567-e89b-42d3-a456-426614174000",
      completedAt: now.toISOString(),
      assessmentVersion: "1.0.0",
      scoringVersion: "0.1.0",
      reportVersion: "1.0.0",
      contextVersion: "1.0.0",
      context: { organizationSize: "25–49 people", respondentRole: "Executive leader", growthPressure: "High" },
      domainScores: { leadership: 50, decisions: 75, rhythm: 50, alignment: 75, technology: 25, culture: 50 },
      overallIndex: 50,
      interpretationBand: "Strained",
      primaryConstraintIds: ["technology"],
      accuracyRating: null
    }],
    outcomeSnapshots: [],
    changeRecords: []
  };
}

async function deterministicBundle() {
  return encryptSavedProfile(sampleProfile(), {
    secret,
    iv,
    now,
    expiresAt,
    baseUrl: "https://example.com/crypto-prototype.html"
  });
}

test("machine-readable contracts and compatibility registry parse", async () => {
  const files = ["saved-profile.schema.json", "encrypted-envelope.schema.json", "version-compatibility.json"];
  const parsed = await Promise.all(files.map(async file => JSON.parse(await readFile(new URL(`../schemas/${file}`, import.meta.url), "utf8"))));
  assert.equal(parsed[0].properties.schemaVersion.const, "1.2.0");
  assert.equal(parsed[1].properties.cipher.const, "AES-256-GCM");
  assert.equal(parsed[2].versions[0].comparisonPolicy, "same-version-only");
  assert.equal(parsed[2].versions[0].outcomeMeasureVersion, "1.0.0");
});

test("validates the minimized profile and rejects individual answers or extra fields", () => {
  const profile = sampleProfile();
  assert.equal(validateSavedProfile(profile), true);
  assert.equal(validateSavedProfile({
    ...profile,
    schemaVersion: "1.1.0",
    researchParticipation: {
      subjectId: "323e4567-e89b-42d3-a456-426614174000",
      withdrawalCapability: "sVSm-KOJ0lU_UQmHI8PkkRHoQzJczlMzCkqE1uMm08k",
      consentVersion: "1.0.0",
      grantedAt: now.toISOString(),
      lastContributedAt: null
    }
  }), true);
  assert.equal(validateSavedProfile({
    ...profile,
    schemaVersion: "1.2.0",
    researchParticipation: null,
    actionCycles: [{
      actionCycleId: "423e4567-e89b-42d3-a456-426614174000",
      actionCycleVersion: "1.0.0",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      constraintDomainId: "technology",
      hypothesis: "If workflow ownership is explicit, handoff delay should fall.",
      commitment: "Assign one owner to the intake workflow.",
      evidenceMeasureId: "executionReliability",
      evidenceDescription: "Review the share of commitments delivered on the agreed date.",
      reviewDate: "2026-08-22",
      status: "active",
      closedAt: null,
      reviewNote: ""
    }]
  }), true);
  assert.equal(validateSavedProfile({ ...profile, individualAnswers: [1, 2, 3] }), false);
  assert.equal(validateSavedProfile({ ...profile, assessmentInstances: [{ ...profile.assessmentInstances[0], responses: [1, 2, 3] }] }), false);
  assert.equal(validateSavedProfile({ ...profile, outcomeSnapshots: [{ arbitrary: "data" }] }), false);
  assert.equal(validateSavedProfile({ ...profile, changeRecords: [{ unrestricted: "note" }] }), false);
});

test("matches deterministic HKDF and AES-GCM test vectors", async () => {
  const bundle = await deterministicBundle();
  assert.equal(bundle.accessId, "a-6hB2i-j-rFKcwPH8-_oehxcqZoxAu6CKZ_Gnt9NSU");
  assert.equal(bundle.authenticationCapability, "sVSm-KOJ0lU_UQmHI8PkkRHoQzJczlMzCkqE1uMm08k");
  assert.equal(bundle.envelope.iv, "oKGio6Slpqeoqaqr");
  assert.equal(createHash("sha256").update(bundle.envelope.ciphertext).digest("hex"), "8384ea5c281eaf93ca6d5e9f5b26954b8060e60774f0a27c99878a7a0879ea96");
  assert.equal(bundle.recoveryUrl, "https://example.com/crypto-prototype.html#recovery=v1.AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8");
});

test("round trips a private profile without placing secrets in the envelope", async () => {
  const bundle = await deterministicBundle();
  const restored = await decryptSavedProfile(bundle.envelope, bundle.recoveryUrl, { now });
  assert.deepEqual(restored.profile, sampleProfile());
  assert.equal(validateEncryptedEnvelope(bundle.envelope), true);
  const serialized = JSON.stringify(bundle.envelope);
  assert.equal(serialized.includes("AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8"), false);
  assert.equal(serialized.includes(bundle.authenticationCapability), false);
});

test("rejects wrong links, ciphertext corruption, and authenticated metadata changes", async () => {
  const bundle = await deterministicBundle();
  const wrongLink = createRecoveryUrl(bundle.recoveryUrl, Uint8Array.from({ length: 32 }, (_, index) => 255 - index));
  await assert.rejects(decryptSavedProfile(bundle.envelope, wrongLink, { now }), /cannot decrypt/);

  const first = bundle.envelope.ciphertext[0] === "A" ? "B" : "A";
  const corrupted = { ...bundle.envelope, ciphertext: `${first}${bundle.envelope.ciphertext.slice(1)}` };
  await assert.rejects(decryptSavedProfile(corrupted, bundle.recoveryUrl, { now }), /cannot decrypt/);

  const changedMetadata = { ...bundle.envelope, updatedAt: "2026-07-23T12:00:00.000Z" };
  await assert.rejects(decryptSavedProfile(changedMetadata, bundle.recoveryUrl, { now }), /cannot decrypt/);
});

test("rejects expired and malformed recovery attempts", async () => {
  const bundle = await deterministicBundle();
  await assert.rejects(decryptSavedProfile(bundle.envelope, bundle.recoveryUrl, { now: new Date("2027-07-22T12:00:00.001Z") }), /expired/);
  assert.throws(() => recoverySecretFromUrl("https://example.com/#recovery=v2.invalid"), /invalid or unsupported/);
});

test("rotates recovery material while preserving the encrypted profile and creation date", async () => {
  const bundle = await deterministicBundle();
  const replacementSecret = Uint8Array.from({ length: 32 }, (_, index) => 64 + index);
  const rotated = await rotateRecoveryLink(bundle.envelope, bundle.recoveryUrl, {
    secret: replacementSecret,
    iv: Uint8Array.from({ length: 12 }, (_, index) => 32 + index),
    now: new Date("2026-08-01T12:00:00.000Z"),
    baseUrl: bundle.recoveryUrl
  });
  assert.notEqual(rotated.accessId, bundle.accessId);
  assert.notEqual(rotated.recoveryUrl, bundle.recoveryUrl);
  assert.equal(rotated.envelope.createdAt, bundle.envelope.createdAt);
  const restored = await decryptSavedProfile(rotated.envelope, rotated.recoveryUrl, { now: new Date("2026-08-01T12:00:00.000Z") });
  assert.deepEqual(restored.profile, sampleProfile());
  await assert.rejects(decryptSavedProfile(rotated.envelope, bundle.recoveryUrl, { now }), /cannot decrypt/);
});

test("derives a stable access ID from the recovery fragment without exposing the secret", async () => {
  const bundle = await deterministicBundle();
  const credentials = await recoveryCredentialsFromUrl(bundle.recoveryUrl);
  assert.equal(credentials.accessId, bundle.accessId);
  assert.equal(credentials.authenticationCapability, bundle.authenticationCapability);
  assert.equal(bundle.accessId.includes("AAECAw"), false);
});
