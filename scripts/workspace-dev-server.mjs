import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import workspaceConfig from "../netlify/functions/workspace-config.mjs";
import workspaceSession from "../netlify/functions/workspace-session.mjs";

const port = 8888;
const origin = `http://localhost:${port}`;
process.env.CLERK_AUTHORIZED_PARTIES ||= origin;

const files = new Map([
  ["/workspace/", { url: new URL("../workspace/index.html", import.meta.url), type: "text/html; charset=utf-8" }],
  ["/workspace/workspace.css", { url: new URL("../workspace/workspace.css", import.meta.url), type: "text/css; charset=utf-8" }],
  ["/workspace/workspace.js", { url: new URL("../workspace/workspace.js", import.meta.url), type: "text/javascript; charset=utf-8" }],
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

const server = createServer(async (nodeRequest, nodeResponse) => {
  const url = new URL(nodeRequest.url || "/", origin);

  if (url.pathname === "/workspace") {
    nodeResponse.writeHead(301, { Location: "/workspace/" });
    nodeResponse.end();
    return;
  }

  if (url.pathname === "/api/workspace/config" || url.pathname === "/api/workspace/session") {
    const request = new Request(url, {
      method: nodeRequest.method,
      headers: nodeRequest.headers
    });
    const handler = url.pathname.endsWith("/config") ? workspaceConfig : workspaceSession;
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
