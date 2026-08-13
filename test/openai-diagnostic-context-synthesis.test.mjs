import test from "node:test";
import assert from "node:assert/strict";
import { createOpenAIDiagnosticContextSynthesizer, DiagnosticContextSynthesisProviderError } from "../netlify/lib/openai-diagnostic-context-synthesis.mjs";

const synthesis = {
  executiveFrame: "Leadership is trying to protect a consequential growth commitment while the operating system still depends on informal coordination across the boundary.",
  centralTension: "Near-term commercial responsiveness is competing with the consistency required for scalable execution.",
  businessStakes: "If the tradeoff remains unresolved, both customer confidence and the strategic priority may absorb the cost.",
  decisionAtCenter: "Leadership must determine which operating boundary should govern exceptions without slowing legitimate work.",
  workingImplication: "The visible delays may be compensation for unclear decision rights, but other perspectives must test that possibility.",
  areasToExplore: ["How different parts of the organization experience the tradeoff between responsiveness and consistency.", "Whether formal operating boundaries hold in practice or depend on recurring workarounds."]
};

test("creates a non-stored bounded sponsor context synthesis", async () => {
  let request;
  const provider = createOpenAIDiagnosticContextSynthesizer({ apiKey: "test", fetchImpl: async (_url, options) => {
    request = JSON.parse(options.body);
    return new Response(JSON.stringify({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(synthesis) }] }] }), { status: 200 });
  }});
  assert.deepEqual(await provider({ strategicPriority: "Scale responsibly" }), synthesis);
  assert.equal(request.store, false);
  assert.match(request.instructions, /Do not diagnose/);
  assert.match(request.instructions, /not as a question or a request for the sponsor to retrieve metrics/);
  assert.deepEqual(request.text.format.schema.required, ["executiveFrame", "centralTension", "businessStakes", "decisionAtCenter", "workingImplication", "areasToExplore"]);
  assert.equal(request.text.format.type, "json_schema");
});

test("fails closed when context synthesis is unavailable", async () => {
  const provider = createOpenAIDiagnosticContextSynthesizer({ apiKey: "test", fetchImpl: async () => new Response("{}", { status: 429 }) });
  await assert.rejects(() => provider({}), DiagnosticContextSynthesisProviderError);
});
