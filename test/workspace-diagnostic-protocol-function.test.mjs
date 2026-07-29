import test from "node:test";
import assert from "node:assert/strict";
import { createWorkspaceDiagnosticProtocolHandler } from "../netlify/functions/workspace-diagnostic-protocol.mjs";
import {
  compileWorkspaceDiagnosticProtocol,
  DiagnosticProtocolInputError,
  DiagnosticProtocolStateError,
  validateWorkspaceDiagnosticProtocolApproval,
  workspaceDiagnosticProtocolPolicy
} from "../netlify/lib/workspace-diagnostic-protocol.mjs";
import { WORKSPACE_ROLES } from "../workspace-authorization.js";

const workspaceId = "11111111-1111-4111-8111-111111111111";
const diagnosticId = "22222222-2222-4222-8222-222222222222";
const source = {
  contextBriefId: "33333333-3333-4333-8333-333333333333",
  participantPlanId: "44444444-4444-4444-8444-444444444444",
  context: {
    strategicPriority: "Scale delivery without making every decision dependent on the founders.",
    decisionNeeded: "Determine which operating constraint leadership should address first.",
    recentChanges: ["Added two functional leaders"],
    priorInterventions: ["Clarified the executive meeting cadence"]
  }
};
const draft = compileWorkspaceDiagnosticProtocol({ diagnosticId, ...source });
const approval = {
  diagnosticId,
  questions: draft.questions.map(question => ({
    templateId: question.templateId,
    questionText: question.questionText,
    contextualizationNote: question.contextualizationNote
  })),
  approvalNote: "Reviewed for neutrality, coverage, and relevance to the approved context."
};

function request(method = "GET", body, query = `?diagnosticId=${diagnosticId}`, origin = "https://example.com") {
  return new Request(`https://example.com/api/workspace/diagnostic-protocol${query}`, {
    method,
    headers: { origin, ...(body === undefined ? {} : { "content-type": "application/json" }) },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}
function authentication(role = WORKSPACE_ROLES.owner) {
  return async () => ({ ok: true, value: { role, workspaceId, userId: "user_owner" } });
}

test("compiles a cautious contextualized protocol without changing governed coverage", () => {
  assert.equal(draft.questions.length, 15);
  assert.match(draft.questions[0].questionText, /approved strategic priority/i);
  assert.equal(new Set(draft.questions.map(question => question.domainId)).size, 6);
  assert.equal(new Set(draft.questions.map(question => question.evidenceObjectiveId)).size, 6);
  assert.equal(workspaceDiagnosticProtocolPolicy.sameCoreProtocolForEveryParticipant, true);
});

test("approval requires all governed questions and an explicit note", () => {
  const validated = validateWorkspaceDiagnosticProtocolApproval(approval, source);
  assert.equal(validated.questions.length, 15);
  assert.throws(() => validateWorkspaceDiagnosticProtocolApproval({ ...approval, approvalNote: "" }, source), DiagnosticProtocolInputError);
  assert.throws(() => validateWorkspaceDiagnosticProtocolApproval({ ...approval, questions: approval.questions.slice(1) }, source), DiagnosticProtocolInputError);
});

test("administrators retrieve and approve the protocol in their workspace", async () => {
  let approved;
  const protocol = { id: "protocol-1", diagnosticId, questions: draft.questions };
  const handler = createWorkspaceDiagnosticProtocolHandler({
    authenticate: authentication(),
    getProtocol: async (actualWorkspaceId, actualDiagnosticId) => {
      assert.equal(actualWorkspaceId, workspaceId);
      assert.equal(actualDiagnosticId, diagnosticId);
      return { protocol: null, draft };
    },
    approveProtocol: async value => { approved = value; return protocol; }
  });
  const response = await handler(request());
  assert.equal(response.status, 200);
  assert.equal((await response.json()).draft.questions.length, 15);
  assert.equal((await handler(request("POST", approval, ""))).status, 201);
  assert.equal(approved.actorUserId, "user_owner");
});

test("participants, foreign origins, invalid IDs, and lifecycle conflicts fail closed", async () => {
  const participant = createWorkspaceDiagnosticProtocolHandler({ authenticate: authentication(WORKSPACE_ROLES.participant) });
  assert.equal((await participant(request())).status, 403);
  const owner = createWorkspaceDiagnosticProtocolHandler({ authenticate: authentication() });
  assert.equal((await owner(request("GET", undefined, "?diagnosticId=bad"))).status, 400);
  assert.equal((await owner(request("GET", undefined, `?diagnosticId=${diagnosticId}`, "https://attacker.example"))).status, 403);
  const conflict = createWorkspaceDiagnosticProtocolHandler({
    authenticate: authentication(),
    approveProtocol: async () => { throw new DiagnosticProtocolStateError("Participant design required."); }
  });
  assert.equal((await conflict(request("POST", approval, ""))).status, 409);
});
