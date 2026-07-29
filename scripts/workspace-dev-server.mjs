import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import workspaceConfig from "../netlify/functions/workspace-config.mjs";
import workspaceDiagnostics from "../netlify/functions/workspace-diagnostics.mjs";
import workspaceDiagnosticContext from "../netlify/functions/workspace-diagnostic-context.mjs";
import workspaceDiagnosticParticipants from "../netlify/functions/workspace-diagnostic-participants.mjs";
import workspaceDiagnosticProtocol from "../netlify/functions/workspace-diagnostic-protocol.mjs";
import workspaceDiagnosticInvitations from "../netlify/functions/workspace-diagnostic-invitations.mjs";
import workspaceDiagnosticParticipation from "../netlify/functions/workspace-diagnostic-participation.mjs";
import workspaceDiagnosticInterview from "../netlify/functions/workspace-diagnostic-interview.mjs";
import workspaceComparison from "../netlify/functions/workspace-comparison.mjs";
import workspaceActionCycles from "../netlify/functions/workspace-action-cycles.mjs";
import workspaceInvitations from "../netlify/functions/workspace-invitations.mjs";
import workspaceParticipation from "../netlify/functions/workspace-participation.mjs";
import workspaceResults from "../netlify/functions/workspace-results.mjs";
import workspaceRounds from "../netlify/functions/workspace-rounds.mjs";
import workspaceSession from "../netlify/functions/workspace-session.mjs";
import workspaceSubmission from "../netlify/functions/workspace-submission.mjs";

const port = 8888;
const origin = `http://localhost:${port}`;
process.env.CLERK_AUTHORIZED_PARTIES ||= origin;

const files = new Map([
  ["/workspace/", { url: new URL("../workspace/index.html", import.meta.url), type: "text/html; charset=utf-8" }],
  ["/workspace/workspace.css", { url: new URL("../workspace/workspace.css", import.meta.url), type: "text/css; charset=utf-8" }],
  ["/workspace/workspace.js", { url: new URL("../workspace/workspace.js", import.meta.url), type: "text/javascript; charset=utf-8" }],
  ["/assessment.html", { url: new URL("../assessment.html", import.meta.url), type: "text/html; charset=utf-8" }],
  ["/diagnostic.html", { url: new URL("../diagnostic.html", import.meta.url), type: "text/html; charset=utf-8" }],
  ["/capacity-brief-example.html", { url: new URL("../capacity-brief-example.html", import.meta.url), type: "text/html; charset=utf-8" }],
  ["/capacity-brief-example.css", { url: new URL("../capacity-brief-example.css", import.meta.url), type: "text/css; charset=utf-8" }],
  ["/organization-view.html", { url: new URL("../organization-view.html", import.meta.url), type: "text/html; charset=utf-8" }],
  ["/organization-view.css", { url: new URL("../organization-view.css", import.meta.url), type: "text/css; charset=utf-8" }],
  ["/organization-view.js", { url: new URL("../organization-view.js", import.meta.url), type: "text/javascript; charset=utf-8" }],
  ["/organization-view-demo-data.js", { url: new URL("../organization-view-demo-data.js", import.meta.url), type: "text/javascript; charset=utf-8" }],
  ["/organization-aggregation-engine.js", { url: new URL("../organization-aggregation-engine.js", import.meta.url), type: "text/javascript; charset=utf-8" }],
  ["/organization-comparison-engine.js", { url: new URL("../organization-comparison-engine.js", import.meta.url), type: "text/javascript; charset=utf-8" }],
  ["/contact.html", { url: new URL("../contact.html", import.meta.url), type: "text/html; charset=utf-8" }],
  ["/privacy.html", { url: new URL("../privacy.html", import.meta.url), type: "text/html; charset=utf-8" }],
  ["/assessment.js", { url: new URL("../assessment.js", import.meta.url), type: "text/javascript; charset=utf-8" }],
  ["/saved-results-crypto.js", { url: new URL("../saved-results-crypto.js", import.meta.url), type: "text/javascript; charset=utf-8" }],
  ["/private-results-api.js", { url: new URL("../private-results-api.js", import.meta.url), type: "text/javascript; charset=utf-8" }],
  ["/script.js", { url: new URL("../script.js", import.meta.url), type: "text/javascript; charset=utf-8" }],
  ["/styles.css", { url: new URL("../styles.css", import.meta.url), type: "text/css; charset=utf-8" }],
  ["/assets/favicon.svg", { url: new URL("../assets/favicon.svg", import.meta.url), type: "image/svg+xml" }]
]);

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data: https://img.clerk.com",
  "script-src 'self' https://*.clerk.accounts.dev https://challenges.cloudflare.com",
  "connect-src 'self' https://*.clerk.accounts.dev",
  "style-src 'self' 'unsafe-inline'",
  "worker-src 'self' blob:",
  "frame-src 'self' https://challenges.cloudflare.com",
  "font-src 'self'"
].join("; ");

async function sendFetchResponse(nodeResponse, fetchResponse) {
  nodeResponse.writeHead(fetchResponse.status, Object.fromEntries(fetchResponse.headers));
  nodeResponse.end(Buffer.from(await fetchResponse.arrayBuffer()));
}

async function requestBody(nodeRequest) {
  const chunks = [];
  for await (const chunk of nodeRequest) chunks.push(chunk);
  return Buffer.concat(chunks);
}

const server = createServer(async (nodeRequest, nodeResponse) => {
  const url = new URL(nodeRequest.url || "/", origin);

  if (url.pathname === "/workspace") {
    nodeResponse.writeHead(301, { Location: "/workspace/" });
    nodeResponse.end();
    return;
  }

  if ([
    "/api/workspace/config",
    "/api/workspace/diagnostics",
    "/api/workspace/diagnostic-context",
    "/api/workspace/diagnostic-participants",
    "/api/workspace/diagnostic-protocol",
    "/api/workspace/diagnostic-invitations",
    "/api/workspace/diagnostic-participation",
    "/api/workspace/diagnostic-interview",
    "/api/workspace/comparison",
    "/api/workspace/action-cycles",
    "/api/workspace/invitations",
    "/api/workspace/participation",
    "/api/workspace/results",
    "/api/workspace/submission",
    "/api/workspace/session",
    "/api/workspace/rounds"
  ].includes(url.pathname)) {
    const method = nodeRequest.method || "GET";
    const request = new Request(url, {
      method,
      headers: nodeRequest.headers,
      body: ["GET", "HEAD"].includes(method) ? undefined : await requestBody(nodeRequest)
    });
    const handler = url.pathname.endsWith("/config")
      ? workspaceConfig
      : url.pathname.endsWith("/diagnostic-context")
        ? workspaceDiagnosticContext
      : url.pathname.endsWith("/diagnostic-participants")
        ? workspaceDiagnosticParticipants
      : url.pathname.endsWith("/diagnostic-protocol")
        ? workspaceDiagnosticProtocol
      : url.pathname.endsWith("/diagnostic-invitations")
        ? workspaceDiagnosticInvitations
      : url.pathname.endsWith("/diagnostic-participation")
        ? workspaceDiagnosticParticipation
      : url.pathname.endsWith("/diagnostic-interview")
        ? workspaceDiagnosticInterview
      : url.pathname.endsWith("/diagnostics")
        ? workspaceDiagnostics
      : url.pathname.endsWith("/comparison")
        ? workspaceComparison
      : url.pathname.endsWith("/action-cycles")
        ? workspaceActionCycles
      : url.pathname.endsWith("/invitations")
        ? workspaceInvitations
      : url.pathname.endsWith("/participation")
        ? workspaceParticipation
      : url.pathname.endsWith("/results")
        ? workspaceResults
      : url.pathname.endsWith("/submission")
        ? workspaceSubmission
      : url.pathname.endsWith("/rounds")
        ? workspaceRounds
        : workspaceSession;
    await sendFetchResponse(nodeResponse, await handler(request));
    return;
  }

  const file = files.get(url.pathname)
    || (url.pathname.startsWith("/workspace/")
      ? files.get("/workspace/")
      : null);
  if (!file) {
    nodeResponse.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    nodeResponse.end("Not found");
    return;
  }

  try {
    const body = await readFile(fileURLToPath(file.url));
    nodeResponse.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Security-Policy": csp,
      "Content-Type": file.type,
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff"
    });
    nodeResponse.end(body);
  } catch {
    nodeResponse.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    nodeResponse.end("Workspace unavailable");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Workspace development server: ${origin}/workspace/`);
});
