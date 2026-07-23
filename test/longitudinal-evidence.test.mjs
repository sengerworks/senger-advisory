import test from "node:test";
import assert from "node:assert/strict";
import { createLongitudinalEvidenceHandler } from "../netlify/functions/longitudinal-evidence.mjs";
import { validateLongitudinalPayload } from "../netlify/lib/longitudinal-evidence-schema.mjs";
import { longitudinalProjection } from "../longitudinal-evidence-client.js";

const origin = "https://example.com";
const subjectId = "123e4567-e89b-42d3-a456-426614174000";
const eventId = "223e4567-e89b-42d3-a456-426614174000";
const capability = "sVSm-KOJ0lU_UQmHI8PkkRHoQzJczlMzCkqE1uMm08k";

function profile() {
  return {
    profileId: "private-id",
    assessmentInstances: [{
      assessmentInstanceId: "private-assessment-id",
      completedAt: "2026-07-23T12:00:00.000Z",
      assessmentVersion: "1.0.0",
      scoringVersion: "0.1.0",
      reportVersion: "1.0.0",
      contextVersion: "1.0.0",
      context: { organizationSize: "25–49 people", respondentRole: "Executive leader", growthPressure: "High" },
      domainScores: { leadership: 50, decisions: 50, rhythm: 50, alignment: 50, technology: 50, culture: 50 },
      overallIndex: 50,
      interpretationBand: "Strained",
      primaryConstraintIds: ["leadership"],
      accuracyRating: null
    }],
    outcomeSnapshots: [],
    changeRecords: [{
      changeRecordId: "private-change-id",
      startedAt: "2026-07-01T12:00:00.000Z",
      endedAt: null,
      category: "technology",
      targetDomainIds: ["technology"],
      magnitude: "material",
      status: "active",
      note: "private note"
    }]
  };
}

function fakeStore() {
  const entries = new Map();
  return {
    entries,
    async setJSON(key, data, options = {}) {
      if (options.onlyIfNew && entries.has(key)) return { modified: false };
      entries.set(key, structuredClone(data));
      return { modified: true, etag: `"${entries.size}"` };
    },
    async get(key) {
      return entries.has(key) ? structuredClone(entries.get(key)) : null;
    },
    async delete(key) { entries.delete(key); },
    async list({ prefix }) {
      return { blobs: [...entries.keys()].filter(key => key.startsWith(prefix)).map(key => ({ key })) };
    }
  };
}

function payload(action, extra = {}) {
  return { action, subjectId, withdrawalCapability: capability, website: "", ...extra };
}

function request(body, requestOrigin = origin) {
  return new Request(`${origin}/api/longitudinal-evidence`, {
    method: "POST",
    headers: { origin: requestOrigin, "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("creates a minimized projection without private identifiers, notes, or answers", () => {
  const projection = longitudinalProjection(profile());
  const serialized = JSON.stringify(projection);
  assert.equal(serialized.includes("private-id"), false);
  assert.equal(serialized.includes("private note"), false);
  assert.equal(serialized.includes("assessmentInstanceId"), false);
  assert.equal(projection.assessments[0].overallIndex, 50);
});

test("validates exact longitudinal grant and contribution contracts", () => {
  const projection = longitudinalProjection(profile());
  assert.equal(validateLongitudinalPayload(payload("grant", { consentVersion: "1.0.0", productVersion: "0.1.0" })).ok, true);
  assert.equal(validateLongitudinalPayload(payload("contribute", { consentVersion: "1.0.0", eventId, projection })).ok, true);
  assert.equal(validateLongitudinalPayload(payload("contribute", { consentVersion: "1.0.0", eventId, projection, recoverySecret: "forbidden" })).ok, false);
  assert.equal(validateLongitudinalPayload(payload("contribute", { consentVersion: "1.0.0", eventId, projection: { ...projection, privateNote: "forbidden" } })).ok, false);
});

test("grants, contributes, withdraws, and deletes subject-level events", async () => {
  const stores = new Map([
    ["capacity-consent-receipts", fakeStore()],
    ["capacity-longitudinal-evidence", fakeStore()]
  ]);
  const handler = createLongitudinalEvidenceHandler({
    getStoreImpl: name => stores.get(name),
    nowImpl: () => new Date("2026-07-23T12:00:00.000Z"),
    uuidImpl: () => "323e4567-e89b-42d3-a456-426614174000"
  });
  const grant = await handler(request(payload("grant", { consentVersion: "1.0.0", productVersion: "0.1.0" })));
  assert.equal(grant.status, 201);
  const contribute = await handler(request(payload("contribute", {
    consentVersion: "1.0.0",
    eventId,
    projection: longitudinalProjection(profile())
  })));
  assert.equal(contribute.status, 202);
  assert.equal(stores.get("capacity-longitudinal-evidence").entries.size, 1);
  const withdraw = await handler(request(payload("withdraw")));
  assert.equal(withdraw.status, 200);
  assert.equal(stores.get("capacity-longitudinal-evidence").entries.size, 0);
  assert.equal((await handler(request(payload("contribute", {
    consentVersion: "1.0.0",
    eventId: "423e4567-e89b-42d3-a456-426614174000",
    projection: longitudinalProjection(profile())
  })))).status, 404);
});

test("rejects cross-origin, malformed, and unauthorized requests", async () => {
  const stores = new Map([
    ["capacity-consent-receipts", fakeStore()],
    ["capacity-longitudinal-evidence", fakeStore()]
  ]);
  const handler = createLongitudinalEvidenceHandler({ getStoreImpl: name => stores.get(name) });
  assert.equal((await handler(new Request(`${origin}/api/longitudinal-evidence`))).status, 405);
  assert.equal((await handler(request(payload("withdraw"), "https://other.example"))).status, 403);
  assert.equal((await handler(request(payload("withdraw")))).status, 404);
});
