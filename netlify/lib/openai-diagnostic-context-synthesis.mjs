export const DEFAULT_DIAGNOSTIC_CONTEXT_MODEL = "gpt-5-mini";
export class DiagnosticContextSynthesisProviderError extends Error {}

function outputText(payload) {
  const text = payload?.output?.flatMap(item => item?.content || []).find(item => item?.type === "output_text")?.text;
  if (!text) throw new DiagnosticContextSynthesisProviderError("AI returned no context synthesis.");
  return text;
}

export function createOpenAIDiagnosticContextSynthesizer({
  apiKey = process.env.OPENAI_API_KEY,
  model = process.env.OPENAI_DIAGNOSTIC_MODEL || DEFAULT_DIAGNOSTIC_CONTEXT_MODEL,
  fetchImpl = fetch
} = {}) {
  if (!apiKey) throw new DiagnosticContextSynthesisProviderError("AI context synthesis is not configured.");
  return async context => {
    const response = await fetchImpl("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        store: false,
        reasoning: { effort: "low" },
        instructions: [
          "Create a concise executive-quality mirror of one diagnostic sponsor's stated context.",
          "Make the sponsor feel accurately understood by connecting the execution demand, operating tension, business stakes, and decision with precise language.",
          "Do not diagnose the organization, declare a constraint, assign blame, invent facts, or treat the sponsor's account as organizational truth.",
          "Separate articulation from inference. State only cautious working implications and questions that other perspectives must test.",
          "Use plain language suitable for an executive. Avoid consulting jargon, scores, recommendations, and generic encouragement."
        ].join(" "),
        input: JSON.stringify(context),
        text: { format: { type: "json_schema", name: "sponsor_context_synthesis", strict: true, schema: {
          type: "object", additionalProperties: false,
          required: ["executiveFrame", "centralTension", "businessStakes", "decisionAtCenter", "workingImplication", "questionsToTest"],
          properties: {
            executiveFrame: { type: "string", minLength: 80, maxLength: 900 },
            centralTension: { type: "string", minLength: 40, maxLength: 500 },
            businessStakes: { type: "string", minLength: 40, maxLength: 600 },
            decisionAtCenter: { type: "string", minLength: 30, maxLength: 500 },
            workingImplication: { type: "string", minLength: 40, maxLength: 600 },
            questionsToTest: { type: "array", minItems: 2, maxItems: 4, items: { type: "string", minLength: 20, maxLength: 300 } }
          }
        } } }
      })
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new DiagnosticContextSynthesisProviderError(`AI context synthesis failed with status ${response.status}.`);
    if (payload?.status !== "completed") throw new DiagnosticContextSynthesisProviderError("AI context synthesis did not complete.");
    try { return JSON.parse(outputText(payload)); }
    catch (error) {
      if (error instanceof DiagnosticContextSynthesisProviderError) throw error;
      throw new DiagnosticContextSynthesisProviderError("AI returned an unreadable context synthesis.");
    }
  };
}
