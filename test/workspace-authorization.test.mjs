import test from "node:test";
import assert from "node:assert/strict";
import { authorizeWorkspaceAction, PRODUCT_ROLE_BOUNDARY, WORKSPACE_ROLES } from "../workspace-authorization.js";

test("separates client workspace roles from platform and advisor assignments", () => {
  assert.equal(PRODUCT_ROLE_BOUNDARY.clientSponsor.providerRole, WORKSPACE_ROLES.owner);
  assert.equal(PRODUCT_ROLE_BOUNDARY.clientSponsor.responseContentAccess, false);
  assert.equal(PRODUCT_ROLE_BOUNDARY.assignedAdvisor.providerRole, null);
  assert.equal(PRODUCT_ROLE_BOUNDARY.assignedAdvisor.scope, "time-bounded-engagement-assignment");
  assert.equal(PRODUCT_ROLE_BOUNDARY.platformAdmin.responseContentAccess, false);
});

test("limits POC workspace administration to the client sponsor", () => {
  assert.equal(authorizeWorkspaceAction({ role: WORKSPACE_ROLES.owner, action: "workspace:delete" }), true);
  assert.equal(authorizeWorkspaceAction({ role: "org:facilitator", action: "workspace:delete" }), false);
  assert.equal(authorizeWorkspaceAction({ role: WORKSPACE_ROLES.owner, action: "invitation:create" }), true);
  assert.equal(authorizeWorkspaceAction({ role: WORKSPACE_ROLES.owner, action: "round:open" }), true);
  assert.equal(authorizeWorkspaceAction({ role: WORKSPACE_ROLES.participant, action: "invitation:list" }), false);
  assert.equal(authorizeWorkspaceAction({ role: WORKSPACE_ROLES.participant, action: "round:update" }), false);
  assert.equal(authorizeWorkspaceAction({ role: WORKSPACE_ROLES.participant, action: "completion:read" }), false);
  assert.equal(authorizeWorkspaceAction({ role: WORKSPACE_ROLES.owner, action: "action-cycle:create" }), true);
  assert.equal(authorizeWorkspaceAction({ role: WORKSPACE_ROLES.owner, action: "action-cycle:update" }), true);
  assert.equal(authorizeWorkspaceAction({ role: WORKSPACE_ROLES.participant, action: "action-cycle:read" }), false);
  assert.equal(authorizeWorkspaceAction({ role: WORKSPACE_ROLES.owner, action: "diagnostic:create" }), false);
  assert.equal(authorizeWorkspaceAction({ role: WORKSPACE_ROLES.owner, action: "diagnostic:read" }), true);
  assert.equal(authorizeWorkspaceAction({ role: WORKSPACE_ROLES.participant, action: "diagnostic:read" }), false);
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
  assert.equal(authorizeWorkspaceAction({ role: "org:viewer", action: "workspace:read" }), false);
  assert.equal(authorizeWorkspaceAction({ role: WORKSPACE_ROLES.owner, action: "submission:list" }), false);
});
