import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { diagnosticQuestionLibraryV2, diagnosticQuestionTemplatesV2, recommendedDiagnosticTemplateIdsV2 } from "../diagnostic-question-library-v2.js";
import { approveDiagnosticProtocolV2, createAdaptiveFollowUpV2, createDiagnosticProtocolV2, diagnosticProtocolPolicyV2, evaluateDiagnosticProtocolV2 } from "../diagnostic-protocol-engine-v2.js";

const now = new Date("2026-08-07T12:00:00.000Z");
const templateById = new Map(diagnosticQuestionTemplatesV2.map(template => [template.id, template]));
const frame = Object.freeze({ frameId: "frame-1", diagnosticId: "diagnostic-1", frameVersion: "2.0.0", status: "approved" });

function values(ids = recommendedDiagnosticTemplateIdsV2) {
  return {
    diagnosticId: "diagnostic-1", frameId: "frame-1",
    questions: ids.map(templateId => ({ templateId, questionText: templateById.get(templateId).question, contextualizationNote: "Canonical wording retained pending frame-specific review." }))
  };
}

test("compiles an eighteen-question evidence-layer-complete protocol without equal mechanism quotas", () => {
  const protocol = createDiagnosticProtocolV2(values(), frame, { now, id: "protocol-1" });
  const readiness = evaluateDiagnosticProtocolV2(protocol, frame);
  assert.equal(protocol.questions.length, 18);
  assert.equal(readiness.ready, true);
  assert.equal(new Set(Object.values(readiness.mechanismCoverage)).size > 1, true);
});

test("binds protocol creation to an approved matching Diagnostic Frame", () => {
  assert.throws(() => createDiagnosticProtocolV2(values(), { ...frame, status: "draft" }, { now }), /approved Diagnostic Frame/);
  assert.throws(() => createDiagnosticProtocolV2({ ...values(), frameId: "frame-other" }, frame, { now }), /must belong/);
});

test("blocks approval when required evidence layers are absent", () => {
  const ids = recommendedDiagnosticTemplateIdsV2.map(id => id === "capacity-compensation" ? "future-demand" : id);
  const protocol = createDiagnosticProtocolV2(values(ids), frame, { now, id: "protocol-1" });
  assert.deepEqual(evaluateDiagnosticProtocolV2(protocol, frame).missingEvidenceLayers, ["compensation"]);
  assert.throws(() => approveDiagnosticProtocolV2(protocol, frame, { approvalNote: "Method review is otherwise complete.", acceptedResearchLimitations: true }, { now }), /required-evidence-layers-missing/);
});

test("requires research-limitation acknowledgement before adaptive evidence probing", () => {
  const draft = createDiagnosticProtocolV2(values(), frame, { now, id: "protocol-1" });
  assert.throws(() => approveDiagnosticProtocolV2(draft, frame, { approvalNote: "Method review completed for this frame.", acceptedResearchLimitations: false }, { now }), /Adaptive Capacity/);
  const protocol = approveDiagnosticProtocolV2(draft, frame, { approvalNote: "Approved as a frame-specific evidence protocol, with the research limitation accepted.", acceptedResearchLimitations: true }, { now });
  const followUp = createAdaptiveFollowUpV2(protocol, { interviewInstanceId: "interview-1", questionId: "q-01", promptType: "interaction", triggerReason: "The answer names a decision issue but does not trace its downstream operating effects." }, [], { now, id: "follow-up-1" });
  assert.match(followUp.promptText, /elsewhere in the operating system/);
});

test("machine-readable protocol contract matches implementation", async () => {
  const contract = JSON.parse(await readFile(new URL("../schemas/diagnostic-protocol-v2.json", import.meta.url), "utf8"));
  assert.equal(contract.protocolVersion, diagnosticProtocolPolicyV2.protocolVersion);
  assert.equal(contract.questionLibraryVersion, diagnosticQuestionLibraryV2.version);
  assert.equal(contract.availableTemplateCount, diagnosticQuestionTemplatesV2.length);
  assert.deepEqual(contract.requiredEvidenceLayers, diagnosticQuestionLibraryV2.requiredEvidenceLayers);
  assert.equal(contract.governance.equalMechanismQuestionCountRequired, false);
});
