function isoDaysAgo(now, days) {
  return new Date(now.getTime() - days * 86400000).toISOString();
}

function dateDaysFrom(now, days) {
  return new Date(now.getTime() + days * 86400000).toISOString().slice(0, 10);
}

export function createIllustrativeProfile(now = new Date()) {
  const baseline = isoDaysAgo(now, 120);
  const latest = isoDaysAgo(now, 28);
  return {
    schemaVersion: "1.2.0",
    profileId: "10000000-0000-4000-8000-000000000001",
    createdAt: baseline,
    updatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 365 * 86400000).toISOString(),
    displayLabel: "Illustrative Growth Company",
    assessmentInstances: [
      {
        assessmentInstanceId: "10000000-0000-4000-8000-000000000002",
        completedAt: baseline,
        assessmentVersion: "1.0.0",
        scoringVersion: "0.1.0",
        reportVersion: "1.0.0",
        contextVersion: "1.0.0",
        context: { organizationSize: "150–399 people", respondentRole: "Executive leader", growthPressure: "High" },
        domainScores: { leadership: 58, decisions: 42, rhythm: 50, alignment: 58, technology: 67, culture: 58 },
        overallIndex: 52,
        interpretationBand: "Strained",
        primaryConstraintIds: ["decisions"],
        accuracyRating: null
      },
      {
        assessmentInstanceId: "10000000-0000-4000-8000-000000000003",
        completedAt: latest,
        assessmentVersion: "1.0.0",
        scoringVersion: "0.1.0",
        reportVersion: "1.0.0",
        contextVersion: "1.0.0",
        context: { organizationSize: "150–399 people", respondentRole: "Executive leader", growthPressure: "High" },
        domainScores: { leadership: 67, decisions: 50, rhythm: 58, alignment: 67, technology: 67, culture: 67 },
        overallIndex: 60,
        interpretationBand: "Developing",
        primaryConstraintIds: ["decisions"],
        accuracyRating: null
      }
    ],
    outcomeSnapshots: [
      {
        outcomeSnapshotId: "10000000-0000-4000-8000-000000000004",
        observedAt: isoDaysAgo(now, 90),
        outcomeMeasureVersion: "1.0.0",
        observationWindow: "30-days",
        decisionPace: 2,
        leadershipEscalationLoad: 2,
        crossFunctionalCoordinationLoad: 3,
        executionReliability: 2,
        changeAbsorption: 3,
        evidenceSource: "mixed"
      },
      {
        outcomeSnapshotId: "10000000-0000-4000-8000-000000000005",
        observedAt: isoDaysAgo(now, 14),
        outcomeMeasureVersion: "1.0.0",
        observationWindow: "30-days",
        decisionPace: 3,
        leadershipEscalationLoad: 3,
        crossFunctionalCoordinationLoad: 3,
        executionReliability: 3,
        changeAbsorption: 3,
        evidenceSource: "mixed"
      }
    ],
    changeRecords: [],
    researchParticipation: null,
    actionCycles: [{
      actionCycleId: "10000000-0000-4000-8000-000000000006",
      actionCycleVersion: "1.0.0",
      createdAt: isoDaysAgo(now, 75),
      updatedAt: isoDaysAgo(now, 7),
      constraintDomainId: "decisions",
      hypothesis: "If decision ownership and escalation thresholds are explicit, routine decisions will close faster without increasing executive intervention.",
      commitment: "Publish decision owners and escalation thresholds for the five highest-volume cross-functional decisions.",
      evidenceMeasureId: "decisionPace",
      evidenceDescription: "Review median decision age and the share of routine decisions escalated to the executive team.",
      reviewDate: dateDaysFrom(now, 21),
      status: "active",
      closedAt: null,
      reviewNote: "Early observations show fewer reopened decisions. Continue through the full review window before interpreting the pattern."
    }]
  };
}
