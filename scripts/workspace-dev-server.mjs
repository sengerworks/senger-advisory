import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import workspaceConfig from "../netlify/functions/workspace-config.mjs";
import workspaceOrganizationBootstrap from "../netlify/functions/workspace-organization-bootstrap.mjs";
import platformOperationsOverview from "../netlify/functions/platform-operations-overview.mjs";
import platformOperationsDiagnostics from "../netlify/functions/platform-operations-diagnostics.mjs";
import platformOperationsAdvisorAssignments from "../netlify/functions/platform-operations-advisor-assignments.mjs";
import platformOperationsV2Activation from "../netlify/functions/platform-operations-v2-activation.mjs";
import workspaceDiagnostics from "../netlify/functions/workspace-diagnostics.mjs";
import workspaceDiagnosticContext from "../netlify/functions/workspace-diagnostic-context.mjs";
import workspaceDiagnosticFrameV2 from "../netlify/functions/workspace-diagnostic-frame-v2.mjs";
import workspaceDiagnosticProtocolV2 from "../netlify/functions/workspace-diagnostic-protocol-v2.mjs";
import workspaceDiagnosticParticipants from "../netlify/functions/workspace-diagnostic-participants.mjs";
import workspaceDiagnosticProtocol from "../netlify/functions/workspace-diagnostic-protocol.mjs";
import workspaceDiagnosticInvitations from "../netlify/functions/workspace-diagnostic-invitations.mjs";
import workspaceDiagnosticParticipation from "../netlify/functions/workspace-diagnostic-participation.mjs";
import workspaceDiagnosticInterview from "../netlify/functions/workspace-diagnostic-interview.mjs";
import workspaceDiagnosticInterviewV2 from "../netlify/functions/workspace-diagnostic-interview-v2.mjs";
import workspaceDiagnosticEvidenceReview from "../netlify/functions/workspace-diagnostic-evidence-review.mjs";
import workspaceDiagnosticEvidencePreparation from "../netlify/functions/workspace-diagnostic-evidence-preparation.mjs";
import workspaceDiagnosticAdvisorAssignments from "../netlify/functions/workspace-diagnostic-advisor-assignments.mjs";
import workspaceDiagnosticSynthesis from "../netlify/functions/workspace-diagnostic-synthesis.mjs";
import workspaceDiagnosticLeadershipValidation from "../netlify/functions/workspace-diagnostic-leadership-validation.mjs";
import workspaceDiagnosticIntervention from "../netlify/functions/workspace-diagnostic-intervention.mjs";
import workspaceDiagnosticInterventionAcceptance from "../netlify/functions/workspace-diagnostic-intervention-acceptance.mjs";
import workspaceCapacityOperatingBrief from "../netlify/functions/workspace-capacity-operating-brief.mjs";
import workspaceCapacityBriefEvidence from "../netlify/functions/workspace-capacity-brief-evidence.mjs";
import workspaceCapacityBriefLearning from "../netlify/functions/workspace-capacity-brief-learning.mjs";
import workspaceCapacityBriefActionPath from "../netlify/functions/workspace-capacity-brief-action-path.mjs";
import workspaceCapacityBriefCheckIns from "../netlify/functions/workspace-capacity-brief-check-ins.mjs";
import workspaceCapacityBriefAttention from "../netlify/functions/workspace-capacity-brief-attention.mjs";
import workspaceInterventionAdvisorEscalation from "../netlify/functions/workspace-intervention-advisor-escalation.mjs";
import workspaceAdvisorEscalationQueue from "../netlify/functions/workspace-advisor-escalation-queue.mjs";
import workspaceCapacityBriefDecisionHistory from "../netlify/functions/workspace-capacity-brief-decision-history.mjs";
import workspaceCapacityBriefGuidedPlan from "../netlify/functions/workspace-capacity-brief-guided-plan.mjs";
import workspacePocFeedback from "../netlify/functions/workspace-poc-feedback.mjs";
import workspacePocScorecard from "../netlify/functions/workspace-poc-scorecard.mjs";
import workspacePocCohortDecisions from "../netlify/functions/workspace-poc-cohort-decisions.mjs";
import workspacePocChangeCandidates from "../netlify/functions/workspace-poc-change-candidates.mjs";
import workspaceCapacityBriefReviews from "../netlify/functions/workspace-capacity-brief-reviews.mjs";
import workspaceDiagnosticReassessment from "../netlify/functions/workspace-diagnostic-reassessment.mjs";
import workspaceDiagnosticReassessmentComparison from "../netlify/functions/workspace-diagnostic-reassessment-comparison.mjs";
import workspaceCommerceCheckout from "../netlify/functions/workspace-commerce-checkout.mjs";
import stripeCommerceWebhook from "../netlify/functions/stripe-commerce-webhook.mjs";
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
  ["/", { url: new URL("../index.html", import.meta.url), type: "text/html; charset=utf-8" }],
  ["/workspace/", { url: new URL("../workspace/index.html", import.meta.url), type: "text/html; charset=utf-8" }],
  ["/workspace/workspace.css", { url: new URL("../workspace/workspace.css", import.meta.url), type: "text/css; charset=utf-8" }],
  ["/workspace/workspace.js", { url: new URL("../workspace/workspace.js", import.meta.url), type: "text/javascript; charset=utf-8" }],
  ["/workspace/advisor.html", { url: new URL("../workspace/advisor.html", import.meta.url), type: "text/html; charset=utf-8" }],
  ["/workspace/advisor.css", { url: new URL("../workspace/advisor.css", import.meta.url), type: "text/css; charset=utf-8" }],
  ["/workspace/advisor.js", { url: new URL("../workspace/advisor.js", import.meta.url), type: "text/javascript; charset=utf-8" }],
  ["/workspace/operations.html", { url: new URL("../workspace/operations.html", import.meta.url), type: "text/html; charset=utf-8" }],
  ["/workspace/operations.css", { url: new URL("../workspace/operations.css", import.meta.url), type: "text/css; charset=utf-8" }],
  ["/workspace/operations-assignments.css", { url: new URL("../workspace/operations-assignments.css", import.meta.url), type: "text/css; charset=utf-8" }],
  ["/workspace/operations.js", { url: new URL("../workspace/operations.js", import.meta.url), type: "text/javascript; charset=utf-8" }],
  ["/workspace/presenter-demo.html", { url: new URL("../workspace/presenter-demo.html", import.meta.url), type: "text/html; charset=utf-8" }],
  ["/workspace/presenter-demo.css", { url: new URL("../workspace/presenter-demo.css", import.meta.url), type: "text/css; charset=utf-8" }],
  ["/workspace/presenter-demo.js", { url: new URL("../workspace/presenter-demo.js", import.meta.url), type: "text/javascript; charset=utf-8" }],
  ["/assessment.html", { url: new URL("../assessment.html", import.meta.url), type: "text/html; charset=utf-8" }],
  ["/diagnostic.html", { url: new URL("../diagnostic.html", import.meta.url), type: "text/html; charset=utf-8" }],
  ["/capacity-brief-example.html", { url: new URL("../capacity-brief-example.html", import.meta.url), type: "text/html; charset=utf-8" }],
  ["/capacity-brief-example.css", { url: new URL("../capacity-brief-example.css", import.meta.url), type: "text/css; charset=utf-8" }],
  ["/platform-journey.html", { url: new URL("../platform-journey.html", import.meta.url), type: "text/html; charset=utf-8" }],
  ["/platform-journey.css", { url: new URL("../platform-journey.css", import.meta.url), type: "text/css; charset=utf-8" }],
  ["/platform-journey.js", { url: new URL("../platform-journey.js", import.meta.url), type: "text/javascript; charset=utf-8" }],
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
  ["/flow-engine.js", { url: new URL("../flow-engine.js", import.meta.url), type: "text/javascript; charset=utf-8" }],
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
    "/api/workspace/organization-bootstrap",
    "/api/operations/overview",
    "/api/operations/diagnostics",
    "/api/operations/advisor-assignments",
    "/api/operations/diagnostic-v2-activation",
    "/api/workspace/diagnostics",
    "/api/workspace/diagnostic-context",
    "/api/workspace/diagnostic-frame-v2",
    "/api/workspace/diagnostic-protocol-v2",
    "/api/workspace/diagnostic-participants",
    "/api/workspace/diagnostic-protocol",
    "/api/workspace/diagnostic-invitations",
    "/api/workspace/diagnostic-participation",
    "/api/workspace/diagnostic-interview",
    "/api/workspace/diagnostic-interview-v2",
    "/api/workspace/diagnostic-evidence-review",
    "/api/workspace/diagnostic-evidence-preparation",
    "/api/workspace/diagnostic-advisor-assignments",
    "/api/workspace/diagnostic-synthesis",
    "/api/workspace/diagnostic-leadership-validation",
    "/api/workspace/diagnostic-intervention",
    "/api/workspace/diagnostic-intervention-acceptance",
    "/api/workspace/capacity-operating-brief",
    "/api/workspace/capacity-brief-evidence",
    "/api/workspace/capacity-brief-learning",
    "/api/workspace/capacity-brief-action-path",
    "/api/workspace/capacity-brief-check-ins",
    "/api/workspace/capacity-brief-attention",
    "/api/workspace/intervention-advisor-escalation",
    "/api/workspace/advisor-escalation-queue",
    "/api/workspace/capacity-brief-decision-history",
    "/api/workspace/capacity-brief-guided-plan",
    "/api/workspace/poc-feedback",
    "/api/workspace/poc-scorecard",
    "/api/workspace/poc-cohort-decisions",
    "/api/workspace/poc-change-candidates",
    "/api/workspace/capacity-brief-reviews",
    "/api/workspace/diagnostic-reassessment",
    "/api/workspace/diagnostic-reassessment-comparison",
    "/api/workspace/commerce-checkout",
    "/api/commerce/stripe-webhook",
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
    const handler = url.pathname === "/api/operations/overview"
      ? platformOperationsOverview
      : url.pathname === "/api/operations/advisor-assignments"
        ? platformOperationsAdvisorAssignments
      : url.pathname === "/api/operations/diagnostic-v2-activation"
        ? platformOperationsV2Activation
      : url.pathname === "/api/operations/diagnostics"
        ? platformOperationsDiagnostics
      : url.pathname.endsWith("/stripe-webhook")
      ? stripeCommerceWebhook
      : url.pathname.endsWith("/commerce-checkout")
        ? workspaceCommerceCheckout
      : url.pathname.endsWith("/config")
      ? workspaceConfig
      : url.pathname.endsWith("/organization-bootstrap")
        ? workspaceOrganizationBootstrap
      : url.pathname.endsWith("/diagnostic-context")
        ? workspaceDiagnosticContext
      : url.pathname.endsWith("/diagnostic-frame-v2")
        ? workspaceDiagnosticFrameV2
      : url.pathname.endsWith("/diagnostic-protocol-v2")
        ? workspaceDiagnosticProtocolV2
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
      : url.pathname.endsWith("/diagnostic-interview-v2")
        ? workspaceDiagnosticInterviewV2
      : url.pathname.endsWith("/diagnostic-evidence-review")
        ? workspaceDiagnosticEvidenceReview
      : url.pathname.endsWith("/diagnostic-evidence-preparation")
        ? workspaceDiagnosticEvidencePreparation
      : url.pathname.endsWith("/diagnostic-advisor-assignments")
        ? workspaceDiagnosticAdvisorAssignments
      : url.pathname.endsWith("/diagnostic-synthesis")
        ? workspaceDiagnosticSynthesis
      : url.pathname.endsWith("/diagnostic-leadership-validation")
        ? workspaceDiagnosticLeadershipValidation
      : url.pathname.endsWith("/diagnostic-intervention")
        ? workspaceDiagnosticIntervention
      : url.pathname.endsWith("/diagnostic-intervention-acceptance")
        ? workspaceDiagnosticInterventionAcceptance
      : url.pathname.endsWith("/capacity-operating-brief")
        ? workspaceCapacityOperatingBrief
      : url.pathname.endsWith("/capacity-brief-evidence")
        ? workspaceCapacityBriefEvidence
      : url.pathname.endsWith("/capacity-brief-learning")
        ? workspaceCapacityBriefLearning
      : url.pathname.endsWith("/capacity-brief-action-path")
        ? workspaceCapacityBriefActionPath
      : url.pathname.endsWith("/capacity-brief-check-ins")
        ? workspaceCapacityBriefCheckIns
      : url.pathname.endsWith("/capacity-brief-attention")
        ? workspaceCapacityBriefAttention
      : url.pathname.endsWith("/intervention-advisor-escalation")
        ? workspaceInterventionAdvisorEscalation
      : url.pathname.endsWith("/advisor-escalation-queue")
        ? workspaceAdvisorEscalationQueue
      : url.pathname.endsWith("/capacity-brief-decision-history")
        ? workspaceCapacityBriefDecisionHistory
      : url.pathname.endsWith("/capacity-brief-guided-plan")
        ? workspaceCapacityBriefGuidedPlan
      : url.pathname.endsWith("/poc-feedback")
        ? workspacePocFeedback
      : url.pathname.endsWith("/poc-scorecard")
        ? workspacePocScorecard
      : url.pathname.endsWith("/poc-cohort-decisions")
        ? workspacePocCohortDecisions
      : url.pathname.endsWith("/poc-change-candidates")
        ? workspacePocChangeCandidates
      : url.pathname.endsWith("/capacity-brief-reviews")
        ? workspaceCapacityBriefReviews
      : url.pathname.endsWith("/diagnostic-reassessment")
        ? workspaceDiagnosticReassessment
      : url.pathname.endsWith("/diagnostic-reassessment-comparison")
        ? workspaceDiagnosticReassessmentComparison
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
