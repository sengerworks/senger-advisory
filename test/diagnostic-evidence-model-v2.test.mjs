import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { approveTypedEvidence, createCompensationObservation, createFormalLivedEvidence, createMechanismEvidence, diagnosticEvidenceModelPolicy } from "../diagnostic-evidence-model-v2.js";

const now = new Date("2026-08-07T12:00:00.000Z");
const evidence = [
  { evidenceId: "evidence-1", reviewStatus: "approved" },
  { evidenceId: "evidence-2", reviewStatus: "approved" },
  { evidenceId: "evidence-pending", reviewStatus: "pending" }
];
const common = {
  diagnosticId: "diagnostic-1", frameId: "frame-1",
  statement: "Routine cross-functional decisions return to senior leaders when commercial and platform priorities conflict.",
  consequence: "Work waits, release commitments move, and executive attention substitutes for operating clarity.",
  perspectivePattern: "convergent", supportingEvidenceIds: ["evidence-1"], weakeningEvidenceIds: ["evidence-2"],
  confidence: "moderate", confidenceBasis: "Approved records support the sequence while one record weakens the breadth of the claim."
};

test("represents mechanisms as evidence-linked operating relationships rather than scores", () => {
  const record = createMechanismEvidence({ ...common, mechanismIds: ["authority-accountability", "priority-attention"], complexityDimensions: ["interdependence", "uncertainty"], interactionStatement: "Unclear authority causes priority conflicts to consume senior attention and delay coordination." }, evidence, { now, id: "typed-1" });
  assert.equal(record.evidenceType, "mechanism");
  assert.equal(record.mechanismIds.length, 2);
  assert.equal("score" in record, false);
});

test("preserves compensation and formal-versus-lived behavior as distinct evidence types", () => {
  const compensation = createCompensationObservation({ ...common, compensationType: "senior-escalation", performancePreserved: "Senior intervention keeps strategic accounts moving despite unresolved operating ambiguity.", mechanismIds: ["authority-accountability"], sustainabilityRisk: "The pattern consumes scarce executive attention and cannot scale with transaction volume.", concentrationRisk: "Resolution depends on two executives.", leadershipRecognition: "partially-recognized" }, evidence, { now });
  const divergence = createFormalLivedEvidence({ ...common, mechanismIds: ["authority-accountability"], formalExpectation: "Functional leaders own decisions beneath the published threshold.", observedBehavior: "Teams still return qualifying decisions to the executive group for informal permission.", rewardOrConsequence: "Escalation feels safer than exercising delegated authority.", divergence: "material" }, evidence, { now });
  assert.equal(compensation.evidenceType, "compensation");
  assert.equal(divergence.evidenceType, "formal-lived");
});

test("rejects pending source evidence and records method approval", () => {
  assert.throws(() => createMechanismEvidence({ ...common, supportingEvidenceIds: ["evidence-pending"], mechanismIds: ["coordination"], complexityDimensions: [], interactionStatement: "Coordination strain causes teams to reconstruct information before action can begin." }, evidence, { now }), /approved de-identified evidence/);
  const draft = createMechanismEvidence({ ...common, mechanismIds: ["coordination"], complexityDimensions: [], interactionStatement: "Coordination strain causes teams to reconstruct information before action can begin." }, evidence, { now });
  const approved = approveTypedEvidence(draft, { methodReviewerType: "human", reviewNote: "The statement is traceable, bounded, and appropriately qualified." }, { now });
  assert.equal(approved.status, "approved");
});

test("machine-readable evidence model matches policy", async () => {
  const contract = JSON.parse(await readFile(new URL("../schemas/diagnostic-evidence-v2.json", import.meta.url), "utf8"));
  assert.equal(contract.evidenceModelVersion, diagnosticEvidenceModelPolicy.evidenceModelVersion);
  assert.deepEqual(contract.mechanisms, diagnosticEvidenceModelPolicy.mechanisms);
  assert.equal(contract.governance.mechanismScoresProduced, false);
  assert.equal(contract.governance.approvedDeidentifiedEvidenceRequired, true);
});
