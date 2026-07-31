import { authenticateWorkspaceRequest } from "./clerk-workspace-auth.mjs";

export function configuredPlatformOperatorUserIds(value = process.env.PLATFORM_OPERATOR_USER_IDS) {
  const ids = String(value || "").split(",").map(item => item.trim()).filter(Boolean);
  if (!ids.length || ids.some(id => !/^user_[A-Za-z0-9]+$/.test(id))) {
    throw new Error("PLATFORM_OPERATOR_USER_IDS must contain explicit comma-separated Clerk user IDs.");
  }
  return Object.freeze([...new Set(ids)]);
}

export async function authenticatePlatformOperationsRequest(request, {
  authenticate = authenticateWorkspaceRequest,
  operatorUserIds = configuredPlatformOperatorUserIds()
} = {}) {
  const result = await authenticate(request);
  if (!result.ok) return result;
  if (!operatorUserIds.includes(result.value.userId)) return { ok: false, status: 403 };
  return {
    ok: true,
    value: Object.freeze({
      userId: result.value.userId,
      workspaceId: result.value.workspaceId,
      organizationId: result.value.organizationId,
      authority: "platform-operator"
    })
  };
}

export const platformOperationsAuthPolicy = Object.freeze({
  authority: "environment-allowlisted-platform-operator",
  tenantBoundary: "active-clerk-organization",
  participantIdentityAccess: false,
  participantContentAccess: false
});
