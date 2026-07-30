import test from "node:test";
import assert from "node:assert/strict";
import { createOpenAIDiagnosticDeidentifier, DEFAULT_DIAGNOSTIC_DEIDENTIFICATION_MODEL, DiagnosticDeidentificationProviderError } from "../netlify/lib/openai-diagnostic-deidentification.mjs";

const answers = [{ questionId: "q-01", answerText: "A named executive repeatedly reclaimed a routine decision, delaying delivery by two weeks." }];
const candidate = { sourceQuestionId: "q-01", deidentifiedText: "A senior leader repeatedly reclaimed a routine decision, delaying delivery by approximately two weeks.", redactionCategories: ["person", "role", "date"], disclosureRisk: "medium", transformationNote: "Removed the individual identity, generalized the role, and softened the exact timing." };

test("uses Responses structured output without storing the request", async () => {
  let request;
  const deidentify = createOpenAIDiagnosticDeidentifier({ apiKey: "test-key", fetchImpl: async (url, options) => {
    request = { url, options, body: JSON.parse(options.body) };
    return new Response(JSON.stringify({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({ evidence: [candidate] }) }] }] }), { status: 200, headers: { "content-type": "application/json" } });
  } });
  const result = await deidentify({ diagnosticId: "diagnostic-1", interviewId: "protected-interview-1", answers });
  assert.equal(request.url, "https://api.openai.com/v1/responses");
  assert.equal(request.body.model, DEFAULT_DIAGNOSTIC_DEIDENTIFICATION_MODEL);
  assert.equal(request.body.store, false);
  assert.equal(request.body.text.format.type, "json_schema");
  assert.equal(request.body.text.format.strict, true);
  assert.equal(result[0].reviewStatus, "pending");
  assert.equal("answerText" in result[0], false);
});

test("fails closed on refusals, duplicate evidence, and provider errors", async () => {
  const response = body => async () => new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  const refusal = createOpenAIDiagnosticDeidentifier({ apiKey: "test", fetchImpl: response({ status: "completed", output: [{ type: "message", content: [{ type: "refusal", refusal: "Unable" }] }] }) });
  await assert.rejects(() => refusal({ diagnosticId: "d", interviewId: "i", answers }), /refused/);
  const duplicate = createOpenAIDiagnosticDeidentifier({ apiKey: "test", fetchImpl: response({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({ evidence: [candidate, candidate] }) }] }] }) });
  await assert.rejects(() => duplicate({ diagnosticId: "d", interviewId: "i", answers }), /duplicate/);
  const failed = createOpenAIDiagnosticDeidentifier({ apiKey: "test", fetchImpl: async () => new Response(JSON.stringify({ error: { message: "secret provider detail" } }), { status: 429 }) });
  await assert.rejects(() => failed({ diagnosticId: "d", interviewId: "i", answers }), error => error instanceof DiagnosticDeidentificationProviderError && !error.message.includes("secret provider detail"));
});
