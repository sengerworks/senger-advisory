import { createConstraintHypothesis, createEvidenceTheme } from "../../diagnostic-evidence-engine.js";

export const DEFAULT_DIAGNOSTIC_SYNTHESIS_MODEL = "gpt-5.6-sol";
const DOMAINS = ["leadership", "decisions", "rhythm", "alignment", "technology", "culture"];
const PATTERNS = ["convergent", "mixed", "minority-signal", "unknown"];
const CONFIDENCE = ["limited", "moderate", "strong"];
const THEME_KEYS = ["theme-1", "theme-2", "theme-3", "theme-4", "theme-5", "theme-6"];
const MECHANISMS=["priority-attention","authority-accountability","information-sensemaking","coordination","resource-capability-deployment"];
const EVIDENCE_TYPES=["mechanism-observation","friction","compensation","formal-lived","counterevidence","alternative-explanation","boundary-condition","adaptive-observation","evidence-gap"];
const COMPLEXITY=["volume","variety","interdependence","uncertainty","rate-of-change"];

export class DiagnosticSynthesisProviderError extends Error {}

function outputText(response) {
  for (const item of response?.output || []) {
    if (item.type !== "message") continue;
    for (const content of item.content || []) {
      if (content.type === "refusal") throw new DiagnosticSynthesisProviderError("The synthesis request was refused.");
      if (content.type === "output_text" && content.text) return content.text;
    }
  }
  throw new DiagnosticSynthesisProviderError("The synthesis response did not contain structured output.");
}

function schema(evidenceIds,{v2=false}={}) {
  const themeReference = { type: "string", enum: THEME_KEYS };
  return {
    type: "object",
    properties: {
      themes: {
        type: "array", minItems: 2, maxItems: 6,
        items: {
          type: "object",
          properties: {
            themeKey: themeReference,
            title: { type: "string", minLength: 1, maxLength: 120 },
            summary: { type: "string", minLength: 40, maxLength: 1200 },
            domainIds: { type: "array", minItems: 1, maxItems: 6, items: { type: "string", enum: DOMAINS } },
            perspectivePattern: { type: "string", enum: PATTERNS },
            supportingEvidenceIds: { type: "array", minItems: 2, maxItems: 30, items: { type: "string", enum: evidenceIds } },
            weakeningEvidenceIds: { type: "array", maxItems: 20, items: { type: "string", enum: evidenceIds } },
            confidence: { type: "string", enum: CONFIDENCE },
            confidenceBasis: { type: "string", minLength: 20, maxLength: 800 },
            ...(v2?{
              mechanismIds:{type:"array",minItems:1,maxItems:5,items:{type:"string",enum:MECHANISMS}},
              evidenceLayerIds:{type:"array",minItems:1,maxItems:9,items:{type:"string",enum:EVIDENCE_TYPES}},
              complexityDimensions:{type:"array",maxItems:5,items:{type:"string",enum:COMPLEXITY}}
            }:{})
          },
          required: ["themeKey", "title", "summary", "domainIds", "perspectivePattern", "supportingEvidenceIds", "weakeningEvidenceIds", "confidence", "confidenceBasis",...(v2?["mechanismIds","evidenceLayerIds","complexityDimensions"]:[])],
          additionalProperties: false
        }
      },
      hypothesis: {
        type: "object",
        properties: {
          primaryDomainId: { type: "string", enum: DOMAINS },
          statement: { type: "string", minLength: 40, maxLength: 1000 },
          supportingThemeKeys: { type: "array", minItems: 2, maxItems: 6, items: themeReference },
          weakeningThemeKeys: { type: "array", maxItems: 6, items: themeReference },
          competingExplanations: {
            type: "array", minItems: 1, maxItems: 5,
            items: {
              type: "object",
              properties: {
                statement: { type: "string", minLength: 20, maxLength: 600 },
                supportingThemeKeys: { type: "array", maxItems: 6, items: themeReference },
                evidenceNeeded: { type: "string", minLength: 20, maxLength: 500 }
              },
              required: ["statement", "supportingThemeKeys", "evidenceNeeded"], additionalProperties: false
            }
          },
          blindSpots: { type: "array", minItems: 1, maxItems: 10, items: { type: "string", minLength: 1, maxLength: 500 } },
          confidence: { type: "string", enum: CONFIDENCE },
          confidenceBasis: { type: "string", minLength: 40, maxLength: 1000 },
          interventionDirection: { type: "string", minLength: 40, maxLength: 1000 },
          ...(v2?{
            mechanismIds:{type:"array",minItems:1,maxItems:5,items:{type:"string",enum:MECHANISMS}},
            uncertaintyStatement:{type:"string",minLength:40,maxLength:1000},
            boundaryConditions:{type:"array",minItems:1,maxItems:8,items:{type:"string",minLength:20,maxLength:500}}
          }:{})
        },
        required: ["primaryDomainId", "statement", "supportingThemeKeys", "weakeningThemeKeys", "competingExplanations", "blindSpots", "confidence", "confidenceBasis", "interventionDirection",...(v2?["mechanismIds","uncertaintyStatement","boundaryConditions"]:[])],
        additionalProperties: false
      }
    },
    required: ["themes", "hypothesis"], additionalProperties: false
  };
}

export function validateSynthesisEvidence(evidence) {
  if (!Array.isArray(evidence) || evidence.length < 2 || evidence.length > 450) throw new DiagnosticSynthesisProviderError("At least two approved evidence records are required.");
  const normalized = evidence.map((record, index) => {
    const evidenceId = String(record?.evidenceId || "");
    const deidentifiedText = String(record?.deidentifiedText || "").trim();
    if (!evidenceId || deidentifiedText.length < 20 || deidentifiedText.length > 3000) throw new DiagnosticSynthesisProviderError(`Evidence ${index + 1} is invalid.`);
    return { evidenceId, sourceQuestionId: String(record.sourceQuestionId || ""), deidentifiedText };
  });
  if (new Set(normalized.map(record => record.evidenceId)).size !== normalized.length) throw new DiagnosticSynthesisProviderError("Evidence IDs must be unique.");
  return normalized;
}

export function createOpenAIDiagnosticSynthesizer({
  apiKey = process.env.OPENAI_API_KEY,
  model = process.env.OPENAI_DIAGNOSTIC_MODEL || DEFAULT_DIAGNOSTIC_SYNTHESIS_MODEL,
  fetchImpl = fetch
} = {}) {
  if (!apiKey) throw new DiagnosticSynthesisProviderError("OpenAI diagnostic processing is not configured.");
  return async ({ diagnosticId, evidence, methodContext=null }) => {
    const source = validateSynthesisEvidence(evidence);
    const v2=methodContext?.methodVersion==="2.0.0";
    const response = await fetchImpl("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model, store: false, reasoning: { effort: "low" },
        instructions: [
          "Synthesize only the supplied approved de-identified organizational evidence.",
          "Create two to six distinct themes and one cautious constraint hypothesis.",
          "Every theme must cite at least two supplied evidence IDs. Retain weakening evidence, contradictions, minority signals, competing explanations, blind spots, and uncertainty.",
          "Do not infer participant identity, diagnose individuals, claim causality, invent facts, or prescribe a final intervention.",
          "The intervention direction must describe a bounded hypothesis to test, not a guaranteed solution."
          ,...(v2?[
            "Use the approved execution demand as the boundary for every synthesis claim.",
            "Describe Organizational Capacity through interacting mechanisms, friction, compensation, formal-versus-lived divergence, boundary conditions, and uncertainty. Do not produce mechanism scores or call leadership, culture, or technology a mechanism.",
            "Treat question-layer and mechanism tags as inquiry metadata, not as proof that the evidence supports that classification."
          ]:[])
        ].join(" "),
        input: JSON.stringify(v2?{approvedFrame:methodContext.frame,evidence:source.map((record,index)=>({...record,evidenceLayerId:evidence[index].evidenceLayerId,mechanismIds:evidence[index].mechanismIds}))}:{ evidence: source }),
        text: { format: { type: "json_schema", name: "diagnostic_synthesis_draft", strict: true, schema: schema(source.map(record => record.evidenceId),{v2}) } }
      })
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new DiagnosticSynthesisProviderError(`OpenAI synthesis failed with status ${response.status}.`);
    if (payload?.status !== "completed") throw new DiagnosticSynthesisProviderError("OpenAI synthesis did not complete.");
    let parsed;
    try { parsed = JSON.parse(outputText(payload)); } catch (error) {
      if (error instanceof DiagnosticSynthesisProviderError) throw error;
      throw new DiagnosticSynthesisProviderError("OpenAI returned unreadable synthesis output.");
    }
    try {
      const evidenceRecords = source.map(record => ({ ...record, reviewStatus: "approved" }));
      const themeKeys = new Set();
      const themes = parsed.themes.map(theme => {
        if (themeKeys.has(theme.themeKey)) throw new Error("Theme keys must be unique.");
        themeKeys.add(theme.themeKey);
        const { themeKey,mechanismIds,evidenceLayerIds,complexityDimensions, ...themeValues } = theme;
        const base=createEvidenceTheme({ diagnosticId, ...themeValues }, evidenceRecords);
        return { key: themeKey, value:v2?Object.freeze({...base,mechanismIds:Object.freeze(mechanismIds),evidenceLayerIds:Object.freeze(evidenceLayerIds),complexityDimensions:Object.freeze(complexityDimensions)}):base };
      });
      const themeIdByKey = new Map(themes.map(theme => [theme.key, theme.value.themeId]));
      const mapKeys = keys => keys.map(key => {
        if (!themeIdByKey.has(key)) throw new Error("The hypothesis references an unknown theme.");
        return themeIdByKey.get(key);
      });
      const { supportingThemeKeys, weakeningThemeKeys, competingExplanations,mechanismIds,uncertaintyStatement,boundaryConditions, ...hypothesisValues } = parsed.hypothesis;
      const baseHypothesis = createConstraintHypothesis({
        diagnosticId,
        ...hypothesisValues,
        supportingThemeIds: mapKeys(supportingThemeKeys),
        weakeningThemeIds: mapKeys(weakeningThemeKeys),
        competingExplanations: competingExplanations.map(item => ({ statement: item.statement, supportingThemeIds: mapKeys(item.supportingThemeKeys), evidenceNeeded: item.evidenceNeeded }))
      }, themes.map(theme => theme.value));
      const hypothesis=v2?Object.freeze({...baseHypothesis,mechanismIds:Object.freeze(mechanismIds),uncertaintyStatement,boundaryConditions:Object.freeze(boundaryConditions)}):baseHypothesis;
      return { themes: themes.map(theme => theme.value), hypothesis,methodVersion:v2?"2.0.0":"1.0.0",methodContext:v2?Object.freeze({frameVersion:"2.0.0",executionDemandBounded:true,mechanismScoresProduced:false}):null };
    } catch (error) {
      throw new DiagnosticSynthesisProviderError(`Synthesis draft failed validation: ${error.message}`);
    }
  };
}
