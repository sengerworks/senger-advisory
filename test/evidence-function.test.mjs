import test from "node:test";
import assert from "node:assert/strict";
import handler from "../netlify/functions/assessment-evidence.mjs";

test("allows POST only", async () => {
  const response = await handler(new Request("https://example.com/.netlify/functions/assessment-evidence"));
  assert.equal(response.status, 405);
});

test("rejects requests without a matching same-origin header", async () => {
  const missing = await handler(new Request("https://example.com/.netlify/functions/assessment-evidence", {
    method: "POST",
    body: "{}"
  }));
  const crossOrigin = await handler(new Request("https://example.com/.netlify/functions/assessment-evidence", {
    method: "POST",
    headers: { origin: "https://other.example" },
    body: "{}"
  }));
  assert.equal(missing.status, 403);
  assert.equal(crossOrigin.status, 403);
});

test("rejects malformed same-origin JSON without reaching storage", async () => {
  const response = await handler(new Request("https://example.com/.netlify/functions/assessment-evidence", {
    method: "POST",
    headers: { origin: "https://example.com", "content-type": "application/json" },
    body: "not-json"
  }));
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Invalid JSON." });
});
