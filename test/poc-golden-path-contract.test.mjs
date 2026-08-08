import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = path => readFile(new URL(path, import.meta.url), "utf8");

test("local POC runtime exposes the complete governed golden path", async () => {
  const server = await read("../scripts/workspace-dev-server.mjs");
  const requiredRoutes = [
    "/api/operations/diagnostics",
    "/api/operations/advisor-assignments",
    "/api/operations/diagnostic-v2-activation",
    "/api/workspace/diagnostic-context",
    "/api/workspace/diagnostic-frame-v2",
    "/api/workspace/diagnostic-protocol-v2",
    "/api/workspace/diagnostic-participants",
    "/api/workspace/diagnostic-invitations",
    "/api/workspace/diagnostic-participation",
    "/api/workspace/diagnostic-interview-v2",
    "/api/workspace/diagnostic-evidence-preparation",
    "/api/workspace/diagnostic-evidence-review",
    "/api/workspace/diagnostic-synthesis",
    "/api/workspace/diagnostic-leadership-validation",
    "/api/workspace/diagnostic-intervention",
    "/api/workspace/diagnostic-intervention-acceptance",
    "/api/workspace/capacity-operating-brief",
    "/api/workspace/poc-feedback",
    "/api/workspace/poc-scorecard"
  ];
  for (const route of requiredRoutes) assert.match(server, new RegExp(route.replaceAll("/", "\\/")));
});

test("each POC role surface links to its governed responsibilities", async () => {
  const [operations, sponsor, advisor] = await Promise.all([
    read("../workspace/operations.js"),
    read("../workspace/workspace.js"),
    read("../workspace/advisor.js")
  ]);
  for (const route of ["/api/operations/diagnostics", "/api/operations/advisor-assignments", "/api/operations/diagnostic-v2-activation"]) assert.match(operations, new RegExp(route));
  for (const route of ["/api/workspace/diagnostic-context", "/api/workspace/diagnostic-participants", "/api/workspace/diagnostic-invitations", "/api/workspace/diagnostic-leadership-validation", "/api/workspace/diagnostic-intervention-acceptance", "/api/workspace/capacity-operating-brief", "/api/workspace/poc-feedback"]) assert.match(sponsor, new RegExp(route));
  for (const route of ["/api/workspace/diagnostic-frame-v2", "/api/workspace/diagnostic-protocol-v2", "/api/workspace/diagnostic-evidence-preparation", "/api/workspace/diagnostic-evidence-review", "/api/workspace/diagnostic-synthesis", "/api/workspace/diagnostic-intervention", "/api/workspace/poc-scorecard"]) assert.match(advisor, new RegExp(route));
});

test("Protocol v2 completion reaches progress, sponsor release, and POC reporting", async () => {
  const [invitations, validation, scorecard] = await Promise.all([
    read("../netlify/lib/workspace-diagnostic-invitations.mjs"),
    read("../netlify/lib/workspace-diagnostic-leadership-validation.mjs"),
    read("../netlify/lib/workspace-poc-scorecard.mjs")
  ]);
  for (const source of [invitations, validation, scorecard]) {
    assert.match(source, /diagnostic_interviews_v2/);
    assert.match(source, /COALESCE\(interview_v2\.status,\s*interview\.status\)/);
  }
});
