import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  acceptInterventionProposal,
  createDiagnosticRecord,
  createInterventionProposal,
  createLeadershipValidation,
  decideLeadershipValidation,
  diagnosticDecision,
  validateDiagnosticRecord
} from "../diagnostic-decision-engine.js";

const now = new Date("2026-07-29T12:00:00.000Z");
const themes = [
  { themeId: "theme-1" },
  { themeId: "theme-2" }
];
const hypothesis = {
  hypothesisId: "hypothesis-1",
  diagnosticId: "diagnostic-1",
  supportingThemeIds: ["theme-1", "theme-2"],
  weakeningThemeIds: ["theme-2"],
  competingExplanations: [{
    statement: "Information quality may explain more of the delay than authority.",
    supportingThemeIds: ["theme-2"],
    evidenceNeeded: "Compare information readiness across delayed decisions."
  }],
  blindSpots: ["A frontline delivery perspective was not included."],
  confidence: "moderate",
  confidenceBasis: "Several themes support escalation as a pattern, while the information-quality explanation remains plausible.",
  interventionDirection: "Test explicit authority and information thresholds before considering structural change."
};

function draftRecord() {
  return createDiagnosticRecord({
    diagnosticId: "diagnostic-1",
    contextBriefId: "brief-1",
    executiveFinding: "Routine decisions return to senior leaders because authority and information expectations have not evolved with complexity.",
    whyNow: "A new market entry will increase the volume and consequence of cross-functional decisions.",
    strategicExposure: "Leadership attention may become the limiting resource for both market entry and existing client delivery.",
    operatingSymptoms: ["Routine approvals repeatedly escalate.", "Delivery teams wait for decisions before committing work."],
    alternativeInterventionsConsidered: ["Add another management layer.", "Introduce a new workflow tool without changing authority."]
  }, hypothesis, themes, { now, id: "record-1" });
}

function acceptedRecord() {
  const record = draftRecord();
  const validation = createLeadershipValidation(record, [{
    validationResponseRef: "response-1",
    resonance: "supports",
    completeness: "complete-enough",
    surprised: false,
    missingEvidence: "",
    materialObjection: false,
    objection: ""
  }], { now, id: "validation-1" });
  const decided = decideLeadershipValidation(validation, {
    decision: "accepted",
    objectionResolutions: [],
    decisionNote: "Leadership accepts the hypothesis as the basis for a bounded intervention test."
  }, { now });
  return validateDiagnosticRecord(record, decided, { now });
}

function proposalValues() {
  return {
    objective: "Reduce routine escalation by clarifying authority and the information required for three recurring decision types.",
    rationale: "The validated diagnostic links execution delay to unclear authority while preserving information quality as a competing explanation.",
    scope: "A 90-day intervention covering three high-volume decision types and their cross-functional handoffs.",
    operatingChanges: ["Publish authority thresholds.", "Define minimum decision-information requirements."],
    commitments: [{ action: "Document and test the three decision pathways.", ownerRole: "Operating leader", timing: "First 30 days" }],
    learningRequirements: ["Decision-rights facilitation guide for participating leaders."],
    evidencePlan: [
      { evidenceClass: "delivery", measure: "Three decision pathways documented and used.", observationCadence: "Weekly" },
      { evidenceClass: "operating-change", measure: "Routine decisions move without unnecessary senior escalation.", observationCadence: "Biweekly" },
      { evidenceClass: "capacity-change", measure: "Reassessment tests whether decision capacity improved.", observationCadence: "At 90 days" }
    ],
    reviewCadence: "Biweekly operating review with a 30-, 60-, and 90-day decision point.",
    duration: "90 days",
    commercialOfferRef: "offer-1"
  };
}

test("creates an evidence-linked diagnostic record with visible uncertainty", () => {
  const record = draftRecord();
  assert.equal(record.status, "draft");
  assert.deepEqual(record.themeIds, ["theme-1", "theme-2"]);
  assert.equal(record.competingExplanations.length, 1);
  assert.equal(record.blindSpots.length, 1);
  assert.equal(record.alternativeInterventionsConsidered.length, 2);
});

test("requires resolution of every material leadership objection before validation", () => {
  const record = draftRecord();
  const validation = createLeadershipValidation(record, [{
    validationResponseRef: "response-1",
    resonance: "challenges",
    completeness: "material-gaps",
    surprised: true,
    missingEvidence: "The operating team sees information delays not represented in the record.",
    materialObjection: true,
    objection: "The hypothesis may overstate authority and understate information quality."
  }], { now, id: "validation-1" });
  assert.throws(() => decideLeadershipValidation(validation, {
    decision: "accepted",
    objectionResolutions: [],
    decisionNote: "Accept without resolving the objection."
  }, { now }), /every material objection/);
  const decided = decideLeadershipValidation(validation, {
    decision: "accepted",
    objectionResolutions: [{
      validationResponseRef: "response-1",
      resolution: "The finding and intervention test now preserve information quality as an explicit competing explanation."
    }],
    decisionNote: "Leadership accepts the revised framing for an intervention test."
  }, { now });
  assert.equal(validateDiagnosticRecord(record, decided, { now }).status, "validated");
});

test("does not create an intervention proposal before leadership validation", () => {
  assert.throws(() => createInterventionProposal(draftRecord(), proposalValues(), { now }), /leadership-validated/);
  const proposal = createInterventionProposal(acceptedRecord(), proposalValues(), { now, id: "proposal-1" });
  assert.equal(proposal.status, "proposed");
  assert.equal(new Set(proposal.evidencePlan.map((item) => item.evidenceClass)).size, 3);
});

test("requires delivery, operating-change, and capacity-change evidence in every intervention", () => {
  const values = proposalValues();
  values.evidencePlan = values.evidencePlan.slice(0, 2);
  assert.throws(() => createInterventionProposal(acceptedRecord(), values, { now }), /capacity-change/);
});

test("requires scope, commercial acceptance, and entitlement before intervention activation", () => {
  const proposal = createInterventionProposal(acceptedRecord(), proposalValues(), { now, id: "proposal-1" });
  assert.throws(() => acceptInterventionProposal(proposal, {
    scopeAccepted: true,
    commercialTermsAccepted: true,
    entitlementActive: false
  }, { now }), /entitlement/);
  const accepted = acceptInterventionProposal(proposal, {
    scopeAccepted: true,
    commercialTermsAccepted: true,
    entitlementActive: true
  }, { now });
  assert.equal(accepted.status, "accepted");
});

test("machine-readable decision contract matches the implementation", async () => {
  const contract = JSON.parse(await readFile(new URL("../schemas/diagnostic-decision.json", import.meta.url), "utf8"));
  assert.equal(contract.diagnosticRecordVersion, diagnosticDecision.diagnosticRecordVersion);
  assert.equal(contract.interventionProposalVersion, diagnosticDecision.interventionProposalVersion);
  assert.deepEqual(contract.interventionProposal.evidenceClassesRequired, diagnosticDecision.evidenceClasses);
  assert.equal(contract.diagnosticRecord.materialObjectionsMustBeResolved, true);
  assert.equal(contract.interventionProposal.activeEntitlementRequired, true);
});
