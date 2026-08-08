import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { approveDiagnosticFrame, createDiagnosticFrame, diagnosticFramePolicy, evaluateDiagnosticFrame } from "../diagnostic-frame-engine-v2.js";

const now = new Date("2026-08-07T12:00:00.000Z");
const dimensions = ["volume", "variety", "interdependence", "uncertainty", "rate-of-change"];

function values(overrides = {}) {
  return {
    diagnosticId: "diagnostic-1",
    organizationContext: "A growing enterprise must protect platform delivery while integrating more customers, teams, and locations.",
    executionDemand: {
      commitment: "Deliver the next platform release while improving customer reliability and maintaining disciplined commercial growth.",
      successDefinition: "The release ships on time, renewal risk declines, and teams make aligned tradeoffs without repeated executive escalation.",
      failureExposure: "Delayed delivery and unstable service would put renewals, growth expectations, and key-person retention at material risk.",
      timeHorizon: "Next two quarters"
    },
    diagnosticQuestion: "What prevents the operating system from carrying the coordination and decision load required by the platform strategy?",
    leadershipDecision: "Whether to change decision rights, commercial gates, and cross-functional operating routines before the next planning cycle.",
    performanceConsequences: ["Enterprise renewals and the core platform release are exposed to delay and avoidable execution risk."],
    complexityObservations: dimensions.map((dimension, index) => ({
      observationId: `complexity-${index + 1}`,
      source: "Sponsor discovery",
      description: `The organization reports a material increase in ${dimension} that changes the demands placed on execution.` ,
      dimensions: [dimension],
      state: "current",
      classification: index === 3 ? "necessary" : "mixed",
      classificationRationale: "The demand is partly inherent to growth and partly amplified by current operating choices.",
      evidenceRefs: [],
      confidence: "moderate",
      confidenceBasis: "The sponsor supplied a concrete example, but participant evidence has not yet been collected."
    })),
    evidencePlan: {
      sourceTypes: ["sponsor-discovery", "participant-interview", "operating-data"],
      participantSlots: Array.from({ length: 5 }, (_, index) => ({
        slotId: `slot-${index + 1}`,
        leadershipLevel: index ? "functional" : "enterprise",
        executionProximity: index > 2 ? "delivery" : "coordination",
        functionalLens: ["executive-leadership", "operations", "people", "commercial", "product-service"][index]
      })),
      formalArtifactsRequested: ["Decision-rights framework"],
      operatingDataRequested: ["Cross-functional cycle time"],
      acceptedCoverageGaps: []
    },
    outOfScope: ["Individual performance evaluation"],
    knownSensitivities: "Commercial and product leaders disagree about the source of the current execution strain.",
    ...overrides
  };
}

test("creates an execution-demand-specific Diagnostic Frame without capacity scores", () => {
  const frame = createDiagnosticFrame(values(), { now, id: "frame-1" });
  assert.equal(frame.frameVersion, "2.0.0");
  assert.equal(frame.complexityProfile.dimensionsRepresented.length, 5);
  assert.equal("score" in frame || "domainScores" in frame, false);
  assert.equal(evaluateDiagnosticFrame(frame).ready, true);
});

test("requires every missing complexity dimension to have an explicit accepted gap", () => {
  const input = values();
  input.complexityObservations = input.complexityObservations.slice(0, 3);
  let frame = createDiagnosticFrame(input, { now, id: "frame-1" });
  assert.deepEqual(evaluateDiagnosticFrame(frame).unresolvedComplexityDimensions, ["uncertainty", "rate-of-change"]);
  input.evidencePlan.acceptedCoverageGaps = ["complexity-dimension-uncertainty: sponsor could not yet identify observable evidence"];
  frame = createDiagnosticFrame(input, { now, id: "frame-2" });
  assert.deepEqual(evaluateDiagnosticFrame(frame).unresolvedComplexityDimensions, ["rate-of-change"]);
});

test("approves only a ready frame with explicit sponsor confirmations", () => {
  const draft = createDiagnosticFrame(values(), { now, id: "frame-1" });
  assert.throws(() => approveDiagnosticFrame(draft, { approvalNote: "Approved for collection after sponsor review.", confirmedExecutionDemand: false, acceptedEvidencePlan: true }, { now }), /requires confirmation/);
  const approved = approveDiagnosticFrame(draft, { approvalNote: "The sponsor confirmed the demand, decision, scope, and evidence plan.", confirmedExecutionDemand: true, acceptedEvidencePlan: true }, { now });
  assert.equal(approved.status, "approved");
});

test("machine-readable Diagnostic Frame contract matches policy", async () => {
  const contract = JSON.parse(await readFile(new URL("../schemas/diagnostic-frame-v2.json", import.meta.url), "utf8"));
  assert.equal(contract.frameVersion, diagnosticFramePolicy.frameVersion);
  assert.deepEqual(contract.complexityDimensions, diagnosticFramePolicy.complexityDimensions);
  assert.equal(contract.governance.capacityForWhatRequired, true);
  assert.equal(contract.governance.sponsorClassificationIsFinal, false);
});
