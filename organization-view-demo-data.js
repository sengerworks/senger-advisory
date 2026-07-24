const completedAt = "2026-07-23T12:00:00.000Z";

function submission(index, domainScores, overallIndex, primaryConstraintIds) {
  return {
    submissionId: `20000000-0000-4000-${index % 2 ? "8" : "9"}000-${String(index).padStart(12, "0")}`,
    completedAt,
    assessmentVersion: "1.0.0",
    scoringVersion: "0.1.0",
    domainScores,
    overallIndex,
    interpretationBand: overallIndex < 60 ? "Strained" : "Developing",
    primaryConstraintIds
  };
}

export const illustrativeOrganizationSubmissions = Object.freeze([
  submission(1, { leadership: 58, decisions: 25, rhythm: 50, alignment: 42, technology: 58, culture: 50 }, 50, ["decisions"]),
  submission(2, { leadership: 67, decisions: 42, rhythm: 58, alignment: 58, technology: 67, culture: 58 }, 57, ["decisions"]),
  submission(3, { leadership: 58, decisions: 50, rhythm: 50, alignment: 67, technology: 75, culture: 67 }, 61, ["decisions", "rhythm"]),
  submission(4, { leadership: 67, decisions: 67, rhythm: 67, alignment: 75, technology: 67, culture: 58 }, 67, ["leadership", "decisions", "rhythm", "technology"]),
  submission(5, { leadership: 58, decisions: 75, rhythm: 58, alignment: 58, technology: 75, culture: 67 }, 66, ["leadership", "rhythm", "alignment"])
]);

export const illustrativeFollowUpSubmissions = Object.freeze([
  submission(11, { leadership: 67, decisions: 50, rhythm: 58, alignment: 50, technology: 67, culture: 58 }, 58, ["alignment", "decisions"]),
  submission(12, { leadership: 67, decisions: 58, rhythm: 67, alignment: 67, technology: 67, culture: 67 }, 65, ["decisions"]),
  submission(13, { leadership: 58, decisions: 67, rhythm: 58, alignment: 67, technology: 75, culture: 67 }, 65, ["leadership", "rhythm"]),
  submission(14, { leadership: 75, decisions: 75, rhythm: 67, alignment: 75, technology: 75, culture: 67 }, 72, ["rhythm", "culture"]),
  submission(15, { leadership: 67, decisions: 75, rhythm: 67, alignment: 67, technology: 75, culture: 75 }, 71, ["leadership", "rhythm", "alignment"])
]);
