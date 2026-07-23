import { getStore } from "@netlify/blobs";
import {
  accessIdForCapability,
  validateEnvelopeWindow,
  validateSavedResultsPayload
} from "../lib/saved-results-schema.mjs";

const STORE_NAME = "capacity-saved-results";
const responseHeaders = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff"
};

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: responseHeaders });
}

function storageKey(capability) {
  return `profiles/${accessIdForCapability(capability)}`;
}

function metadataFor(envelope, now, existing = null) {
  return {
    envelopeVersion: envelope.envelopeVersion,
    expiresAt: envelope.expiresAt,
    serverCreatedAt: existing?.serverCreatedAt || new Date(now).toISOString(),
    serverUpdatedAt: new Date(now).toISOString()
  };
}

async function readCurrent(store, key, now) {
  const entry = await store.getWithMetadata(key, { consistency: "strong", type: "json" });
  if (entry === null) return { state: "missing" };
  const expiresAt = entry.metadata?.expiresAt || entry.data?.expiresAt;
  if (!expiresAt || Date.parse(expiresAt) <= now) {
    await store.delete(key);
    return { state: "expired" };
  }
  return { state: "active", entry };
}

export function createSavedResultsHandler({ getStoreImpl = getStore, nowImpl = () => Date.now() } = {}) {
  return async request => {
    if (request.method !== "POST") return json(405, { error: "Method not allowed." });
    const origin = request.headers.get("origin");
    if (!origin || origin !== new URL(request.url).origin) return json(403, { error: "Origin not allowed." });

    const declaredLength = Number(request.headers.get("content-length") || 0);
    if (declaredLength > 150000) return json(413, { error: "Payload too large." });

    let payload;
    try {
      const body = await request.text();
      if (body.length > 150000) return json(413, { error: "Payload too large." });
      payload = JSON.parse(body);
    } catch {
      return json(400, { error: "Invalid JSON." });
    }

    const now = nowImpl();
    const validated = validateSavedResultsPayload(payload, now);
    if (!validated.ok) return json(400, { error: validated.error });
    const data = validated.value;
    const store = getStoreImpl({ name: STORE_NAME, consistency: "strong" });
    const key = storageKey(data.authenticationCapability);

    try {
      if (data.action === "create") {
        const result = await store.setJSON(key, data.envelope, {
          metadata: metadataFor(data.envelope, now),
          onlyIfNew: true
        });
        if (!result.modified) return json(409, { error: "A saved result already exists for this recovery link." });
        return json(201, { saved: true, etag: result.etag, expiresAt: data.envelope.expiresAt });
      }

      if (data.action === "read") {
        const current = await readCurrent(store, key, now);
        if (current.state === "expired") return json(410, { error: "This saved result has expired." });
        if (current.state !== "active") return json(404, { error: "Saved result unavailable." });
        return json(200, { envelope: current.entry.data, etag: current.entry.etag, expiresAt: current.entry.metadata.expiresAt });
      }

      if (data.action === "update") {
        const current = await readCurrent(store, key, now);
        if (current.state !== "active") return json(current.state === "expired" ? 410 : 404, { error: "Saved result unavailable." });
        if (!validateEnvelopeWindow(data.envelope, now, current.entry.data.createdAt)) return json(400, { error: "Invalid encrypted envelope." });
        const result = await store.setJSON(key, data.envelope, {
          metadata: metadataFor(data.envelope, now, current.entry.metadata),
          onlyIfMatch: data.expectedEtag
        });
        if (!result.modified) return json(409, { error: "This saved result changed in another session. Reopen it before updating." });
        return json(200, { saved: true, etag: result.etag, expiresAt: data.envelope.expiresAt });
      }

      if (data.action === "rotate") {
        const current = await readCurrent(store, key, now);
        if (current.state !== "active") return json(current.state === "expired" ? 410 : 404, { error: "Saved result unavailable." });
        if (!validateEnvelopeWindow(data.envelope, now, current.entry.data.createdAt)) return json(400, { error: "Invalid encrypted envelope." });
        const newKey = storageKey(data.newAuthenticationCapability);
        const created = await store.setJSON(newKey, data.envelope, {
          metadata: metadataFor(data.envelope, now, current.entry.metadata),
          onlyIfNew: true
        });
        if (!created.modified) return json(409, { error: "Unable to rotate this recovery link." });
        try {
          await store.delete(key);
        } catch (error) {
          await store.delete(newKey);
          throw error;
        }
        return json(200, { rotated: true, etag: created.etag, expiresAt: data.envelope.expiresAt });
      }

      await store.delete(key);
      return json(200, { deleted: true });
    } catch (error) {
      console.error("Private saved-results operation failed", error instanceof Error ? error.message : "Unknown error");
      return json(503, { error: "Private saved-results storage is temporarily unavailable." });
    }
  };
}

export default createSavedResultsHandler();

export const config = {
  path: "/api/private-results",
  rateLimit: {
    windowLimit: 60,
    windowSize: 60,
    aggregateBy: ["ip", "domain"]
  }
};
