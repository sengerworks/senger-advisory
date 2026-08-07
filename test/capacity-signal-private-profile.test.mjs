import test from "node:test";
import assert from "node:assert/strict";
import { createCapacitySignalAssessment, capacitySignalQuestionnaire } from "../capacity-signal-assessment-engine.js";
import { decryptSavedProfile, encryptSavedProfile, validateSavedProfile } from "../saved-results-crypto.js";

function result() {
  const questionnaire = capacitySignalQuestionnaire();
  return createCapacitySignalAssessment({
    context: {
      demandSource: "technology-ai",
      executionPriority: "Introduce AI-enabled service delivery without weakening client trust or execution reliability.",
      timeHorizon: "next-12-months",
      organizationSize: "50–149 people",
      respondentRole: "Executive leader"
    },
    responses: Object.fromEntries(questionnaire.items.map(item => [item.id, item.reverse ? 2 : 4]))
  }, {
    id: "223e4567-e89b-42d3-a456-426614174000",
    completedAt: "2026-08-08T00:00:00.000Z"
  });
}

function profile() {
  return {
    schemaVersion: "2.0.0",
    profileId: "123e4567-e89b-42d3-a456-426614174000",
    createdAt: "2026-08-08T00:00:00.000Z",
    updatedAt: "2026-08-08T00:00:00.000Z",
    expiresAt: "2027-08-08T00:00:00.000Z",
    displayLabel: "Capacity Signal Brief · Aug 8, 2026",
    signalInstances: [result()]
  };
}

test("v2 private profile contains the brief without individual responses or legacy scores", () => {
  const value = profile();
  assert.equal(validateSavedProfile(value), true);
  const serialized = JSON.stringify(value);
  assert.doesNotMatch(serialized, /"responses"|domainScores|overallIndex|primaryConstraintIds/);
});

test("v2 private profile round trips through the existing ciphertext-only envelope", async () => {
  const value = profile();
  const encrypted = await encryptSavedProfile(value, {
    baseUrl: "https://example.com/saved-capacity-signal.html",
    now: new Date(value.updatedAt),
    expiresAt: new Date(value.expiresAt),
    secret: Uint8Array.from({ length: 32 }, (_, index) => index),
    iv: Uint8Array.from({ length: 12 }, (_, index) => 200 + index)
  });
  const decrypted = await decryptSavedProfile(encrypted.envelope, encrypted.recoveryUrl, new Date("2026-08-09T00:00:00.000Z"));
  assert.deepEqual(decrypted.profile, value);
});

test("v2 private profile rejects individual answers and unsupported fields", () => {
  const withAnswers = structuredClone(profile());
  withAnswers.signalInstances[0].responses = { secret: 5 };
  assert.equal(validateSavedProfile(withAnswers), false);
});
