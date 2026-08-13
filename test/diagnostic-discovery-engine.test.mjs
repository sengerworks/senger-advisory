import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  acceptPerspectiveGap,
  approveDiagnosticContextBrief,
  approveParticipantPlan,
  createDiagnosticContextBrief,
  createParticipantPlan,
  diagnosticDiscovery,
  evaluatePerspectiveCoverage
} from "../diagnostic-discovery-engine.js";

const now = new Date("2026-07-29T12:00:00.000Z");
const diagnosticId = "123e4567-e89b-42d3-a456-426614174000";

const contextValues = {
  diagnosticId,
  organizationSizeBand: "50-149",
  organizationHeadcount: 120,
  sponsorPerspective: "founder-ceo",
  sponsorRoleTitle: "Founder and CEO",
  sponsorOrganizationalLevel: "enterprise",
  sponsorFunction: "enterprise-leadership",
  sponsorResponsibility: "Enterprise strategy, operating performance, and leadership decisions.",
  industry: "professional-services",
  businessModel: "b2b",
  operatingEnvironment: "multi-location",
  organizationOffering: "Advisory and implementation services for growing businesses.",
  diagnosticScopeType: "enterprise",
  diagnosticScopeName: "The enterprise operating system",
  diagnosticScopeHeadcount: 120,
  diagnosticScopeBoundary: "All functions responsible for entering and serving the second market.",
  crossBoundaryDependencies: "Commercial commitments, delivery capacity, and founder decision rights.",
  guidanceSessionScheduledFor: "2026-07-29T11:00:00.000Z",
  guidanceSessionAcknowledged: true,
  organizationContext: "A growing services organization is adding a second market.",
  strategicPriority: "Enter the second market without slowing current delivery.",
  triggeringConcern: "Routine decisions increasingly return to the founders.",
  decisionsAtRisk: "Market-entry sequencing and client delivery commitments.",
  recentChanges: ["A new operating leader joined this quarter."],
  priorInterventions: ["The leadership team introduced a weekly coordination meeting."],
  knownSensitivities: "Avoid attributing the issue to any individual leader.",
  decisionNeeded: "Determine which operating constraint to address before hiring another layer."
};

const planValues = {
  diagnosticId,
  targetLeadershipLevels: ["enterprise", "functional", "operational"],
  targetExecutionProximities: ["strategy", "coordination", "delivery"],
  targetFunctionalLenses: ["executive-leadership", "operations", "commercial"],
  participantSlots: [
    { slotId: "slot-1", leadershipLevel: "enterprise", executionProximity: "strategy", functionalLens: "executive-leadership" },
    { slotId: "slot-2", leadershipLevel: "functional", executionProximity: "coordination", functionalLens: "operations" },
    { slotId: "slot-3", leadershipLevel: "operational", executionProximity: "delivery", functionalLens: "commercial" }
  ]
};

test("creates and explicitly approves a bounded Diagnostic Context Brief", () => {
  const brief = createDiagnosticContextBrief(contextValues, { now, id: "brief-1" });
  assert.equal(brief.status, "draft");
  assert.equal(brief.sponsorPerspective, "founder-ceo");
  assert.equal(brief.diagnosticScopeType, "enterprise");
  assert.equal(brief.organizationOffering, contextValues.organizationOffering);
  const approved = approveDiagnosticContextBrief(brief, { approvalNote: "Sponsor confirmed the context." }, { now });
  assert.equal(approved.status, "approved");
  assert.equal(approved.approvedAt, now.toISOString());
  assert.throws(() => approveDiagnosticContextBrief(approved, {}, { now }), /draft/);
});

test("captures a substantive but bounded sponsor accountability narrative",()=>{const narrative="A".repeat(2000);assert.equal(createDiagnosticContextBrief({...contextValues,sponsorResponsibility:narrative},{id:"00000000-0000-4000-8000-000000000001",now:new Date(0)}).sponsorResponsibility.length,2000);assert.throws(()=>createDiagnosticContextBrief({...contextValues,sponsorResponsibility:`${narrative}A`}),/2000 characters or fewer/);});
test("preserves a substantive sponsor interpretation note",()=>{const draft=createDiagnosticContextBrief(contextValues,{id:"00000000-0000-4000-8000-000000000001",now:new Date(0)}),note="A".repeat(2000);assert.equal(approveDiagnosticContextBrief(draft,{approvalNote:note},{now:new Date(0)}).approvalNote.length,2000);assert.throws(()=>approveDiagnosticContextBrief(draft,{approvalNote:`${note}A`},{now:new Date(0)}),/2000 characters or fewer/);});
test("preserves enterprise and scoped headcount context",()=>{const focused=createDiagnosticContextBrief({...contextValues,diagnosticScopeType:"function",diagnosticScopeName:"Sales",diagnosticScopeHeadcount:24});assert.equal(focused.organizationHeadcount,120);assert.equal(focused.diagnosticScopeHeadcount,24);assert.throws(()=>createDiagnosticContextBrief({...contextValues,diagnosticScopeType:"function",diagnosticScopeHeadcount:121}),/cannot exceed/);assert.throws(()=>createDiagnosticContextBrief({...contextValues,diagnosticScopeHeadcount:119}),/enterprise diagnostic/);});

test("rejects unsupported context fields and unbounded sponsor content", () => {
  assert.throws(() => createDiagnosticContextBrief({ ...contextValues, sponsorEmail: "sponsor@example.com" }, { now }), /unsupported fields/);
  assert.throws(() => createDiagnosticContextBrief({ ...contextValues, triggeringConcern: "" }, { now }), /Triggering concern/);
  assert.throws(() => createDiagnosticContextBrief({ ...contextValues, diagnosticScopeBoundary: "" }, { now }), /scope boundary/i);
  const withoutSessionConfirmation = createDiagnosticContextBrief({ ...contextValues, guidanceSessionScheduledFor: "", guidanceSessionAcknowledged: false }, { now });
  assert.equal(withoutSessionConfirmation.guidanceSessionScheduledFor, null);
  assert.equal(withoutSessionConfirmation.guidanceSessionAcknowledged, false);
  assert.throws(() => createDiagnosticContextBrief({ ...contextValues, recentChanges: Array(13).fill("Change") }, { now }), /at most 12/);
});

test("approves a participant plan when its declared perspective objectives are covered", () => {
  const plan = createParticipantPlan(planValues, { now, id: "plan-1" });
  assert.deepEqual(evaluatePerspectiveCoverage(plan), { covered: true, missing: [], unresolved: [], accepted: [] });
  const approved = approveParticipantPlan(plan, { approvalNote: "Coverage reflects the operating system." }, { now });
  assert.equal(approved.status, "approved");
  assert.equal(approved.participantSlots.some((slot) => "email" in slot || "name" in slot), false);
});

test("blocks homogeneous participant plans until coverage gaps are resolved or explicitly accepted", () => {
  let plan = createParticipantPlan({
    ...planValues,
    participantSlots: [
      { slotId: "slot-1", leadershipLevel: "enterprise", executionProximity: "strategy", functionalLens: "executive-leadership" }
    ]
  }, { now, id: "plan-2" });
  const initial = evaluatePerspectiveCoverage(plan);
  assert.equal(initial.covered, false);
  assert.equal(initial.unresolved.includes("executionProximities:delivery"), true);
  assert.throws(() => approveParticipantPlan(plan, {}, { now }), /coverage gap/);
  for (const gapId of initial.missing) {
    plan = acceptPerspectiveGap(plan, { gapId, reason: "The POC sponsor accepted this documented limitation." }, { now });
  }
  assert.equal(evaluatePerspectiveCoverage(plan).unresolved.length, 0);
  assert.equal(approveParticipantPlan(plan, {}, { now }).status, "approved");
});

test("machine-readable discovery contract matches the implementation and fixes no qualitative threshold", async () => {
  const contract = JSON.parse(await readFile(new URL("../schemas/diagnostic-discovery.json", import.meta.url), "utf8"));
  assert.equal(contract.discoveryVersion, diagnosticDiscovery.version);
  assert.deepEqual(contract.participantPlan.leadershipLevels, diagnosticDiscovery.leadershipLevels);
  assert.equal(contract.participantPlan.fixedParticipantMinimum, null);
  assert.equal(contract.participantPlan.participantIdentityStoredInPlan, false);
  assert.equal(contract.contextBrief.guidanceSessionSchedulingTrackedSeparately, true);
});
