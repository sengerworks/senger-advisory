import test from "node:test";
import assert from "node:assert/strict";
import { validateEvidencePayload } from "../netlify/lib/evidence-schema.mjs";

const common = {
  sessionId: "123e4567-e89b-42d3-a456-426614174000",
  assessmentVersion: "1.0.0",
  scoringVersion: "0.1.0",
  website: ""
};

test("accepts an aggregate completion without individual answers", () => {
  const result = validateEvidencePayload({
    ...common,
    event: "completion",
    scores: { leadership: 50, decisions: 75, rhythm: 50, alignment: 75, technology: 25, culture: 50 },
    overall: 50,
    band: "Strained",
    context: { organizationSize: "25–49 people", respondentRole: "Executive leader", growthPressure: "High" },
    durationSeconds: 240
  });
  assert.equal(result.ok, true);
  assert.equal("responses" in result.value, false);
});

test("rejects individual answers and unexpected fields", () => {
  const result = validateEvidencePayload({ ...common, event: "start", responses: [1, 2, 3] });
  assert.deepEqual(result, { ok: false, error: "Unexpected data." });
});

test("rejects invalid scores, versions, feedback, and honeypot submissions", () => {
  assert.equal(validateEvidencePayload({ ...common, event: "completion", scores: {}, overall: 50, band: "Strained", context: {}, durationSeconds: 10 }).ok, false);
  assert.equal(validateEvidencePayload({ ...common, event: "start", scoringVersion: "9.0" }).ok, false);
  assert.equal(validateEvidencePayload({ ...common, event: "feedback", accuracy: 0, feedback: "" }).ok, false);
  assert.equal(validateEvidencePayload({ ...common, event: "start", website: "bot" }).ok, false);
});

test("accepts lifecycle and optional feedback events", () => {
  assert.equal(validateEvidencePayload({ ...common, event: "start" }).ok, true);
  assert.equal(validateEvidencePayload({ ...common, event: "abandonment", lastDomain: 3, durationSeconds: 95 }).ok, true);
  assert.equal(validateEvidencePayload({ ...common, event: "report_action", durationSeconds: 330 }).ok, true);
  assert.equal(validateEvidencePayload({ ...common, event: "feedback", accuracy: 4, feedback: "Directionally accurate." }).ok, true);
});
