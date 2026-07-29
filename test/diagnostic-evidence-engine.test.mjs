import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  createConstraintHypothesis,
  createDeidentifiedEvidence,
  createEvidenceTheme,
  diagnosticEvidence,
  reviewDeidentifiedEvidence
} from "../diagnostic-evidence-engine.js";

const now = new Date("2026-07-29T12:00:00.000Z");

function evidence(id, overrides = {}) {
  return createDeidentifiedEvidence({
    diagnosticId: "diagnostic-1",
    sourceResponseRef: `source-${id}`,
    sourceQuestionId: "q-04",
    deidentifiedText: "A routine approval returned to senior leadership and delayed client delivery for approximately two weeks.",
    redactionCategories: ["person", "client", "date"],
    disclosureRisk: "medium",
    transformationNote: "Removed the leader, client, and exact date while preserving the operating sequence.",
    ...overrides
  }, { now, id });
}

function approve(record, reviewerType = "automated") {
  return reviewDeidentifiedEvidence(record, {
    reviewerType,
    decision: "approved",
    reviewNote: "The operating meaning is preserved without unnecessary identifying detail."
  }, { now });
}

function theme(id, evidenceRecords, overrides = {}) {
  return createEvidenceTheme({
    diagnosticId: "diagnostic-1",
    title: `Evidence theme ${id}`,
    summary: "Routine decisions repeatedly return to senior leaders, delaying execution and weakening ownership at the operating level.",
    domainIds: ["leadership", "decisions"],
    perspectivePattern: "convergent",
    supportingEvidenceIds: evidenceRecords.slice(0, 2).map((record) => record.evidenceId),
    weakeningEvidenceIds: [],
    confidence: "moderate",
    confidenceBasis: "The pattern appears in multiple approved records, with some variation in the consequences described.",
    ...overrides
  }, evidenceRecords, { now, id });
}

test("creates bounded de-identified evidence without claiming anonymity", () => {
  const record = evidence("evidence-1");
  assert.equal(record.reviewStatus, "pending");
  assert.equal(record.redactionCategories.includes("person"), true);
  assert.equal("respondentName" in record || "respondentEmail" in record, false);
});

test("requires human review before high-risk evidence can enter synthesis", () => {
  const record = evidence("evidence-1", { disclosureRisk: "high" });
  assert.throws(() => approve(record), /human disclosure review/);
  const approved = approve(record, "human");
  assert.equal(approved.reviewStatus, "approved");
  assert.equal(approved.reviewedBy, "human");
});

test("allows themes to reference only approved evidence and requires more than one record", () => {
  const approved = [approve(evidence("evidence-1")), approve(evidence("evidence-2"))];
  const created = theme("theme-1", approved);
  assert.deepEqual(created.supportingEvidenceIds, ["evidence-1", "evidence-2"]);
  assert.throws(() => theme("theme-2", [approved[0]], { supportingEvidenceIds: ["evidence-1"] }), /at least 2/);
  const pending = evidence("evidence-3");
  assert.throws(() => theme("theme-3", [approved[0], pending], { supportingEvidenceIds: ["evidence-1", "evidence-3"] }), /approved/);
});

test("creates a traceable constraint hypothesis with counterevidence, alternatives, and blind spots", () => {
  const evidenceRecords = [
    approve(evidence("evidence-1")),
    approve(evidence("evidence-2")),
    approve(evidence("evidence-3")),
    approve(evidence("evidence-4"))
  ];
  const themes = [
    theme("theme-1", evidenceRecords.slice(0, 2)),
    theme("theme-2", evidenceRecords.slice(2, 4), {
      title: "Decision ownership varies by work type",
      perspectivePattern: "mixed"
    })
  ];
  const hypothesis = createConstraintHypothesis({
    diagnosticId: "diagnostic-1",
    primaryDomainId: "decisions",
    statement: "Decision authority has not evolved with organizational complexity, causing routine work to escalate and wait for senior attention.",
    supportingThemeIds: ["theme-1", "theme-2"],
    weakeningThemeIds: ["theme-2"],
    competingExplanations: [{
      statement: "The delays may be driven primarily by missing information rather than unclear authority.",
      supportingThemeIds: ["theme-2"],
      evidenceNeeded: "Compare delayed decisions with the availability and quality of required operating information."
    }],
    blindSpots: ["The participant plan did not include one frontline delivery perspective."],
    confidence: "moderate",
    confidenceBasis: "Multiple evidence themes support the escalation pattern, while mixed evidence leaves the information-quality explanation plausible.",
    interventionDirection: "Test explicit authority thresholds and decision information requirements before prescribing structural change."
  }, themes, { now, id: "hypothesis-1" });
  assert.equal(hypothesis.status, "draft");
  assert.equal(hypothesis.competingExplanations.length, 1);
  assert.equal(hypothesis.blindSpots.length, 1);
});

test("rejects unsupported evidence fields and untraceable synthesis claims", () => {
  assert.throws(() => createDeidentifiedEvidence({
    diagnosticId: "diagnostic-1",
    sourceResponseRef: "source-1",
    sourceQuestionId: "q-01",
    deidentifiedText: "This record contains enough de-identified operating evidence for review.",
    redactionCategories: [],
    disclosureRisk: "low",
    transformationNote: "No identifying details were present in the source excerpt.",
    respondentEmail: "person@example.com"
  }, { now }), /unsupported fields/);
  const approved = [approve(evidence("evidence-1")), approve(evidence("evidence-2"))];
  assert.throws(() => theme("theme-1", approved, { supportingEvidenceIds: ["evidence-1", "missing"] }), /approved/);
});

test("machine-readable evidence contract matches the implementation", async () => {
  const contract = JSON.parse(await readFile(new URL("../schemas/diagnostic-evidence.json", import.meta.url), "utf8"));
  assert.equal(contract.evidenceVersion, diagnosticEvidence.evidenceVersion);
  assert.equal(contract.synthesisVersion, diagnosticEvidence.synthesisVersion);
  assert.deepEqual(contract.redactionCategories, diagnosticEvidence.redactionCategories);
  assert.deepEqual(contract.theme.perspectivePatterns, diagnosticEvidence.perspectivePatterns);
  assert.equal(contract.deidentificationGuaranteesAnonymity, false);
  assert.equal(contract.highRiskRequiresHumanReview, true);
});
