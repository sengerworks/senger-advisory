import test from "node:test";
import assert from "node:assert/strict";
import { createOpenAIDiagnosticSynthesizer, DiagnosticSynthesisProviderError, validateSynthesisEvidence } from "../netlify/lib/openai-diagnostic-synthesis.mjs";

const diagnosticId = "22222222-2222-4222-8222-222222222222";
const evidence = [1, 2, 3].map(index => ({ evidenceId: `00000000-0000-4000-8000-00000000000${index}`, sourceQuestionId: `q${index}`, deidentifiedText: `Approved organizational evidence record ${index} describing a recurring operating pattern.` }));
const draft = {
  themes: [
    { themeKey: "theme-1", title: "Escalation", summary: "Routine decisions repeatedly move upward because authority boundaries are not consistently understood or applied.", domainIds: ["decisions"], perspectivePattern: "convergent", supportingEvidenceIds: [evidence[0].evidenceId, evidence[1].evidenceId], weakeningEvidenceIds: [], confidence: "moderate", confidenceBasis: "Two approved records describe the same recurring escalation pattern." },
    { themeKey: "theme-2", title: "Information delay", summary: "Required operating information often arrives after the decision window, creating delay that can resemble unclear authority.", domainIds: ["rhythm"], perspectivePattern: "mixed", supportingEvidenceIds: [evidence[1].evidenceId, evidence[2].evidenceId], weakeningEvidenceIds: [evidence[0].evidenceId], confidence: "moderate", confidenceBasis: "Two records support information delay while another record weakens it." }
  ],
  hypothesis: { primaryDomainId: "decisions", statement: "Decision authority has not evolved consistently with organizational complexity, causing recurring work to escalate or stall.", supportingThemeKeys: ["theme-1", "theme-2"], weakeningThemeKeys: ["theme-2"], competingExplanations: [{ statement: "Late information may be the primary constraint rather than authority ambiguity.", supportingThemeKeys: ["theme-2"], evidenceNeeded: "Compare decision delay with information availability across recurring workflows." }], blindSpots: ["One frontline delivery perspective is not represented."], confidence: "moderate", confidenceBasis: "Multiple themes support escalation while mixed evidence preserves a credible competing explanation.", interventionDirection: "Test explicit authority thresholds and information requirements in one recurring cross-functional decision before broader change." }
};

test("uses only approved de-identified evidence to create a governed synthesis draft", async () => {
  let requestBody;
  const synthesize = createOpenAIDiagnosticSynthesizer({ apiKey: "test", fetchImpl: async (_url, options) => {
    requestBody = JSON.parse(options.body);
    return new Response(JSON.stringify({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(draft) }] }] }), { status: 200 });
  } });
  const result = await synthesize({ diagnosticId, evidence });
  assert.equal(result.themes.length, 2);
  assert.equal(result.hypothesis.status, "draft");
  assert.equal(result.hypothesis.competingExplanations.length, 1);
  assert.equal(requestBody.store, false);
  assert.doesNotMatch(requestBody.input, /participant|email|user_/i);
});

test("rejects insufficient, duplicate, and untraceable synthesis evidence", async () => {
  assert.throws(() => validateSynthesisEvidence([evidence[0]]), DiagnosticSynthesisProviderError);
  assert.throws(() => validateSynthesisEvidence([evidence[0], evidence[0]]), /unique/);
  const invalid = structuredClone(draft);
  invalid.themes[0].supportingEvidenceIds[0] = "ffffffff-ffff-4fff-8fff-ffffffffffff";
  const synthesize = createOpenAIDiagnosticSynthesizer({ apiKey: "test", fetchImpl: async () => new Response(JSON.stringify({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(invalid) }] }] }), { status: 200 }) });
  await assert.rejects(() => synthesize({ diagnosticId, evidence }), DiagnosticSynthesisProviderError);
});

test("v2 synthesis is bounded to the execution demand and produces mechanism context without scores",async()=>{
  const v2Draft=structuredClone(draft);
  for(const theme of v2Draft.themes){theme.mechanismIds=["authority-accountability","information-sensemaking"];theme.evidenceLayerIds=["mechanism-observation","counterevidence"];theme.complexityDimensions=["interdependence","uncertainty"];}
  Object.assign(v2Draft.hypothesis,{mechanismIds:["authority-accountability","information-sensemaking"],uncertaintyStatement:"The evidence does not yet distinguish authority ambiguity from delayed information across every recurring workflow.",boundaryConditions:["The pattern appears strongest in cross-functional work with non-standard commercial commitments."]});
  let requestBody;
  const synthesize=createOpenAIDiagnosticSynthesizer({apiKey:"test",fetchImpl:async(_url,options)=>{requestBody=JSON.parse(options.body);return new Response(JSON.stringify({status:"completed",output:[{type:"message",content:[{type:"output_text",text:JSON.stringify(v2Draft)}]}]}),{status:200});}});
  const annotated=evidence.map(record=>({...record,evidenceLayerId:"mechanism-observation",mechanismIds:["authority-accountability"]}));
  const result=await synthesize({diagnosticId,evidence:annotated,methodContext:{methodVersion:"2.0.0",frame:{executionDemand:{commitment:"Protect core delivery while scaling standardized platform revenue."},diagnosticQuestion:"How does the operating system absorb this demand?",leadershipDecision:"Set the commercial exception boundary.",performanceConsequences:["Renewal exposure"],complexityObservations:[]}}});
  assert.equal(result.methodVersion,"2.0.0");
  assert.deepEqual(result.hypothesis.mechanismIds,["authority-accountability","information-sensemaking"]);
  assert.equal(result.methodContext.mechanismScoresProduced,false);
  assert.match(requestBody.input,/Protect core delivery/);
  assert.doesNotMatch(JSON.stringify(result),/"(?:mechanismScore|capacityScore)":/);
});
