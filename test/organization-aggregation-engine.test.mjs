import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  aggregateOrganization,
  MINIMUM_ORGANIZATION_COHORT,
  validateOrganizationSubmission
} from "../organization-aggregation-engine.js";
import { illustrativeOrganizationSubmissions } from "../organization-view-demo-data.js";

test("organizational submission, view, and governance contracts parse", async () => {
  const names = ["organization-submission.schema.json", "organization-view.schema.json", "organization-governance.json"];
  const contracts = await Promise.all(names.map(async name => JSON.parse(await readFile(new URL(`../schemas/${name}`, import.meta.url), "utf8"))));
  assert.equal(contracts[0].additionalProperties, false);
  assert.equal(contracts[1].oneOf.length, 3);
  assert.equal(contracts[2].minimumOrganizationCohort, 5);
  assert.equal(contracts[2].subgroupViewsEnabled, false);
});

test("illustrative organizational cohort remains valid and crosses the threshold only at five", () => {
  assert.equal(illustrativeOrganizationSubmissions.every(validateOrganizationSubmission), true);
  assert.equal(aggregateOrganization(illustrativeOrganizationSubmissions.slice(0, 4)).policy, "suppressed");
  const result = aggregateOrganization(illustrativeOrganizationSubmissions);
  assert.equal(result.policy, "aggregate");
  assert.equal(result.primaryConstraintIds[0], "decisions");
  assert.equal(result.domainScores.decisions.perspectivePattern, "widely-varied");
});

function submission(index, decisions, leadership = 60) {
  return {
    submissionId: `123e4567-e89b-42d3-${index % 2 ? "a" : "b"}456-${String(index).padStart(12, "0")}`,
    completedAt: `2026-07-${String(10 + index).padStart(2, "0")}T12:00:00.000Z`,
    assessmentVersion: "1.0.0",
    scoringVersion: "0.1.0",
    domainScores: { leadership, decisions, rhythm: 65, alignment: 70, technology: 68, culture: 72 },
    overallIndex: 62,
    interpretationBand: "Developing",
    primaryConstraintIds: ["decisions"]
  };
}

test("suppresses every organizational score below five participants", () => {
  const result = aggregateOrganization([submission(1, 35), submission(2, 45), submission(3, 55), submission(4, 65)]);
  assert.equal(MINIMUM_ORGANIZATION_COHORT, 5);
  assert.deepEqual(Object.keys(result), ["policy", "aggregationVersion", "participantCount", "minimumRequired", "remaining", "reason"]);
  assert.equal(result.policy, "suppressed");
  assert.equal(result.remaining, 1);
  assert.equal(JSON.stringify(result).includes("domainScores"), false);
});

test("creates only aggregate means and categorical perspective patterns at threshold", () => {
  const result = aggregateOrganization([
    submission(1, 20),
    submission(2, 35),
    submission(3, 50),
    submission(4, 65),
    submission(5, 80)
  ]);
  assert.equal(result.policy, "aggregate");
  assert.equal(result.domainScores.decisions.mean, 50);
  assert.equal(result.domainScores.decisions.perspectivePattern, "widely-varied");
  assert.equal(result.domainScores.leadership.perspectivePattern, "closely-aligned");
  assert.deepEqual(result.primaryConstraintIds, ["decisions"]);
  assert.equal(JSON.stringify(result).includes("submissionId"), false);
});

test("suppresses numeric aggregation across incompatible versions", () => {
  const submissions = [1, 2, 3, 4, 5].map(index => submission(index, 50));
  submissions[4].scoringVersion = "0.2.0";
  const result = aggregateOrganization(submissions);
  assert.equal(result.policy, "incompatible-versions");
  assert.equal(JSON.stringify(result).includes("domainScores"), false);
});

test("rejects duplicates, malformed fields, and attempts to lower the privacy threshold", () => {
  const submissions = [1, 2, 3, 4, 5].map(index => submission(index, 50));
  assert.equal(validateOrganizationSubmission(submissions[0]), true);
  assert.equal(validateOrganizationSubmission({ ...submissions[0], respondentName: "Leader" }), false);
  assert.throws(() => aggregateOrganization([submissions[0], submissions[0], ...submissions.slice(2)]), /Duplicate/);
  assert.throws(() => aggregateOrganization(submissions, { minimumRequired: 3 }), /cannot be lower/);
});
