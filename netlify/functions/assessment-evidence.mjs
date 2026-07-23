import { getStore } from "@netlify/blobs";
import { validateEvidencePayload } from "../lib/evidence-schema.mjs";

const responseHeaders = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff"
};

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: responseHeaders });
}

export default async request => {
  if (request.method !== "POST") return json(405, { error: "Method not allowed." });

  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return json(403, { error: "Origin not allowed." });

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > 16384) return json(413, { error: "Payload too large." });

  let payload;
  try {
    const body = await request.text();
    if (body.length > 16384) return json(413, { error: "Payload too large." });
    payload = JSON.parse(body);
  } catch {
    return json(400, { error: "Invalid JSON." });
  }

  const validated = validateEvidencePayload(payload);
  if (!validated.ok) return json(400, { error: validated.error });

  const receivedAt = new Date().toISOString();
  const eventId = crypto.randomUUID();
  const record = { id: eventId, receivedAt, ...validated.value };
  const key = `${receivedAt.slice(0, 10)}/${eventId}`;

  try {
    const store = getStore("assessment-evidence");
    await store.setJSON(key, record, {
      metadata: { event: record.event, assessmentVersion: record.assessmentVersion },
      onlyIfNew: true
    });
  } catch (error) {
    console.error("Assessment evidence write failed", error instanceof Error ? error.message : "Unknown error");
    return json(503, { error: "Evidence storage is temporarily unavailable." });
  }

  return json(202, { accepted: true });
};
