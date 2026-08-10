import { createHmac, timingSafeEqual } from "node:crypto";

export const DIAGNOSTIC_QUESTION_REVISION_REASONS = Object.freeze([
  "unnecessary-sensitivity",
  "organizational-terminology",
  "unclear-or-complex",
  "factually-inaccurate-premise",
  "not-applicable-across-perspectives",
  "identity-or-disclosure-risk",
  "duplicative-wording"
]);

export class DiagnosticQuestionReframeProviderError extends Error {}

function signingSecret(secret = process.env.DIAGNOSTIC_RESPONSE_ENCRYPTION_KEY) {
  if (!secret || secret.length < 32) throw new DiagnosticQuestionReframeProviderError("Governed question revision signing is not configured.");
  return secret;
}

function revisionPayload({ diagnosticId, templateId, reason, priorQuestion, questionText }) {
  return JSON.stringify({ diagnosticId, templateId, reason, priorQuestion, questionText });
}

export function signDiagnosticQuestionRevision(value, secret) {
  return createHmac("sha256", signingSecret(secret)).update(revisionPayload(value)).digest("base64url");
}

export function verifyDiagnosticQuestionRevision(value, token, secret) {
  if (typeof token !== "string" || !token) return false;
  const expected = Buffer.from(signDiagnosticQuestionRevision(value, secret));
  const supplied = Buffer.from(token);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

function outputText(payload) {
  const text = payload?.output?.flatMap(item => item?.content || []).find(item => item?.type === "output_text")?.text;
  if (!text) throw new DiagnosticQuestionReframeProviderError("AI returned no revised question.");
  return text;
}

export function createOpenAIDiagnosticQuestionReframer({
  apiKey = process.env.OPENAI_API_KEY,
  model = process.env.OPENAI_DIAGNOSTIC_MODEL || "gpt-5-mini",
  fetchImpl = fetch
} = {}) {
  if (!apiKey) throw new DiagnosticQuestionReframeProviderError("AI question revision is not configured.");
  return async ({ questionText, canonicalQuestion, reason, evidenceObjectiveId, domainId }) => {
    const response = await fetchImpl("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        store: false,
        reasoning: { effort: "low" },
        instructions: [
          "Reframe one organizational diagnostic question in response to a bounded sponsor concern.",
          "Preserve the canonical evidence objective, domain, neutrality, and applicability to every participant perspective.",
          "Do not soften away meaningful organizational tension, add a new premise, add multiple questions, or solicit identifying information.",
          "Return only one revised question."
        ].join(" "),
        input: JSON.stringify({ questionText, canonicalQuestion, revisionReason: reason, evidenceObjectiveId, domainId }),
        text: { format: { type: "json_schema", name: "governed_question_revision", strict: true, schema: {
          type: "object", additionalProperties: false, required: ["questionText"], properties: { questionText: { type: "string", minLength: 20, maxLength: 600 } }
        } } }
      })
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new DiagnosticQuestionReframeProviderError(`AI question revision failed with status ${response.status}.`);
    if (payload?.status !== "completed") throw new DiagnosticQuestionReframeProviderError("AI question revision did not complete.");
    let parsed;
    try { parsed = JSON.parse(outputText(payload)); } catch (error) {
      if (error instanceof DiagnosticQuestionReframeProviderError) throw error;
      throw new DiagnosticQuestionReframeProviderError("AI returned an unreadable question revision.");
    }
    const revised = String(parsed?.questionText || "").trim();
    if (revised.length < 20 || revised.length > 600 || revised === questionText.trim()) throw new DiagnosticQuestionReframeProviderError("AI did not return a valid reframed question.");
    return revised;
  };
}
