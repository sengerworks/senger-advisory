import test from "node:test";
import assert from "node:assert/strict";
import { authorizeWorkspaceAction, WORKSPACE_ROLES } from "../workspace-authorization.js";

test("limits workspace administration to owner and invitation operations to administrators", () => {
  assert.equal(authorizeWorkspaceAction({ role: WORKSPACE_ROLES.owner, action: "workspace:delete" }), true);
  assert.equal(authorizeWorkspaceAction({ role: WORKSPACE_ROLES.facilitator, action: "workspace:delete" }), false);
  assert.equal(authorizeWorkspaceAction({ role: WORKSPACE_ROLES.facilitator, action: "invitation:create" }), true);
  assert.equal(authorizeWorkspaceAction({ role: WORKSPACE_ROLES.facilitator, action: "round:open" }), true);
  assert.equal(authorizeWorkspaceAction({ role: WORKSPACE_ROLES.participant, action: "invitation:list" }), false);
  assert.equal(authorizeWorkspaceAction({ role: WORKSPACE_ROLES.participant, action: "round:update" }), false);
  assert.equal(authorizeWorkspaceAction({ role: WORKSPACE_ROLES.participant, action: "completion:read" }), false);
});

test("allows each member to control only their own submission while a round is open", () => {
  for (const role of Object.values(WORKSPACE_ROLES)) {
    assert.equal(authorizeWorkspaceAction({ role, action: "submission:create", roundStatus: "open" }), true);
    assert.equal(authorizeWorkspaceAction({ role, action: "submission:replace-own", roundStatus: "open", ownsSubmission: true }), true);
  }
  assert.equal(authorizeWorkspaceAction({ role: WORKSPACE_ROLES.participant, action: "submission:read-own", ownsSubmission: false }), false);
  assert.equal(authorizeWorkspaceAction({ role: WORKSPACE_ROLES.participant, action: "submission:delete-own", roundStatus: "closed", ownsSubmission: true }), false);
  assert.equal(authorizeWorkspaceAction({ role: WORKSPACE_ROLES.owner, action: "submission:read-own", ownsSubmission: false }), false);
});

test("reveals organizational aggregates to members only after the threshold is met", () => {
  for (const role of Object.values(WORKSPACE_ROLES)) {
    assert.equal(authorizeWorkspaceAction({ role, action: "aggregate:read", thresholdMet: false }), false);
    assert.equal(authorizeWorkspaceAction({ role, action: "aggregate:read", thresholdMet: true }), true);
  }
});

test("fails closed for unknown roles and actions", () => {
  assert.equal(authorizeWorkspaceAction({ role: "org:member", action: "workspace:read" }), false);
  assert.equal(authorizeWorkspaceAction({ role: WORKSPACE_ROLES.owner, action: "submission:list" }), false);
});
