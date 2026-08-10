import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("workspace is private-indexed and presents the threshold privacy contract", async () => {
  const html = await source("workspace/index.html");
  assert.match(html, /name="robots" content="noindex, nofollow"/);
  assert.match(html, /Individual scores are never shown to workspace roles/);
  assert.match(html, /Results remain suppressed below five valid submissions/);
  assert.match(html, /Workspace participation is separate from research consent/);
});

test("local product preview serves the public category homepage", async () => {
  const server = await readFile(new URL("../scripts/workspace-dev-server.mjs", import.meta.url), "utf8");
  assert.match(server, /\["\/", \{ url: new URL\("\.\.\/index\.html"/);
  assert.match(server, /\["\/flow-engine\.js", \{ url: new URL\("\.\.\/flow-engine\.js"/);
});

test("local product preview routes the v2 Diagnostic Frame endpoint", async () => {
  const server = await source("scripts/workspace-dev-server.mjs");
  assert.match(server, /workspace-diagnostic-frame-v2\.mjs/);
  assert.match(server, /\/api\/workspace\/diagnostic-frame-v2/);
  assert.match(server, /workspaceDiagnosticFrameV2/);
});

test("workspace browser uses server configuration and minimized session endpoints", async () => {
  const script = await source("workspace/workspace.js");
  const server = await source("scripts/workspace-dev-server.mjs");
  assert.match(script, /fetch\("\/api\/workspace\/config"/);
  assert.match(script, /fetch\("\/api\/workspace\/session"/);
  assert.match(script, /workspaceRequest\("\/api\/workspace\/rounds"/);
  assert.match(script, /workspaceRequest\("\/api\/workspace\/diagnostics"/);
  assert.match(script, /workspaceRequest\("\/api\/workspace\/diagnostic-context"/);
  assert.match(server, /import workspaceDiagnostics/);
  assert.match(server, /"\/api\/workspace\/diagnostics"/);
  assert.match(server, /import workspaceDiagnosticContext/);
  assert.match(server, /"\/api\/workspace\/diagnostic-context"/);
  assert.match(server, /workspace-diagnostic-frame-v2\.mjs/);
  assert.match(server, /"\/api\/workspace\/diagnostic-frame-v2"/);
  assert.match(server, /workspace-diagnostic-protocol-v2\.mjs/);
  assert.match(server, /"\/api\/workspace\/diagnostic-protocol-v2"/);
  assert.match(server, /import workspaceDiagnosticParticipants/);
  assert.match(server, /"\/api\/workspace\/diagnostic-participants"/);
  assert.match(server, /import workspaceDiagnosticProtocol/);
  assert.match(server, /"\/api\/workspace\/diagnostic-protocol"/);
  assert.match(server, /import workspaceDiagnosticInvitations/);
  assert.match(server, /"\/api\/workspace\/diagnostic-invitations"/);
  assert.match(server, /import workspaceDiagnosticParticipation/);
  assert.match(server, /"\/api\/workspace\/diagnostic-participation"/);
  assert.match(server, /import workspaceDiagnosticInterview/);
  assert.match(server, /"\/api\/workspace\/diagnostic-interview"/);
  assert.match(server, /"\/api\/workspace\/diagnostic-interview-v2"/);
  assert.match(script, /currentParticipation\.interviewVersion==="2\.0\.0"/);
  assert.match(script, /\/api\/workspace\/diagnostic-interview-v2/);
  assert.match(server, /"\/api\/workspace\/diagnostic-evidence-review"/);
  assert.match(server, /"\/api\/workspace\/diagnostic-evidence-preparation"/);
  assert.match(server, /"\/api\/workspace\/diagnostic-synthesis"/);
  assert.match(server, /"\/api\/workspace\/diagnostic-leadership-validation"/);
  assert.match(server, /"\/api\/workspace\/diagnostic-intervention"/);
  assert.match(server, /"\/api\/workspace\/diagnostic-intervention-acceptance"/);
  assert.match(server, /"\/api\/workspace\/capacity-operating-brief"/);
  assert.match(server, /"\/api\/workspace\/capacity-brief-evidence"/);
  assert.match(server, /"\/api\/workspace\/capacity-brief-reviews"/);
  assert.match(server, /"\/api\/workspace\/diagnostic-reassessment"/);
  assert.match(server, /"\/api\/workspace\/diagnostic-reassessment-comparison"/);
  assert.match(server, /"\/api\/workspace\/commerce-checkout"/);
  assert.match(server, /"\/api\/commerce\/stripe-webhook"/);
  assert.match(script, /workspaceRequest\("\/api\/workspace\/invitations"/);
  assert.match(script, /workspaceRequest\("\/api\/workspace\/participation"/);
  assert.match(script, /\/api\/workspace\/results\?roundId=/);
  assert.doesNotMatch(script, /CLERK_SECRET_KEY|NEON_DATABASE_URL|workspaceId|userId/);
  assert.match(script, /This local workspace server is out of date/);
});

test("workspace keeps assessment collection separate from paid diagnostic engagement", async () => {
  const html = await source("workspace/index.html");
  const script = await source("workspace/workspace.js");
  const operationsScript = await source("workspace/operations.js");
  assert.match(html, /Organizational Capacity Diagnostic · Executive sponsor view/);
  assert.match(html, /This is separate from the lightweight assessment/);
  assert.match(html, /Senger Advisory establishes the engagement, route, and entitlement in Platform Operations/);
  assert.doesNotMatch(html, /data-create-diagnostic/);
  assert.doesNotMatch(script, /method:\s*"POST"[\s\S]{0,300}\/api\/workspace\/diagnostics/);
  assert.match(script, /Payment and access pending/);
  assert.match(script, /No human review required/);
  assert.match(html, /Approve the Diagnostic Context Brief/);
  assert.match(html, /What should we know about your organization right now/);
  assert.match(html, /What is most important for the organization to accomplish/);
  assert.match(html, /What is happening that made you look into this now/);
  assert.match(html, /What decision do you need this diagnostic to help you make/);
  assert.match(html, /What have you already tried\? What happened/);
  assert.match(html, /Question 1 of 6/);
  assert.match(html, /What is at risk\?/);
  assert.match(html, /Review before approval/);
  assert.match(script, /showDiagnosticContextStep/);
  assert.match(script, /renderDiagnosticContextReview/);
  assert.match(html, /not a predetermined diagnosis/);
  assert.match(html, /One per line, up to twelve/);
  assert.match(script, /Participant design is now the next governed step/);
  assert.match(html, /Design for coverage, not convenience/);
  assert.match(html, /requires at least five participants and allows no more than ten/);
  assert.match(html, /Five is\s+enough to proceed/);
  assert.match(html, /Participants 6–10 are optional/);
  assert.match(html, /Choose what must be represented/);
  assert.match(html, /Plan the perspectives/);
  assert.match(html, /Choose for insight, not convenience/);
  assert.match(html, /Review coverage and approve/);
  assert.match(script, /Minimum cohort reached/);
  assert.match(html, /Identity is added only after this plan is approved/);
  assert.match(script, /workspaceRequest\("\/api\/workspace\/diagnostic-participants"/);
  assert.match(script, /Coverage gaps need a design change or an explicit acceptance reason/);
  assert.match(html, /Review the 15-question protocol/);
  assert.match(html, /Every participant receives this same contextualized core protocol/);
  assert.match(script, /workspaceRequest\("\/api\/workspace\/diagnostic-protocol"/);
  assert.match(script, /Validating coverage and approving the common protocol/);
  assert.match(html, /Invite the approved perspectives/);
  assert.match(html, /Who started, who submitted/);
  assert.doesNotMatch(script, /slot\.collectionStatus/);
  assert.match(script, /workspaceRequest\("\/api\/workspace\/diagnostic-invitations"/);
  assert.match(html, /data-diagnostic-collection-progress/);
  assert.match(script, /Client sponsor · POC workspace/);
  assert.match(script, /Frame the decision this diagnostic must inform/);
  assert.match(script, /Begin diagnostic discovery/);
  assert.match(script, /if \(diagnostics\.length\)/);
  assert.match(script, /if \(currentOwnerDiagnostic\)/);
  assert.match(script, /Completed perspectives/);
  assert.doesNotMatch(script, /slot\.interviewAnswers|slot\.encryptedResponse/);
  assert.match(script, /workspaceRequest\("\/api\/workspace\/diagnostic-participation"/);
  assert.match(operationsScript, /\/api\/operations\/diagnostic-v2-activation/);
  assert.match(script, /Accept the diagnostic privacy notice/);
  assert.match(html, /Save private draft/);
  assert.match(html, /Submit diagnostic interview/);
  assert.match(script, /"\/api\/workspace\/diagnostic-interview-v2":"\/api\/workspace\/diagnostic-interview"/);
  assert.match(script, /Your confidential diagnostic interview is complete\./);
  assert.match(script, /Submission confirmed\. No further action is required right now\./);
  assert.match(script, /Saving encrypted draft/);
  assert.match(script, /Evidence-depth review requested/);
  assert.match(script, /data-follow-up-answer/);
  assert.match(script, /setTimeout\(\(\)=>saveInterviewDraft\(\),1200\)/);
  assert.match(script, /currentParticipation\?\.kind === "diagnostic"/);
  assert.match(script, /beforeunload/);
  assert.doesNotMatch(script, /diagnostic\.individualAnswers|diagnostic\.participantIdentity/);
});

test("Platform Operations is separate, allowlisted, and excludes participant content",async()=>{
  const html=await source("workspace/operations.html"),script=await source("workspace/operations.js"),server=await source("scripts/workspace-dev-server.mjs"),auth=await source("netlify/lib/platform-operations-auth.mjs");
  assert.match(html,/Senger Advisory authority/);
  assert.match(html,/Participant identity, responses, excerpts, and individual scores never appear here/);
  assert.match(html,/Create diagnostic engagement/);
  assert.match(script,/\/api\/operations\/overview/);
  assert.match(script,/\/api\/operations\/diagnostics/);
  assert.match(auth,/PLATFORM_OPERATOR_USER_IDS/);
  assert.match(auth,/authority: "platform-operator"/);
  assert.match(server,/platformOperationsOverview/);
  assert.match(server,/platformOperationsDiagnostics/);
  assert.doesNotMatch(script,/participantIdentity|answerText|encrypted_response_payload|individualScores/);
});

test("Platform Operations requires complete POC enrollment confirmation", async () => {
  const [html, script, enrollment] = await Promise.all([
    source("workspace/operations.html"),
    source("workspace/operations.js"),
    source("netlify/lib/platform-operations-client-provisioning.mjs")
  ]);
  assert.match(html, /five-to-ten participant range/);
  assert.match(html, /scopeConfirmed/);
  assert.match(html, /privacyBriefConfirmed/);
  assert.match(script, /formData\.has\("scopeConfirmed"\)/);
  assert.match(script, /formData\.has\("privacyBriefConfirmed"\)/);
  assert.match(enrollment, /value\.scopeConfirmed !== true/);
  assert.match(enrollment, /value\.privacyBriefConfirmed !== true/);
});

test("participant entry requires a privacy acknowledgement before assessment navigation", async () => {
  const html = await source("workspace/index.html");
  const script = await source("workspace/workspace.js");
  assert.match(html, /I understand how my workspace assessment will be used/);
  assert.match(html, /Begin private assessment/);
  assert.match(script, /noticeVersion:\s*currentParticipation\.noticeVersion/);
  assert.match(script, /workspaceRound/);
});

test("POC opening explains the Capacity Lens before versioned participant terms", async () => {
  const [html, script, participation, privacy] = await Promise.all([
    source("workspace/index.html"),
    source("workspace/workspace.js"),
    source("netlify/lib/workspace-diagnostic-participation.mjs"),
    source("privacy.html")
  ]);
  for (const phrase of ["Organizational capacity", "Constraint", "Friction", "Capacity Compensation", "Priority &amp; Attention", "Authority &amp; Accountability", "Information &amp; Sensemaking", "Coordination", "Resource &amp; Capability Deployment"]) assert.match(html, new RegExp(phrase));
  assert.match(html, /inquiry lenses—not scores or predetermined explanations/);
  assert.match(html, /Participation is voluntary/);
  assert.match(html, /processed by the platform and AI to assist synthesis/);
  assert.match(html, /never your raw answers, attributed excerpts, or an individual score/);
  assert.match(script, /agree to the diagnostic participation and confidentiality terms/);
  assert.match(participation, /DIAGNOSTIC_NOTICE_VERSION = "2\.0\.0"/);
  assert.match(privacy, /id="diagnostic-participation"/);
  assert.match(privacy, /AI output does not release a finding without governed human review/);
});

test("sponsor workspace explains the full diagnostic journey before the current task", async () => {
  const html = await readFile(new URL("../workspace/index.html", import.meta.url), "utf8");
  const script = await readFile(new URL("../workspace/workspace.js", import.meta.url), "utf8");

  assert.match(html, /data-sponsor-guide/);
  assert.match(html, /Know the process before you begin/);
  assert.match(html, /Start with the Sponsor Context Brief/);
  assert.match(html, /Identify 5–10 people|Choose the perspectives/);
  assert.match(html, /results remain hidden until at least five people respond/i);
  assert.match(html, /href="#poc-support"/);
  assert.ok(html.indexOf("data-sponsor-guide") < html.indexOf("id=\"current-focus\""));
  assert.match(script, /sponsorGuide\.hidden = session\.role !== "org:admin"/);
});

test("every sponsor context response uses a specific question and neutral reflective prompt", async () => {
  const html = await readFile(new URL("../workspace/index.html", import.meta.url), "utf8");
  const contextForm = html.match(/<form class="diagnostic-context-form"[\s\S]*?<\/form>/)?.[0] || "";
  const textareas = [...contextForm.matchAll(/<textarea\b([^>]*)>/g)];

  assert.ok(textareas.length >= 8);
  assert.doesNotMatch(contextForm, /<span>Your answer<\/span>/);
  for (const [, attributes] of textareas) assert.match(attributes, /placeholder="[^"]+"/);
});

test("workspace assessment submits aggregate scores without individual answers or identity", async () => {
  const html = await source("assessment.html");
  const script = await source("assessment.js");
  assert.match(html, /Individual answers remain in this browser/);
  assert.match(script, /fetch\("\/api\/workspace\/submission"/);
  assert.match(script, /domainScores:/);
  assert.match(script, /nextAction\.textContent = "Return to workspace"/);
  assert.doesNotMatch(script, /workspaceSubmission\(\)[\s\S]{0,700}(responses|emailAddress|userId)/);
});

test("owner collection setup presents dates and the fixed privacy threshold", async () => {
  const html = await source("workspace/index.html");
  const script = await source("workspace/workspace.js");
  assert.match(html, /Create a collection round/);
  assert.match(html, /Participation opens/);
  assert.match(html, /Participation closes/);
  assert.match(html, /valid submissions required before shared results appear/);
  assert.match(html, /Submission count is not connected to the invitation list/);
  assert.match(html, /Draft reminders for nonrespondents/);
  assert.match(script, /Accepted · not started/);
  assert.match(script, /Assessment started/);
  assert.match(script, /Submitted/);
  assert.match(script, /mailto:/);
  assert.match(html, /Shared constraint hypothesis/);
  assert.match(html, /not a benchmark, consensus score, or measure of individual performance/);
  assert.match(script, /Decision ownership and closure may not be scaling/);
  assert.match(html, /Turn the signal into a testable commitment/);
  assert.match(html, /Responsible owner/);
  assert.match(script, /\/api\/workspace\/action-cycles/);
  assert.match(script, /Review observation/);
  assert.match(script, /method:\s*"PATCH"/);
  assert.match(script, /review overdue/);
  assert.match(script, /Create linked follow-up draft/);
  assert.match(script, /action:\s*"close"/);
  assert.match(script, /\/api\/workspace\/comparison\?roundId=/);
  assert.match(html, /What changed between collection rounds/);
});

test("workspace authentication always returns to the workspace route", async () => {
  const script = await source("workspace/workspace.js");
  assert.match(script, /new URL\("\/workspace\/", window\.location\.origin\)\.href/);
  assert.match(script, /forceRedirectUrl:\s*returnUrl/);
  assert.match(script, /signUpForceRedirectUrl:\s*returnUrl/);
  assert.match(script, /signUpFallbackRedirectUrl:\s*returnUrl/);
  assert.doesNotMatch(script, /afterSignInUrl|afterSignUpUrl/);
});

test("workspace has a route-only Clerk CSP and authentication return fallback", async () => {
  const config = await source("netlify.toml");
  assert.match(config, /for = "\/workspace\/\*"/);
  assert.match(config, /https:\/\/\*\.clerk\.accounts\.dev/);
  assert.match(config, /https:\/\/challenges\.cloudflare\.com/);
  assert.match(config, /from = "\/workspace\/\*"\s+to = "\/workspace\/index\.html"\s+status = 200/);
  assert.match(config, /https:\/\/clerk\.sengeradvisory\.com/);
  assert.match(config, /https:\/\/accounts\.sengeradvisory\.com/);
  assert.match(config, /from = "\/poc"\s+to = "\/workspace\/"\s+status = 302/);
});

test("workspace remains excluded from search crawling", async () => {
  const robots = await source("robots.txt");
  assert.match(robots, /Disallow: \/workspace\//);
});

test("workspace provides identity-separated POC operating support", async () => {
  const [html, script, playbook] = await Promise.all([
    source("workspace/index.html"),
    source("workspace/workspace.js"),
    source("docs/POC-Operating-Support-Playbook.md")
  ]);
  assert.match(html, /name="poc-operating-support"/);
  assert.match(html, /Do not include diagnostic answers, interview excerpts, participant names/);
  assert.match(html, /Possible confidentiality concern/);
  assert.match(script, /POC-\$\{crypto\.randomUUID/);
  assert.match(script, /application\/x-www-form-urlencoded/);
  assert.match(script, /Support request received\. Keep this reference/);
  assert.match(playbook, /S0 — confidentiality or tenant safety/);
  assert.match(playbook, /Do not ask for passwords, authentication codes, recovery links, API keys, or encryption keys/);
  assert.match(playbook, /support records are operational product data, not diagnostic evidence/i);
});

test("every POC role surface inherits the published Senger Advisory brand system", async () => {
  const [workspace, advisor, operations, presenter] = await Promise.all([
    "workspace/workspace.css",
    "workspace/advisor.css",
    "workspace/operations.css",
    "workspace/presenter-demo.css"
  ].map(source));
  assert.match(workspace, /--midnight: #111c2e/);
  assert.match(workspace, /--ink: #161c25/);
  assert.match(workspace, /--paper: #fffdf8/);
  assert.match(workspace, /--orange: #d45b31/);
  assert.match(workspace, /border-bottom: 4px solid var\(--orange\)/);
  assert.match(workspace, /font-family: Arial, "Helvetica Neue", sans-serif/);
  assert.match(workspace, /\.operations-links\s*\{[\s\S]*?gap:\s*18px/);
  assert.match(workspace, /\.operations-links a\s*\{[\s\S]*?font-weight:\s*700/);
  assert.match(advisor, /font-family: var\(--serif\)/);
  for (const stylesheet of [workspace, advisor, operations, presenter]) {
    assert.doesNotMatch(stylesheet, /#a46b38|#70451f|#1c1c1c|#676767/);
  }
});

test("advisor console is separate, assignment-scoped, and excludes raw interview fields", async () => {
  const html = await readFile(new URL("../workspace/advisor.html", import.meta.url), "utf8");
  const advisor = await readFile(new URL("../workspace/advisor.js", import.meta.url), "utf8");
  assert.match(html, /Advisor Operating Console/);
  assert.match(html, /Frame and test organizational capacity/);
  assert.match(html, /active, time-bounded advisor assignment/);
  assert.match(advisor, /diagnostic-advisor-assignments/);
  assert.match(html, /Define capacity for what/);
  assert.match(html, /Complexity Profile/);
  assert.match(html, /evidence hypothesis—not a sponsor conclusion/);
  assert.match(advisor, /diagnostic-frame-v2/);
  assert.match(advisor, /current-and-anticipated/);
  assert.match(advisor, /The live v1 diagnostic remains unchanged/);
  assert.match(html, /Evidence Protocol v2/);
  assert.match(html, /shared inquiry/);
  assert.match(html, /Adaptive Capacity remains a research observation/);
  assert.match(advisor, /diagnostic-protocol-v2/);
  assert.match(advisor, /evidenceLayerId/);
  assert.match(advisor, /Participant collection remains on v1/);
  assert.match(advisor, /diagnostic-evidence-preparation/);
  assert.match(advisor, /diagnostic-evidence-review/);
  assert.match(advisor, /diagnostic-synthesis/);
  assert.match(html, /Only advisor-approved de-identified evidence enters this draft/);
  assert.match(html, /Advisor validation/);
  assert.match(html, /It does not release the finding or replace client leadership validation/);
  assert.match(advisor, /Competing explanations/);
  assert.match(advisor, /Blind spots/);
  assert.match(advisor, /Confidence basis/);
  assert.match(advisor, /method:"PATCH"/);
  assert.match(html, /Governed intervention design/);
  assert.match(advisor, /Leadership validation must be accepted before intervention design becomes available/);
  assert.match(html, /Platform-guided intervention/);
  assert.match(html, /Advisor-guided intervention/);
  assert.match(html, /Accountable commitment/);
  assert.match(html, /Observed operating change/);
  assert.match(html, /Reassessed capacity change/);
  assert.match(html, /Create governed proposal/);
  assert.match(html, /data-advisor-sign-out/);
  assert.match(advisor, /POC boundary reached/);
  assert.match(advisor, /Detailed design, delivery, and reassessment begin only after paid activation/);
  assert.match(advisor, /forceRedirectUrl:"\/workspace\/advisor\.html"/);
  assert.match(advisor, /clerk\?\.signOut/);
  assert.match(advisor, /evidenceClass:"delivery"/);
  assert.match(advisor, /evidenceClass:"operating-change"/);
  assert.match(advisor, /evidenceClass:"capacity-change"/);
  assert.doesNotMatch(advisor, /answerText|encrypted_response_payload|sourceInterviewId/);
  assert.match(advisor, /Mechanisms implicated — not scored/);
  assert.match(advisor, /Boundary conditions/);
});

test("client sponsor receives only a confidentiality-gated governed finding", async () => {
  const html = await source("workspace/index.html");
  const script = await source("workspace/workspace.js");
  const advisorHtml = await source("workspace/advisor.html");
  const advisorScript = await source("workspace/advisor.js");
  assert.match(html, /Review the governed organizational finding/);
  assert.match(html, /Participant identity, raw responses, evidence excerpts, and advisor notes remain excluded/);
  assert.match(script, /diagnostic-leadership-validation/);
  assert.match(script, /No participant-level or organizational finding data has been released/);
  assert.match(html, /Does this finding reflect the organizational condition/);
  assert.match(html, /material objection that must be resolved/);
  assert.match(script, /Finding accepted\. Intervention design is the next governed gate/);
  assert.match(html, /Review the proposed operating intervention/);
  assert.match(html, /I accept the proposed intervention scope/);
  assert.match(html, /I accept the commercial terms/);
  assert.match(script, /Payment and intervention access must be verified/);
  assert.match(script, /Capacity Operating Brief activation is the next gate/);
  assert.match(html, /Keep the constraint, intervention, and evidence in view/);
  assert.match(html, /not a generic dashboard/);
  assert.match(html, /Activate Capacity Operating Brief/);
  assert.match(script, /Current diagnosed constraint/);
  assert.match(script, /Uncertainty kept visible/);
  assert.doesNotMatch(script, /supportingEvidenceIds|participantIdentity|rawResponse/);
  assert.match(html, /Record what is observed—not what the intervention is assumed to have caused/);
  assert.match(html, /Intervention delivery/);
  assert.match(html, /Observed operating change/);
  assert.match(html, /Reassessed capacity change/);
  assert.match(html, /Record evidence observation/);
  assert.match(html, /Use the evidence to continue, adjust, escalate, stop, or begin reassessment/);
  assert.match(html, /Record intervention review/);
  assert.match(script, /evidenceAssessment/);
  assert.match(html, /Begin reassessment/);
  assert.match(html, /Repeat the diagnostic without weakening the comparison/);
  assert.match(html, /Comparison is unavailable until a qualifying reassessment is complete/);
  assert.match(script, /loadReassessment/);
  assert.match(script, /Plan governed reassessment/);
  assert.match(script, /Open reassessment collection/);
  assert.match(script, /Participant identities and response content are not copied/);
  assert.match(html, /data-reassessment-comparison/);
  assert.match(script, /Governed comparison/);
  assert.match(advisorHtml, /Release only evidence-traceable change/);
  assert.match(advisorScript, /No causal claim was created/);
  assert.match(script, /Complete payment/);
  assert.match(script, /commerce-checkout/);
  assert.match(html, /Pay for intervention/);
  assert.match(html, /Learning Path/);
  assert.match(html, /Completion records implementation/);
  assert.match(script, /capacity-brief-learning/);
  assert.match(html, /30 \/ 60 \/ 90-day Action Path/);
  assert.match(script, /capacity-brief-action-path/);
  assert.match(html, /Guided check-ins/);
  assert.match(script, /capacity-brief-check-ins/);
  assert.match(html, /What needs attention now/);
  assert.match(script, /capacity-brief-attention/);
  assert.match(html, /Escalate to advisor support/);
  assert.match(script, /intervention-advisor-escalation/);
  assert.match(advisorHtml, /Advisor support queue/);
  assert.match(advisorScript, /advisor-escalation-queue/);
  assert.match(html, /Decision History/);
  assert.match(script, /capacity-brief-decision-history/);
  assert.match(html, /Platform-guided setup/);
  assert.match(script, /capacity-brief-guided-plan/);
  assert.match(html, /POC learning checkpoint/);
  assert.match(html, /value="sponsor-setup"/);
  assert.match(html, /value="finding-release"/);
  assert.match(html, /value="final-debrief"/);
  assert.doesNotMatch(script, /sponsorPocFeedback\.hidden=data\.state!=="active"/);
  assert.match(html, /Optional product feedback/);
  assert.match(script, /workspace\/poc-feedback/);
  assert.match(advisorHtml, /POC scorecard/);
  assert.match(advisorScript, /workspace\/poc-scorecard/);
  assert.match(advisorHtml, /POC cohort decision/);
  assert.match(advisorScript, /workspace\/poc-cohort-decisions/);
  assert.match(advisorHtml, /POC change ledger/);
  assert.match(advisorScript, /workspace\/poc-change-candidates/);
  assert.match(script, /currentClerkContextKey\(\) === clerkContextKey/);
  assert.match(script, /workspaceRenderPromise/);
  assert.match(script, /beginDiagnosticCheckout\(selectedDiagnosticId,"intervention"\)/);
  assert.doesNotMatch(script, /supportingEvidenceIds|weakeningEvidenceIds|advisorReviewNote/);
});

test("guided presenter demo is fictional, resettable, and disconnected from live records", async () => {
  const html = await source("workspace/presenter-demo.html");
  const script = await source("workspace/presenter-demo.js");
  const server = await source("scripts/workspace-dev-server.mjs");
  assert.match(html, /Private guided demo/);
  assert.match(html, /fictional organization/i);
  assert.match(html, /Nothing is saved, submitted, or connected to a live client workspace/);
  assert.match(html, /data-role="sponsor"/);
  assert.match(html, /data-role="participant"/);
  assert.match(script, /label:"Assessment"/);
  assert.match(script, /label:"Choose diagnostic"/);
  assert.match(script, /label:"Six sponsor prompts"/);
  assert.match(script, /label:"Invite the cohort"/);
  assert.match(script, /label:"Participant experience"/);
  assert.match(script, /label:"Privacy threshold"/);
  assert.match(script, /label:"De-identify & synthesize"/);
  assert.match(script, /label:"Results & intervention"/);
  assert.match(script, /Capacity Operating Brief/);
  assert.match(script, /data-brief-view/);
  assert.match(script, /data-intake/);
  assert.match(script, /data-cohort-range/);
  assert.match(script, /data-add-submission/);
  assert.match(script, /Organizational results remain hidden/);
  assert.match(script, /de-identified and disclosure-reviewed/);
  assert.match(script, /Separate from this controlled demo/);
  assert.doesNotMatch(script, /pressure test|Pressure Test/);
  assert.match(script, /Your confidential diagnostic interview is complete/);
  assert.match(script, /Question 6 of 15/);
  assert.doesNotMatch(script, /fetch\(|workspaceRequest\(|localStorage|sessionStorage/);
  assert.match(server, /"\/workspace\/presenter-demo\.html"/);
});

test("workspace surfaces load Clerk organization memberships before activating the sole organization", async () => {
  const workspaceScript = await source("workspace/workspace.js");
  const operationsScript = await source("workspace/operations.js");
  const advisorScript = await source("workspace/advisor.js");

  for (const script of [workspaceScript, operationsScript, advisorScript]) {
    assert.match(script, /getOrganizationMemberships/);
    assert.match(script, /totalCount/);
    assert.match(script, /session\?\.getToken\(\)/);
    assert.match(script, /Authorization/);
    assert.match(script, /organizationId/);
    assert.match(script, /clearCache\(\)/);
    assert.match(script, /setActive\(\{\s*organization(?::|\s*\})/);
    assert.doesNotMatch(script, /return Boolean\(clerk\.organization\)/);
  }
});

test("Platform Operations switches only through verified Clerk organization memberships", async () => {
  const html = await source("workspace/operations.html");
  const script = await source("workspace/operations.js");
  assert.match(html, /data-organization-select/);
  assert.match(script, /getOrganizationMemberships\(\{pageSize:100\}\)/);
  assert.match(script, /Switching the active client organization/);
  assert.match(script, /setActive\(\{organization\}\)/);
  assert.match(script, /session\?\.clearCache\(\)/);
});
