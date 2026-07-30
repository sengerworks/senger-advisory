import { createDeidentifiedEvidence } from "../../diagnostic-evidence-engine.js";

export const DEFAULT_DIAGNOSTIC_DEIDENTIFICATION_MODEL = "gpt-5.6-sol";

const REDACTION_CATEGORIES = ["person", "role", "organization", "client", "location", "date", "project", "other"];
const DISCLOSURE_RISKS = ["low", "medium", "high"];

export class DiagnosticDeidentificationProviderError extends Error {}

function outputText(response) {
  for (const item of response?.output || []) {
    if (item.type !== "message") continue;
    for (const content of item.content || []) {
      if (content.type === "refusal") throw new DiagnosticDeidentificationProviderError("The de-identification request was refused.");
      if (content.type === "output_text" && content.text) return content.text;
    }
  }
  throw new DiagnosticDeidentificationProviderError("The de-identification response did not contain structured output.");
}

function schema(questionIds) {
  return {
    type: "object",
    properties: {
      evidence: {
        type: "array",
        maxItems: questionIds.length,
        items: {
          type: "object",
          properties: {
            sourceQuestionId: { type: "string", enum: questionIds },
            deidentifiedText: { type: "string", minLength: 20, maxLength: 3000 },
            redactionCategories: { type: "array", maxItems: 8, items: { type: "string", enum: REDACTION_CATEGORIES } },
            disclosureRisk: { type: "string", enum: DISCLOSURE_RISKS },
            transformationNote: { type: "string", minLength: 20, maxLength: 500 }
          },
          required: ["sourceQuestionId", "deidentifiedText", "redactionCategories", "disclosureRisk", "transformationNote"],
          additionalProperties: false
        }
      }
    },
    required: ["evidence"],
    additionalProperties: false
  };
}

export function validateDeidentificationSource(answers) {
  if (!Array.isArray(answers) || answers.length === 0 || answers.length > 15) throw new DiagnosticDeidentificationProviderError("One to fifteen interview answers are required.");
  const normalized = answers.map((answer, index) => {
    const sourceQuestionId = String(answer?.questionId || "").trim();
    const answerText = String(answer?.answerText || "").trim();
    if (!sourceQuestionId || sourceQuestionId.length > 100) throw new DiagnosticDeidentificationProviderError(`Answer ${index + 1} has an invalid question reference.`);
    if (answerText.length < 40 || answerText.length > 6000) throw new DiagnosticDeidentificationProviderError(`Answer ${index + 1} is outside the governed response boundary.`);
    return { sourceQuestionId, answerText };
  });
  if (new Set(normalized.map(answer => answer.sourceQuestionId)).size !== normalized.length) throw new DiagnosticDeidentificationProviderError("Question references must be unique.");
  return normalized;
}

export function createOpenAIDiagnosticDeidentifier({
  apiKey = process.env.OPENAI_API_KEY,
  model = process.env.OPENAI_DIAGNOSTIC_MODEL || DEFAULT_DIAGNOSTIC_DEIDENTIFICATION_MODEL,
  fetchImpl = fetch
} = {}) {
  if (!apiKey) throw new DiagnosticDeidentificationProviderError("OpenAI diagnostic processing is not configured.");
  return async ({ diagnosticId, interviewId, answers }) => {
    const source = validateDeidentificationSource(answers);
    const questionIds = source.map(answer => answer.sourceQuestionId);
    const response = await fetchImpl("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        store: false,
        reasoning: { effort: "low" },
        instructions: [
          "Transform confidential organizational interview answers into bounded de-identified evidence candidates.",
          "Preserve operating meaning, sequence, tensions, decisions, coordination patterns, and observable consequences.",
          "Remove or generalize names, exact titles when distinctive, organizations, clients, locations, dates, project names, exact financial values, and combinations that could identify a person.",
          "Do not infer facts, diagnose individuals, rank people, or add recommendations.",
          "Prefer paraphrase over quotation. Mark medium or high disclosure risk when an incident remains distinctive after transformation.",
          "Return at most one evidence candidate per question. Omit answers that contain no useful organizational operating evidence."
        ].join(" "),
        input: JSON.stringify({ responses: source }),
        text: {
          format: {
            type: "json_schema",
            name: "diagnostic_deidentified_evidence",
            strict: true,
            schema: schema(questionIds)
          }
        }
      })
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new DiagnosticDeidentificationProviderError(`OpenAI de-identification failed with status ${response.status}.`);
    if (payload?.status !== "completed") throw new DiagnosticDeidentificationProviderError("OpenAI de-identification did not complete.");
    let parsed;
    try { parsed = JSON.parse(outputText(payload)); } catch (error) {
      if (error instanceof DiagnosticDeidentificationProviderError) throw error;
      throw new DiagnosticDeidentificationProviderError("OpenAI returned unreadable de-identification output.");
    }
    if (!parsed || !Array.isArray(parsed.evidence)) throw new DiagnosticDeidentificationProviderError("OpenAI returned an invalid evidence collection.");
    const seen = new Set();
    return parsed.evidence.map((candidate, index) => {
      if (seen.has(candidate.sourceQuestionId)) throw new DiagnosticDeidentificationProviderError("OpenAI returned duplicate question evidence.");
      seen.add(candidate.sourceQuestionId);
      if (!questionIds.includes(candidate.sourceQuestionId)) throw new DiagnosticDeidentificationProviderError("OpenAI returned evidence for an unknown question.");
      try {
        return createDeidentifiedEvidence({
          diagnosticId,
          sourceResponseRef: interviewId,
          ...candidate
        });
      } catch (error) {
        throw new DiagnosticDeidentificationProviderError(`Evidence candidate ${index + 1} failed validation: ${error.message}`);
      }
    });
  };
}
