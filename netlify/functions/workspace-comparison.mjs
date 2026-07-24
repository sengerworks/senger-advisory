import { authorizeWorkspaceAction } from "../../workspace-authorization.js";
import { authenticateWorkspaceRequest } from "../lib/clerk-workspace-auth.mjs";
import { getWorkspaceComparison } from "../lib/workspace-comparison.mjs";

const headers = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff"
};

const json = (status, body) => new Response(JSON.stringify(body), { status, headers });

export function createWorkspaceComparisonHandler({
  authenticate = authenticateWorkspaceRequest,
  getComparison = getWorkspaceComparison
} = {}) {
  return async request => {
    if (request.method !== "GET") return json(405, { error: "Method not allowed." });
    const url = new URL(request.url);
    const origin = request.headers.get("origin");
    if (origin && origin !== url.origin) return json(403, { error: "Origin not allowed." });
    try {
      const auth = await authenticate(request);
      if (!auth.ok) return json(auth.status, { error: "Workspace access unavailable." });
      if (!authorizeWorkspaceAction({ role: auth.value.role, action: "completion:read" })) {
        return json(403, { error: "Only workspace administrators can view comparisons." });
      }
      const result = await getComparison(
        auth.value.workspaceId,
        url.searchParams.get("roundId")
      );
      if (!result) return json(404, { error: "Linked follow-up collection not found." });
      return json(200, result);
    } catch (error) {
      if (error instanceof TypeError) return json(400, { error: "Choose a valid follow-up round." });
      console.error(
        "Workspace comparison operation failed",
        error instanceof Error ? error.message : "Unknown error"
      );
      return json(503, { error: "Organizational comparison is temporarily unavailable." });
    }
  };
}

export default createWorkspaceComparisonHandler();

export const config = {
  path: "/api/workspace/comparison",
  rateLimit: {
    windowLimit: 120,
    windowSize: 60,
    aggregateBy: ["ip", "domain"]
  }
};
