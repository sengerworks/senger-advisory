import { createHash } from "node:crypto";
import { getStore } from "@netlify/blobs";
import { validateLongitudinalPayload } from "../lib/longitudinal-evidence-schema.mjs";

const EVIDENCE_STORE = "capacity-longitudinal-evidence";
const RECEIPT_STORE = "capacity-consent-receipts";
const headers = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff"
};
const json = (status, body) => new Response(JSON.stringify(body), { status, headers });
const digest = value => createHash("sha256").update(Buffer.from(value, "base64url")).digest("base64url");

async function deleteSubjectEvents(store, subjectId) {
  let cursor;
  do {
    const page = await store.list({ prefix: `${subjectId}/`, cursor });
    await Promise.all(page.blobs.map(blob => store.delete(blob.key)));
    cursor = page.next_cursor;
  } while (cursor);
}

export function createLongitudinalEvidenceHandler({ getStoreImpl = getStore, nowImpl = () => new Date(), uuidImpl = () => crypto.randomUUID() } = {}) {
  return async request => {
    if (request.method !== "POST") return json(405, { error: "Method not allowed." });
    const origin = request.headers.get("origin");
    if (!origin || origin !== new URL(request.url).origin) return json(403, { error: "Origin not allowed." });
    if (Number(request.headers.get("content-length") || 0) > 100000) return json(413, { error: "Payload too large." });
    let payload;
    try {
      const body = await request.text();
      if (body.length > 100000) return json(413, { error: "Payload too large." });
      payload = JSON.parse(body);
    } catch {
      return json(400, { error: "Invalid JSON." });
    }
    const validated = validateLongitudinalPayload(payload);
    if (!validated.ok) return json(400, { error: validated.error });
    const data = validated.value;
    const receipts = getStoreImpl(RECEIPT_STORE);
    const evidence = getStoreImpl(EVIDENCE_STORE);
    const receiptKey = `subjects/${data.subjectId}`;
    const now = nowImpl().toISOString();

    try {
      if (data.action === "grant") {
        const result = await receipts.setJSON(receiptKey, {
          subjectId: data.subjectId,
          capabilityDigest: digest(data.withdrawalCapability),
          consentVersion: data.consentVersion,
          productVersion: data.productVersion,
          grantedAt: now,
          withdrawnAt: null,
          active: true
        }, { onlyIfNew: true, metadata: { active: true, consentVersion: data.consentVersion } });
        if (!result.modified) return json(409, { error: "Longitudinal participation already exists." });
        return json(201, { granted: true, grantedAt: now });
      }

      const receipt = await receipts.get(receiptKey, { consistency: "strong", type: "json" });
      const authorized = receipt
        && receipt.capabilityDigest === digest(data.withdrawalCapability)
        && receipt.active;
      if (!authorized) return json(404, { error: "Longitudinal participation unavailable." });

      if (data.action === "contribute") {
        const key = `${data.subjectId}/${now.slice(0, 10)}/${data.eventId}`;
        const result = await evidence.setJSON(key, {
          id: uuidImpl(),
          subjectId: data.subjectId,
          receivedAt: now,
          consentVersion: data.consentVersion,
          projection: data.projection
        }, {
          onlyIfNew: true,
          metadata: { subjectId: data.subjectId, consentVersion: data.consentVersion, expiresAt: new Date(Date.parse(now) + 730 * 86400000).toISOString() }
        });
        if (!result.modified) return json(200, { accepted: true, duplicate: true });
        return json(202, { accepted: true, receivedAt: now });
      }

      await deleteSubjectEvents(evidence, data.subjectId);
      await receipts.setJSON(receiptKey, {
        subjectId: data.subjectId,
        capabilityDigest: receipt.capabilityDigest,
        consentVersion: receipt.consentVersion,
        productVersion: receipt.productVersion,
        grantedAt: receipt.grantedAt,
        withdrawnAt: now,
        active: false
      }, { metadata: { active: false, expiresAt: new Date(Date.parse(now) + 90 * 86400000).toISOString() } });
      return json(200, { withdrawn: true, deleted: true, withdrawnAt: now });
    } catch (error) {
      console.error("Longitudinal evidence operation failed", error instanceof Error ? error.message : "Unknown error");
      return json(503, { error: "Longitudinal evidence storage is temporarily unavailable." });
    }
  };
}

export default createLongitudinalEvidenceHandler();

export const config = {
  path: "/api/longitudinal-evidence",
  rateLimit: { windowLimit: 30, windowSize: 60, aggregateBy: ["ip", "domain"] }
};
