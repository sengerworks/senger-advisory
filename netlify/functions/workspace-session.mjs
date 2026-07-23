import { authenticateWorkspaceRequest } from "../lib/clerk-workspace-auth.mjs";

const headers = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff"
};

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers });
}

export function createWorkspaceSessionHandler({
  authenticate = authenticateWorkspaceRequest
} = {}) {
  return async request => {
    if (request.method !== "GET") return json(405, { error: "Method not allowed." });

    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return json(403, { error: "Origin not allowed." });
    }

    try {
      const result = await authenticate(request);
      if (!result.ok) return json(result.status, { error: "Workspace access unavailable." });
      return json(200, {
        authenticated: true,
        workspaceReady: true,
        role: result.value.role
      });
    } catch (error) {
      console.error(
        "Workspace session check failed",
        error instanceof Error ? error.message : "Unknown error"
      );
      return json(503, { error: "Workspace access is temporarily unavailable." });
    }
  };
}

export default createWorkspaceSessionHandler();

export const config = {
  path: "/api/workspace/session",
  rateLimit: {
    windowLimit: 120,
    windowSize: 60,
    aggregateBy: ["ip", "domain"]
  }
};
