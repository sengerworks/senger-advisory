import test from "node:test";
import assert from "node:assert/strict";
import { createSavedResultsHandler } from "../netlify/functions/saved-results.mjs";
import { accessIdForCapability, validateSavedResultsPayload } from "../netlify/lib/saved-results-schema.mjs";

const origin = "https://example.com";
const now = Date.parse("2026-07-23T12:00:00.000Z");
const capability = "sVSm-KOJ0lU_UQmHI8PkkRHoQzJczlMzCkqE1uMm08k";
const replacementCapability = "n4iV0GZp2IYp2KqwtY6vP3iJkg3QIdPWuXqGur1oLp8";

function envelope(overrides = {}) {
  return {
    envelopeVersion: "1.0.0",
    cipher: "AES-256-GCM",
    iv: "oKGio6Slpqeoqaqr",
    ciphertext: "A".repeat(64),
    createdAt: "2026-07-23T12:00:00.000Z",
    updatedAt: "2026-07-23T12:00:00.000Z",
    expiresAt: "2027-07-23T12:00:00.000Z",
    ...overrides
  };
}

function fakeStore() {
  const entries = new Map();
  let revision = 0;
  return {
    entries,
    async setJSON(key, data, options = {}) {
      const current = entries.get(key);
      if (options.onlyIfNew && current) return { modified: false };
      if (options.onlyIfMatch && (!current || current.etag !== options.onlyIfMatch)) return { modified: false };
      const etag = `"${++revision}"`;
      entries.set(key, { data: structuredClone(data), metadata: structuredClone(options.metadata || {}), etag });
      return { modified: true, etag };
    },
    async getWithMetadata(key) {
      const entry = entries.get(key);
      return entry ? structuredClone(entry) : null;
    },
    async delete(key) {
      entries.delete(key);
    }
  };
}

function request(payload, requestOrigin = origin) {
  return new Request(`${origin}/api/private-results`, {
    method: "POST",
    headers: { origin: requestOrigin, "content-type": "application/json" },
    body: JSON.stringify({ website: "", ...payload })
  });
}

test("derives the same opaque access ID as the browser test vector", () => {
  assert.equal(accessIdForCapability(capability), "a-6hB2i-j-rFKcwPH8-_oehxcqZoxAu6CKZ_Gnt9NSU");
});

test("rejects plaintext, unexpected fields, malformed capability, and invalid windows", () => {
  assert.equal(validateSavedResultsPayload({ action: "create", authenticationCapability: capability, envelope: envelope(), website: "", profile: { displayLabel: "private" } }, now).ok, false);
  assert.equal(validateSavedResultsPayload({ action: "read", authenticationCapability: "weak", website: "" }, now).ok, false);
  assert.equal(validateSavedResultsPayload({ action: "create", authenticationCapability: capability, envelope: envelope({ expiresAt: "2030-01-01T00:00:00.000Z" }), website: "" }, now).ok, false);
});

test("requires POST and a matching same-origin header", async () => {
  const handler = createSavedResultsHandler({ getStoreImpl: () => fakeStore(), nowImpl: () => now });
  assert.equal((await handler(new Request(`${origin}/api/private-results`))).status, 405);
  assert.equal((await handler(request({ action: "read", authenticationCapability: capability }, "https://other.example"))).status, 403);
});

test("creates, reads, conditionally updates, rotates, and deletes ciphertext", async () => {
  const store = fakeStore();
  const handler = createSavedResultsHandler({ getStoreImpl: () => store, nowImpl: () => now });

  const created = await handler(request({ action: "create", authenticationCapability: capability, envelope: envelope() }));
  const createdBody = await created.json();
  assert.equal(created.status, 201);
  assert.equal(createdBody.saved, true);
  assert.equal(JSON.stringify([...store.entries.values()]).includes("displayLabel"), false);

  const duplicate = await handler(request({ action: "create", authenticationCapability: capability, envelope: envelope() }));
  assert.equal(duplicate.status, 409);

  const read = await handler(request({ action: "read", authenticationCapability: capability }));
  const readBody = await read.json();
  assert.equal(read.status, 200);
  assert.deepEqual(readBody.envelope, envelope());

  const conflict = await handler(request({ action: "update", authenticationCapability: capability, envelope: envelope({ updatedAt: "2026-07-23T12:05:00.000Z" }), expectedEtag: '"wrong"' }));
  assert.equal(conflict.status, 409);

  const updatedEnvelope = envelope({ updatedAt: "2026-07-23T12:05:00.000Z" });
  const updated = await handler(request({ action: "update", authenticationCapability: capability, envelope: updatedEnvelope, expectedEtag: readBody.etag }));
  assert.equal(updated.status, 200);

  const rotatedEnvelope = envelope({ updatedAt: "2026-07-23T12:10:00.000Z" });
  const rotated = await handler(request({ action: "rotate", authenticationCapability: capability, newAuthenticationCapability: replacementCapability, envelope: rotatedEnvelope }));
  assert.equal(rotated.status, 200);
  assert.equal((await handler(request({ action: "read", authenticationCapability: capability }))).status, 404);
  assert.equal((await handler(request({ action: "read", authenticationCapability: replacementCapability }))).status, 200);

  assert.equal((await handler(request({ action: "delete", authenticationCapability: replacementCapability }))).status, 200);
  assert.equal((await handler(request({ action: "read", authenticationCapability: replacementCapability }))).status, 404);
});

test("deletes an expired envelope during a read", async () => {
  const store = fakeStore();
  let clock = now;
  const handler = createSavedResultsHandler({ getStoreImpl: () => store, nowImpl: () => clock });
  assert.equal((await handler(request({ action: "create", authenticationCapability: capability, envelope: envelope() }))).status, 201);
  clock = Date.parse("2027-07-23T12:00:00.001Z");
  assert.equal((await handler(request({ action: "read", authenticationCapability: capability }))).status, 410);
  assert.equal(store.entries.size, 0);
});
