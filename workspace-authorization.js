export const WORKSPACE_ROLES = Object.freeze({
  owner: "org:admin",
  facilitator: "org:facilitator",
  participant: "org:participant"
});

const ALL_ROLES = new Set(Object.values(WORKSPACE_ROLES));
const OWNER_ONLY = new Set(["workspace:update", "workspace:delete", "audit:read"]);
const ADMINISTRATIVE = new Set([
  "invitation:list",
  "invitation:create",
  "invitation:revoke",
  "completion:read",
  "round:create",
  "round:update",
  "round:delete",
  "round:open",
  "round:close",
  "round:follow-up",
  "action-cycle:read",
  "action-cycle:create",
  "action-cycle:update",
  "diagnostic:read",
  "diagnostic:create",
  "diagnostic:update"
]);
const ALL_MEMBERS = new Set(["workspace:read", "round:read"]);
const OWN_SUBMISSION = new Set(["submission:read-own", "submission:replace-own", "submission:delete-own"]);

export function authorizeWorkspaceAction({ role, action, roundStatus = null, ownsSubmission = false, thresholdMet = false }) {
  if (!ALL_ROLES.has(role) || typeof action !== "string") return false;
  if (ALL_MEMBERS.has(action)) return true;
  if (OWNER_ONLY.has(action)) return role === WORKSPACE_ROLES.owner;
  if (ADMINISTRATIVE.has(action)) return [WORKSPACE_ROLES.owner, WORKSPACE_ROLES.facilitator].includes(role);
  if (action === "submission:create") return roundStatus === "open";
  if (OWN_SUBMISSION.has(action)) {
    if (!ownsSubmission) return false;
    if (action === "submission:read-own") return true;
    return roundStatus === "open";
  }
  if (action === "aggregate:read") return thresholdMet;
  return false;
}

export const workspaceAuthorizationActions = Object.freeze([
  ...OWNER_ONLY,
  ...ADMINISTRATIVE,
  ...ALL_MEMBERS,
  "submission:create",
  ...OWN_SUBMISSION,
  "aggregate:read"
]);
