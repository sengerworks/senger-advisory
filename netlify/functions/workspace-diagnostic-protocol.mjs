import { authorizeWorkspaceAction } from "../../workspace-authorization.js";
import { authenticateWorkspaceRequest } from "../lib/clerk-workspace-auth.mjs";
import { DiagnosticContextInputError, validateDiagnosticContextId } from "../lib/workspace-diagnostic-context.mjs";
import { createOpenAIDiagnosticQuestionReframer, DiagnosticQuestionReframeProviderError, signDiagnosticQuestionRevision } from "../lib/openai-diagnostic-question-reframe.mjs";
import {
  approveWorkspaceDiagnosticProtocol,
  DiagnosticProtocolInputError,
  DiagnosticProtocolStateError,
  getWorkspaceDiagnosticProtocol,
  workspaceDiagnosticProtocolPolicy
} from "../lib/workspace-diagnostic-protocol.mjs";

const headers = { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8", "X-Content-Type-Options": "nosniff" };
function json(status, body) { return new Response(JSON.stringify(body), { status, headers }); }
async function jsonBody(request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new DiagnosticProtocolInputError("Use application/json.");
  const text = await request.text();
  if (text.length > 65536) throw new DiagnosticProtocolInputError("Request too large.");
  try { return JSON.parse(text); } catch { throw new DiagnosticProtocolInputError("Enter valid protocol details."); }
}

export function createWorkspaceDiagnosticProtocolHandler({
  authenticate = authenticateWorkspaceRequest,
  getProtocol = getWorkspaceDiagnosticProtocol,
  approveProtocol = approveWorkspaceDiagnosticProtocol,
  reframeQuestion = null
} = {}) {
  return async request => {
    if (!["GET", "POST"].includes(request.method)) return json(405, { error: "Method not allowed." });
    const url = new URL(request.url);
    const origin = request.headers.get("origin");
    if (origin && origin !== url.origin) return json(403, { error: "Origin not allowed." });
    try {
      const auth = await authenticate(request);
      if (!auth.ok) return json(auth.status, { error: "Workspace access unavailable." });
      const action = request.method === "GET" ? "diagnostic:read" : "diagnostic:update";
      if (!authorizeWorkspaceAction({ role: auth.value.role, action })) {
        return json(403, { error: "Only workspace administrators can review the diagnostic protocol." });
      }
      if (request.method === "GET") {
        const diagnosticId = validateDiagnosticContextId(url.searchParams.get("diagnosticId"));
        const result = await getProtocol(auth.value.workspaceId, diagnosticId);
        return json(200, { ...result, policy: workspaceDiagnosticProtocolPolicy });
      }
      const input = await jsonBody(request);
      if (input?.action === "reframe-question") {
        if (Object.keys(input).sort().join(",") !== "action,currentQuestion,diagnosticId,reason,templateId") throw new DiagnosticProtocolInputError("Only the governed question revision fields are accepted.");
        const diagnosticId = validateDiagnosticContextId(input.diagnosticId);
        const result = await getProtocol(auth.value.workspaceId, diagnosticId);
        if (result.protocol || !result.draft) throw new DiagnosticProtocolStateError("The approved protocol can no longer be revised.");
        const question = result.draft.questions.find(candidate => candidate.templateId === input.templateId);
        if (!question) throw new DiagnosticProtocolInputError("Choose a governed protocol question.");
        if (!workspaceDiagnosticProtocolPolicy.revisionReasons.includes(input.reason)) throw new DiagnosticProtocolInputError("Choose a supported revision reason.");
        const currentQuestion = String(input.currentQuestion || "").trim();
        if (currentQuestion.length < 20 || currentQuestion.length > 600) throw new DiagnosticProtocolInputError("The question is outside the governed boundary.");
        const provider = reframeQuestion || createOpenAIDiagnosticQuestionReframer();
        const questionText = await provider({
          questionText: currentQuestion,
          canonicalQuestion: question.questionText,
          reason: input.reason,
          evidenceObjectiveId: question.evidenceObjectiveId,
          domainId: question.domainId
        });
        const revision = { templateId: question.templateId, reason: input.reason, questionText };
        revision.token = signDiagnosticQuestionRevision({ diagnosticId, templateId: question.templateId, reason: input.reason, priorQuestion: currentQuestion, questionText });
        return json(200, { revision });
      }
      return json(201, {
        protocol: await approveProtocol({
          workspaceId: auth.value.workspaceId,
          actorUserId: auth.value.userId,
          input
        })
      });
    } catch (error) {
      if (error instanceof DiagnosticProtocolInputError || error instanceof DiagnosticContextInputError) return json(400, { error: error.message });
      if (error instanceof DiagnosticProtocolStateError) return json(409, { error: error.message });
      if (error instanceof DiagnosticQuestionReframeProviderError) return json(503, { error: "The question could not be reframed right now. Please try again." });
      console.error("Workspace diagnostic protocol operation failed", error instanceof Error ? error.message : "Unknown error");
      return json(503, { error: "Protocol review is temporarily unavailable." });
    }
  };
}

export default createWorkspaceDiagnosticProtocolHandler();
export const config = { path: "/api/workspace/diagnostic-protocol", rateLimit: { windowLimit: 30, windowSize: 60, aggregateBy: ["ip", "domain"] } };
