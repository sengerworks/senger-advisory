import test from "node:test";
import assert from "node:assert/strict";
import { createIllustrativeProfile } from "../demo-profile.js";
import { profileJourney } from "../profile-journey-engine.js";
import { validateSavedProfile } from "../saved-results-crypto.js";

const now = new Date("2026-07-23T12:00:00.000Z");

test("illustrative profile demonstrates the complete product loop without credentials", () => {
  const profile = createIllustrativeProfile(now);
  const journey = profileJourney(profile, now);
  assert.equal(validateSavedProfile(profile), true);
  assert.equal(profile.assessmentInstances.length, 2);
  assert.equal(journey.currentFocus.constraintDomainIds[0], "decisions");
  assert.equal(journey.currentFocus.action.status, "active");
  assert.equal(journey.currentFocus.latestOutcome.decisionPace, 3);
  assert.deepEqual(journey.steps.map(step => step.state), ["complete", "complete", "complete", "complete", "complete"]);
  assert.equal(JSON.stringify(profile).includes("withdrawalCapability"), false);
});

test("journey points to the next unfinished part of the loop", () => {
  const profile = createIllustrativeProfile(now);
  profile.assessmentInstances = [profile.assessmentInstances[0]];
  profile.actionCycles = [];
  profile.outcomeSnapshots = [];
  const journey = profileJourney(profile, now);
  assert.equal(journey.currentFocus.nextStep, "Define an action hypothesis");
  assert.equal(journey.steps.find(step => step.id === "act").state, "next");
  assert.equal(journey.steps.find(step => step.id === "observe").state, "pending");
});
