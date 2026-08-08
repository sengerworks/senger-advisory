import { approveDiagnosticProtocolV2, createDiagnosticProtocolV2, diagnosticProtocolPolicyV2, evaluateDiagnosticProtocolV2 } from "../../diagnostic-protocol-engine-v2.js";
import { diagnosticQuestionTemplatesV2, recommendedDiagnosticTemplateIdsV2 } from "../../diagnostic-question-library-v2.js";
import { withNeonWorkspaceTransaction } from "./neon-workspace-database.mjs";
import { validateDiagnosticContextId } from "./workspace-diagnostic-context.mjs";
import { requireAdvisorAssignment } from "./workspace-diagnostic-evidence-review.mjs";

export class DiagnosticProtocolV2InputError extends Error {}
export class DiagnosticProtocolV2StateError extends Error {}

const templateById = new Map(diagnosticQuestionTemplatesV2.map(template => [template.id, template]));

function bounded(value, maximum = 180) {
  const text = String(value || "").trim().replace(/\s+/g, " ");
  return text.length <= maximum ? text : `${text.slice(0, maximum - 1).trim()}…`;
}

function frameCue(template, frame) {
  const cues = {
    "execution-demand-translation": `Keep this execution commitment in view: ${bounded(frame.executionDemand.commitment)}\n\n`,
    "complexity-change": `Test this framed demand: ${bounded(frame.diagnosticQuestion)}\n\n`,
    "necessary-unnecessary": `Distinguish complexity inherent to this commitment from complexity created by current operating choices.\n\n`,
    "signal-consequence": frame.performanceConsequences.length ? `Consider the framed exposure: ${bounded(frame.performanceConsequences.join("; "))}\n\n` : "",
    "capacity-compensation": `Keep this failure exposure in view: ${bounded(frame.executionDemand.failureExposure)}\n\n`,
    "non-capacity-alternative": `The leadership decision this must inform is: ${bounded(frame.leadershipDecision)}\n\n`,
    "future-demand": `Use this time horizon: ${bounded(frame.executionDemand.timeHorizon, 100)}\n\n`
  };
  return cues[template.id] || "";
}

export function compileWorkspaceDiagnosticProtocolV2(frame, options = {}) {
  try {
    const questions = recommendedDiagnosticTemplateIdsV2.map(templateId => {
      const template = templateById.get(templateId);
      const cue = frameCue(template, frame);
      return {
        templateId,
        questionText: `${cue}${template.question}`,
        contextualizationNote: cue ? "Bounded approved-frame context added; canonical evidence objective preserved." : "Canonical wording retained to avoid unnecessary framing."
      };
    });
    return createDiagnosticProtocolV2({ diagnosticId: frame.diagnosticId, frameId: frame.frameId, questions }, frame, options);
  } catch (error) {
    throw new DiagnosticProtocolV2InputError(error.message);
  }
}

export function validateDiagnosticProtocolV2Approval(value, frame) {
  if (!value || typeof value !== "object" || Array.isArray(value)
    || Object.keys(value).sort().join(",") !== "acceptedResearchLimitations,approvalNote,diagnosticId,questions") {
    throw new DiagnosticProtocolV2InputError("Only the diagnostic, governed questions, approval note, and research acknowledgement are accepted.");
  }
  try {
    const diagnosticId = validateDiagnosticContextId(value.diagnosticId);
    if (diagnosticId !== frame.diagnosticId) throw new Error("The protocol must belong to the approved Diagnostic Frame.");
    const draft = createDiagnosticProtocolV2({ diagnosticId, frameId: frame.frameId, questions: value.questions }, frame, { id: "00000000-0000-4000-8000-000000000036", now: new Date(0) });
    const approved = approveDiagnosticProtocolV2(draft, frame, { approvalNote: value.approvalNote, acceptedResearchLimitations: value.acceptedResearchLimitations }, { now: new Date(0) });
    return Object.freeze({
      diagnosticId,
      questions: Object.freeze(approved.questions.map(question => Object.freeze({ templateId: question.templateId, questionText: question.questionText, contextualizationNote: question.contextualizationNote }))),
      approvalNote: approved.approvalNote,
      acceptedResearchLimitations: true
    });
  } catch (error) {
    throw new DiagnosticProtocolV2InputError(error.message);
  }
}

export function toPublicDiagnosticProtocolV2(row) {
  if (!row?.id) return null;
  return Object.freeze({
    protocolId: row.id, diagnosticId: row.diagnostic_id, frameId: row.frame_id,
    protocolVersion: row.protocol_version, questionLibraryVersion: row.question_library_version,
    status: "approved", questions: Object.freeze(row.governed_questions), approvalNote: row.approval_note,
    approvedAt: new Date(row.approved_at).toISOString()
  });
}

function frameFromRow(row) {
  if (!row.frame_id || row.frame_status !== "approved") throw new DiagnosticProtocolV2StateError("Approve the v2 Diagnostic Frame before developing its protocol.");
  return Object.freeze({
    frameId: row.frame_id, diagnosticId: row.diagnostic_id, frameVersion: row.frame_version,
    status: row.frame_status, ...row.frame_payload, approval: Object.freeze({ approvedAt: new Date(row.frame_approved_at).toISOString() })
  });
}

async function source(query, diagnosticId) {
  const result = await query(
    `SELECT diagnostic.id AS diagnostic_id, frame.id AS frame_id, frame.frame_version,
            frame.status AS frame_status, frame.frame_payload, frame.approved_at AS frame_approved_at
     FROM app_shared.diagnostics diagnostic
     LEFT JOIN app_private.diagnostic_frames_v2 frame
       ON frame.workspace_id = diagnostic.workspace_id AND frame.diagnostic_id = diagnostic.id
     WHERE diagnostic.id = $1 LIMIT 1`, [diagnosticId]
  );
  if (!result.rows[0]) throw new DiagnosticProtocolV2StateError("That diagnostic is not available in this workspace.");
  return frameFromRow(result.rows[0]);
}

export async function getDiagnosticProtocolV2({ workspaceId, userId, diagnosticId, now = new Date() }, connectionString) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    await requireAdvisorAssignment(query, { diagnosticId, userId, now });
    const frame = await source(query, diagnosticId);
    const existing = await query(
      `SELECT id,diagnostic_id,frame_id,protocol_version,question_library_version,
              governed_questions,approval_note,approved_at
       FROM app_shared.diagnostic_protocols_v2 WHERE diagnostic_id = $1 LIMIT 1`, [diagnosticId]
    );
    return Object.freeze({ protocol: toPublicDiagnosticProtocolV2(existing.rows[0]), draft: existing.rowCount ? null : compileWorkspaceDiagnosticProtocolV2(frame), policy: diagnosticProtocolPolicyV2 });
  }, connectionString);
}

export async function approveWorkspaceDiagnosticProtocolV2({ workspaceId, userId, input, now = new Date() }, connectionString) {
  return withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    await requireAdvisorAssignment(query, { diagnosticId: input.diagnosticId, userId, now });
    const frame = await source(query, input.diagnosticId);
    const validated = validateDiagnosticProtocolV2Approval(input, frame);
    const exists = await query("SELECT id FROM app_shared.diagnostic_protocols_v2 WHERE diagnostic_id = $1 LIMIT 1", [input.diagnosticId]);
    if (exists.rowCount) throw new DiagnosticProtocolV2StateError("A v2 protocol already exists for this diagnostic.");
    const draft = createDiagnosticProtocolV2({ diagnosticId: validated.diagnosticId, frameId: frame.frameId, questions: validated.questions }, frame, { now });
    const approved = approveDiagnosticProtocolV2(draft, frame, validated, { now });
    const readiness = evaluateDiagnosticProtocolV2(approved, frame);
    if (!readiness.ready) throw new DiagnosticProtocolV2StateError("The v2 protocol is not evidence-sufficient for this frame.");
    const inserted = await query(
      `INSERT INTO app_shared.diagnostic_protocols_v2
        (id,workspace_id,diagnostic_id,frame_id,protocol_version,question_library_version,governed_questions,
         approval_note,approved_by_clerk_user_id,approved_at,created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10::timestamptz,$11::timestamptz)
       RETURNING id,diagnostic_id,frame_id,protocol_version,question_library_version,governed_questions,approval_note,approved_at`,
      [approved.protocolId, workspaceId, approved.diagnosticId, approved.frameId, approved.protocolVersion, approved.questionLibraryVersion,
        JSON.stringify(approved.questions), approved.approvalNote, userId, approved.approvedAt, approved.createdAt]
    );
    await query(
      `INSERT INTO app_operations.audit_events (workspace_id,actor_clerk_user_id,action,target_type,target_id,metadata)
       VALUES ($1,$2,'diagnostic.protocol-v2-approved','diagnostic-protocol-v2',$3,$4::jsonb)`,
      [workspaceId, userId, approved.protocolId, JSON.stringify({ diagnosticId: approved.diagnosticId, frameId: approved.frameId, questionCount: approved.questions.length })]
    );
    return toPublicDiagnosticProtocolV2(inserted.rows[0]);
  }, connectionString);
}

export const workspaceDiagnosticProtocolV2Policy = Object.freeze({ ...diagnosticProtocolPolicyV2, activeAdvisorAssignmentRequired: true, mutatesV1Records: false, activeParticipantProtocol: false });
