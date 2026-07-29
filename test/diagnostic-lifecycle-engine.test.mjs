import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createDiagnostic, diagnosticLifecycle, setDiagnosticHumanReview, transitionDiagnostic } from "../diagnostic-lifecycle-engine.js";

const now = new Date("2026-07-29T12:00:00.000Z");
const id = "123e4567-e89b-42d3-a456-426614174000";

function create() {
  return createDiagnostic({
    workspaceId: "123e4567-e89b-42d3-a456-426614174001",
    route: "automated",
    entitlementType: "poc"
  }, { now, id });
}

function move(diagnostic, state, gates) {
  return transitionDiagnostic(diagnostic, state, gates, {
    now,
    reason: `Ready for ${state}.`
  });
}

test("creates a versioned paid or POC diagnostic without treating an assessment as a diagnostic", () => {
  const diagnostic = create();
  assert.equal(diagnostic.lifecycleVersion, "1.0.0");
  assert.equal(diagnostic.state, "draft");
  assert.equal(diagnostic.entitlementType, "poc");
  assert.equal(diagnosticLifecycle.routes.includes("automated"), true);
  assert.throws(() => createDiagnostic({ workspaceId: id, route: "assessment", entitlementType: "poc" }, { now }), /route/);
});

test("machine-readable diagnostic lifecycle contract matches the engine", async () => {
  const contract = JSON.parse(await readFile(new URL("../schemas/diagnostic-lifecycle.json", import.meta.url), "utf8"));
  assert.equal(contract.lifecycleVersion, diagnosticLifecycle.version);
  assert.deepEqual(contract.routes, diagnosticLifecycle.routes);
  assert.equal(contract.principles.assessmentIsDiagnostic, false);
  assert.equal(contract.principles.sameClientOperatingBriefAcrossRoutes, true);
  assert.equal(contract.principles.fixedQualitativeParticipantThreshold, null);
});

test("requires entitlement, context, participant, and protocol gates before collection", () => {
  let diagnostic = create();
  assert.throws(() => move(diagnostic, "discovery", {}), /entitlement/);
  diagnostic = move(diagnostic, "discovery", { entitlementActive: true });
  assert.throws(() => move(diagnostic, "participant-design", {}), /Context Brief/);
  diagnostic = move(diagnostic, "participant-design", { contextBriefApproved: true });
  assert.throws(() => move(diagnostic, "protocol-review", { participantPlanApproved: true }), /coverage/);
  diagnostic = move(diagnostic, "protocol-review", {
    participantPlanApproved: true,
    perspectiveCoverageAccepted: true
  });
  assert.throws(() => move(diagnostic, "collecting", { protocolApproved: true }), /notice/);
  diagnostic = move(diagnostic, "collecting", {
    protocolApproved: true,
    participantNoticeApproved: true
  });
  assert.equal(diagnostic.state, "collecting");
});

test("blocks synthesis until evidence, disclosure, and required human review gates pass", () => {
  let diagnostic = create();
  diagnostic = move(diagnostic, "discovery", { entitlementActive: true });
  diagnostic = move(diagnostic, "participant-design", { contextBriefApproved: true });
  diagnostic = move(diagnostic, "protocol-review", { participantPlanApproved: true, perspectiveCoverageAccepted: true });
  diagnostic = move(diagnostic, "collecting", { protocolApproved: true, participantNoticeApproved: true });
  diagnostic = move(diagnostic, "evidence-review", { collectionClosed: true, participationPlanSatisfied: true });
  diagnostic = setDiagnosticHumanReview(diagnostic, "required", { now });
  assert.throws(() => move(diagnostic, "synthesis", {
    deidentificationComplete: true,
    disclosureReviewComplete: true,
    evidenceQualityPassed: true
  }), /human review/);
  diagnostic = setDiagnosticHumanReview(diagnostic, "in-review", { now });
  diagnostic = setDiagnosticHumanReview(diagnostic, "resolved", { now });
  diagnostic = move(diagnostic, "synthesis", {
    deidentificationComplete: true,
    disclosureReviewComplete: true,
    evidenceQualityPassed: true
  });
  assert.equal(diagnostic.state, "synthesis");
});

test("requires validated findings and commercial acceptance before activating the Operating Brief", () => {
  const base = { ...create(), state: "synthesis" };
  let diagnostic = move(base, "leadership-validation", { diagnosticRecordReady: true });
  assert.throws(() => move(diagnostic, "intervention-proposed", { leadershipValidationComplete: true }), /objections/);
  diagnostic = move(diagnostic, "intervention-proposed", {
    leadershipValidationComplete: true,
    constraintHypothesisAccepted: true
  });
  assert.throws(() => move(diagnostic, "intervention-accepted", {
    interventionScopeAccepted: true,
    commercialTermsAccepted: true
  }), /entitlement/);
  diagnostic = move(diagnostic, "intervention-accepted", {
    interventionScopeAccepted: true,
    commercialTermsAccepted: true,
    interventionEntitlementActive: true
  });
  assert.throws(() => move(diagnostic, "active-intervention", {}), /Operating Brief/);
  diagnostic = move(diagnostic, "active-intervention", { operatingBriefReady: true });
  assert.equal(diagnostic.state, "active-intervention");
});

test("records explicit reassessment and closure decisions", () => {
  let diagnostic = { ...create(), state: "active-intervention" };
  diagnostic = move(diagnostic, "reassessment", { reviewDue: true });
  diagnostic = move(diagnostic, "completed", { closureDecisionRecorded: true });
  assert.equal(diagnostic.completedAt, now.toISOString());
  assert.equal(diagnostic.transitionHistory.length, 2);
  assert.throws(() => transitionDiagnostic(diagnostic, "active-intervention", {}, { now, reason: "Skip discovery." }), /cannot move/);
});
