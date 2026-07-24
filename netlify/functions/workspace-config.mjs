const CLERK_JS_VERSION = "6.25.6";
const headers = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff"
};

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers });
}

export function frontendApiFromPublishableKey(publishableKey) {
  if (typeof publishableKey !== "string" || !/^pk_(test|live)_/.test(publishableKey)) {
    throw new Error("Clerk publishable key is not configured.");
  }
  const encoded = publishableKey.replace(/^pk_(test|live)_/, "");
  const decoded = Buffer.from(encoded, "base64").toString("utf8").replace(/\$$/, "");
  if (!/^[a-z0-9.-]+$/i.test(decoded) || !decoded.includes(".")) {
    throw new Error("Clerk publishable key is invalid.");
  }
  return decoded;
}

export function createWorkspaceConfigHandler({
  publishableKey = process.env.CLERK_PUBLISHABLE_KEY
} = {}) {
  return async request => {
    if (request.method !== "GET") return json(405, { error: "Method not allowed." });
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return json(403, { error: "Origin not allowed." });
    }

    try {
      const frontendApi = frontendApiFromPublishableKey(publishableKey);
      return json(200, {
        publishableKey,
        clerkUiUrl: `https://${frontendApi}/npm/@clerk/ui@1/dist/ui.browser.js`,
        clerkJsUrl: `https://${frontendApi}/npm/@clerk/clerk-js@${CLERK_JS_VERSION}/dist/clerk.browser.js`
      });
    } catch {
      return json(503, { error: "Workspace sign-in is not configured." });
    }
  };
}

export default createWorkspaceConfigHandler();

export const config = {
  path: "/api/workspace/config"
};
