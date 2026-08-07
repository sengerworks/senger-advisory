# Organizational Capacity Platform — Product Architecture Audit v1.0

**Status:** Phase 1 audit for review

**Canonical reference:** Organizational Capacity Architecture v1.0 (frozen)

**Scope:** Existing Senger Advisory website, assessment, diagnostic, reporting, evidence model, product workflow, roadmap, and technical implementation

**Explicit boundary:** This document classifies the current product. It does not design Product Architecture v2.

## Executive conclusion

The platform has two architectures layered together:

1. a strong operating architecture for confidential, multi-perspective evidence, governed synthesis, leadership decisions, interventions, and reassessment; and
2. an obsolete intellectual architecture that treats Organizational Capacity as six peer domains—Leadership, Decision Velocity, Operating Rhythm, Alignment, Technology, and Culture—and often reduces the assessment to domain scores and a lowest-domain constraint.

The first should largely be preserved. The second must be replaced in a coordinated migration.

This is not principally a copy problem. The six-domain model is encoded in public visuals, assessment items, scoring, saved profiles, aggregation, longitudinal comparisons, diagnostic question coverage, synthesis records, action cycles, database constraints, schemas, demonstrations, and documentation. Updating labels without changing those contracts would make the platform appear aligned while leaving its reasoning model unchanged.

The strongest part of the present product is already diagnostic in method: it protects participant confidentiality, separates evidence from identity, preserves uncertainty and competing explanations, requires review gates, treats intervention direction as a hypothesis, and follows findings through intervention and reassessment. The weakest part is its theory of what is being diagnosed.

## Architectural standard used for the audit

Architecture v1.0 establishes the following non-negotiable distinctions:

- Organizational Capacity is an **emergent and relational property**, evaluated against a defined complexity and execution demand: capacity for what?
- Complexity includes volume, variety, interdependence, uncertainty, and rate of change. Growth is one generator of complexity, not the governing phenomenon.
- Necessary complexity must be distinguished from unnecessary complexity.
- The five Operating Capacity Mechanisms are Priority & Attention, Authority & Accountability, Information & Sensemaking, Coordination, and Resource & Capability Deployment.
- The mechanisms are not five independent scores. Capacity emerges from their interaction relative to complexity.
- Leadership is a cross-cutting capacity-shaping force. Culture and incentives are cross-cutting conditions.
- People, capability, capital, technology, data, time, and infrastructure are inputs—not Capacity.
- Design levers are distinct from mechanisms.
- Friction signals are evidence of possible strain, not diagnoses.
- Capacity Compensation can conceal insufficiency through heroics, escalation, workarounds, excess meetings, manual systems, and other load-bearing behavior.
- Constraints may be originating, propagated, or reinforcing; a single root cause is not assumed.
- Diagnostic reasoning follows: signal → consequence → compensation → complexity demand → constrained mechanisms → constraint relationships → cross-cutting conditions → design cause → intervention.
- The diagnostic may conclude that the presenting problem is not an organizational capacity problem.
- The product trajectory is Assessment → Diagnostic System → Continuous Capacity Intelligence.

## Classification summary

| Product element | Classification | Audit finding |
|---|---|---|
| Assessment/diagnostic distinction | **KEEP** | The lightweight assessment is correctly positioned as a signal and lead-in, not the full diagnosis. |
| Automated and advisor-led routes | **KEEP** | A shared diagnostic standard with different facilitation routes is aligned. |
| Confidentiality and de-identification | **KEEP** | Identity separation, minimum reporting thresholds, evidence review, and participant-content suppression are foundational strengths. |
| Evidence traceability and uncertainty | **KEEP** | Supporting/weakening evidence, competing explanations, blind spots, and confidence are properly governed. |
| Leadership validation | **KEEP / MODIFY** | The gate is sound; leadership must be framed as a cross-cutting validator and capacity-shaping force, not a scored domain. |
| Intervention acceptance and testing | **KEEP / MODIFY** | The hypothesis-and-review loop is aligned; it needs explicit linkage to complexity reduction, mechanism strengthening, cross-cutting conditions, and design levers. |
| Capacity Operating Brief | **KEEP / MODIFY** | The decision-oriented brief is superior to a generic dashboard; its finding model must reflect the new diagnostic chain and constraint map. |
| Reassessment and decision history | **KEEP / MODIFY** | The longitudinal operating loop is a strong foundation, but current comparisons inherit six-domain scores. |
| Six capacity domains | **REPLACE** | They conflict directly with the five mechanisms and the required distinction among mechanisms, inputs, conditions, and design levers. |
| Six independent domain scores | **REPLACE** | They imply additive component capacity rather than an emergent relationship between mechanisms and complexity. |
| Overall Capacity Index | **REPLACE** | A context-free roll-up obscures “capacity for what?” and may convey false precision. |
| Lowest domain as primary constraint | **REPLACE** | It confuses a low score with causal diagnosis and cannot represent originating, propagated, or reinforcing constraints. |
| Technology as a capacity domain | **REPLACE** | Technology is an input and potential design lever; its value depends on the operating mechanisms around it. |
| Leadership as a capacity domain | **REPLACE** | Leadership is a cross-cutting force that shapes all mechanisms and compensation patterns. |
| Culture as a capacity domain | **REPLACE** | Culture and incentives are cross-cutting conditions and must be distinguished from formal operating architecture. |
| Decision Velocity, Operating Rhythm, Alignment | **MODIFY / RELOCATE** | These remain useful observable patterns or outcomes, but they are not canonical mechanisms. |
| Growth-led narrative | **MODIFY** | Growth remains an important use case, but complexity and execution demand must become the governing frame. |
| Capacity Lens visual | **REPLACE** | The current six-node representation encodes the obsolete ontology even if its visual interaction can be reused. |
| Five-layer public model | **MODIFY** | It is useful causal scaffolding, but it does not express complexity demand, mechanism interaction, compensation, constraint propagation, or design cause. |
| AI Readiness narrative | **MODIFY** | AI should appear as a complexity generator, input, and design lever—not as a capacity domain or parallel diagnosis. |
| Adaptive Capacity | **MISSING** | It is not yet represented as a distinct research and product construct. |
| Complexity Profile | **MISSING** | The platform does not systematically characterize volume, variety, interdependence, uncertainty, or rate of change. |
| Necessary/unnecessary complexity | **MISSING** | The diagnostic and intervention logic do not explicitly choose between reducing avoidable complexity and increasing capacity for necessary complexity. |
| Capacity Compensation | **MISSING** | Heroics and workarounds appear in narrative language but are not captured as a structured evidence layer. |
| Constraint relationship map | **MISSING** | Current records favor one primary domain rather than originating, propagated, and reinforcing relationships. |
| Formal-versus-lived architecture | **MISSING** | The system does not explicitly compare stated decision rights, processes, incentives, and structures with actual behavior. |
| Non-capacity conclusion | **MISSING** | The diagnostic cannot formally conclude that the presenting issue is not a capacity problem. |
| Continuous Capacity Intelligence | **MISSING / PARTIAL** | Reassessment and longitudinal evidence create a foundation, but the current product is not yet continuous mechanism-and-complexity intelligence. |

## Detailed audit

### 1. Website narrative and information architecture

**What is working**

- The site introduces Organizational Capacity as a category and the Capacity Lens as a way to see the organizational system beneath symptoms.
- “See the system before choosing the intervention” is aligned with the diagnostic premise.
- The site correctly warns that coaching, technology, restructuring, training, and AI can be premature prescriptions.
- The platform journey, diagnostic page, signs, insights, and sample brief form a coherent progression from recognition to evidence to action.

**Material conflicts**

- The homepage and framework remain governed by “growth creates complexity.” Architecture v1.0 requires complexity and execution demand to govern; growth is one source among many.
- The current public definition—absorbing growth, complexity, and change without losing execution, clarity, or cohesion—is accessible but incomplete. It does not state that capacity is emergent, relational, or demand-specific.
- The homepage and framework present six peer domains as the system that determines capacity. This is the most visible conflict with Architecture v1.0.
- The five-layer story—Business Strategy, Leadership System, Organizational Capacity, Execution Flow, Business Outcomes—does not expose mechanisms, complexity profile, compensation, constraint relationships, or design cause.
- Several pages use signals such as meetings, slow decisions, leadership overload, technology drag, and culture friction well, but the visual structure risks making those signals look diagnostic.

**Classification**

- Category-first narrative: **KEEP**.
- Complexity and execution framing: **MODIFY**.
- Six-domain Capacity Lens: **REPLACE**.
- Symptom/sign content: **KEEP / MODIFY** as signal recognition, with an explicit non-diagnostic boundary.
- Existing information architecture: **KEEP / MODIFY**. It can support the new architecture without a wholesale page-count expansion.

### 2. Assessment

**Current state**

The assessment measures 18 behaviors across six domains, calculates six 0–100 domain scores and an overall index, assigns a band, identifies the lowest domain or tied domains as the primary constraint, and generates domain-specific implications and questions. It can be used locally, saved privately, aggregated across participants, and compared longitudinally.

**What is working**

- It is brief, accessible, and correctly positioned as a lightweight gauge rather than the full diagnostic.
- Its copy often acknowledges ambiguity: meeting load may compensate for unclear decisions; technology friction may originate outside the tool; cultural symptoms may have multiple causes.
- It produces useful executive questions rather than pretending that a score is a complete prescription.
- Private encrypted saving, consent boundaries, and versioning are strong implementation assets.

**Material conflicts**

- The output still turns ambiguous signals into six domain scores, an overall index, and a primary constraint ID.
- Context is dominated by organization size, role, and growth pressure rather than an explicit complexity-and-execution demand.
- Leadership, technology, and culture are treated as peer capacity components.
- Decision velocity, operating rhythm, and alignment are treated as latent causal domains rather than possible effects, patterns, or operating manifestations.
- The lowest score is promoted to a constraint even though Architecture v1.0 defines diagnosis as reasoning across signals, consequences, compensation, demand, mechanisms, relationships, conditions, and design causes.
- Longitudinal comparison of scores can show changed perceptions, but not necessarily changed organizational capacity.

**Classification**

The assessment as a product stage is **KEEP**. Its item architecture, scoring model, result ontology, saved-result contract, and multi-perspective aggregation are **REPLACE**. Its privacy, versioning, completion flow, and lightweight experience are **KEEP**.

### 3. Diagnostic workflow

**What is working**

- Discovery establishes organizational context, strategic priority, triggering concern, decisions at risk, recent changes, prior interventions, sensitivities, and the leadership decision to inform.
- Participant design intentionally samples leadership levels, execution proximity, and functional lenses.
- Automated written and advisor-live collection modes share a governed protocol.
- The platform separates raw responses, de-identified evidence, organizational findings, and client-facing decisions.
- Collection readiness, confidentiality thresholds, advisor evidence review, synthesis validation, and leadership validation are server-enforced gates.
- Intervention is downstream from diagnosis, and the same operating brief is available regardless of delivery route.

**Material conflicts**

- The question library requires coverage of all six old domains. Protocol validity therefore depends on an obsolete ontology.
- The 15 questions contain useful evidence prompts, but their metadata maps each question to a domain rather than to the Architecture v1.0 evidence layers and reasoning chain.
- Discovery collects rich presenting context but does not create a structured Complexity Profile or distinguish necessary from unnecessary complexity.
- The current protocol does not explicitly seek Capacity Compensation, formal-versus-lived architecture, constraint propagation, or evidence that the issue may not be capacity-related.
- Adaptive Capacity is absent.

**Classification**

The lifecycle, routes, roles, gates, and confidentiality model are **KEEP**. Discovery structure and participant sampling are **KEEP / MODIFY**. Question metadata, coverage rules, and evidence objectives are **REPLACE / MODIFY** to serve diagnostic reasoning rather than domain completeness.

### 4. Evidence, synthesis, and diagnostic reasoning

**What is working**

- Every synthesis claim must trace to approved de-identified evidence.
- Themes require multiple records and preserve convergent, mixed, minority, and unknown perspective patterns.
- Weakening evidence, competing explanations, blind spots, confidence, and evidence needed are first-class concepts.
- High-risk disclosure requires human review; de-identification is not falsely represented as guaranteed anonymity.
- The intervention direction is explicitly a hypothesis rather than a proven causal prescription.

These features are unusually strong and should be treated as the core of the diagnostic system rather than discarded with the old domain model.

**Material conflicts**

- Evidence themes contain `domainIds` constrained to the six old domains.
- A constraint hypothesis requires one `primaryDomainId`.
- The model can represent uncertainty around one principal claim, but cannot model multiple interacting constraints and their originating, propagated, or reinforcing relationships.
- Signals, consequences, compensation, complexity demands, cross-cutting conditions, design causes, and interventions are not separate typed evidence or reasoning objects.
- There is no explicit counter-hypothesis that the issue is outside Organizational Capacity.

**Classification**

Evidence provenance, review, uncertainty, and disclosure controls are **KEEP**. Theme and hypothesis semantics are **REPLACE / MODIFY**. The typed diagnostic reasoning chain and constraint relationship model are **MISSING**.

### 5. Reports and the Capacity Operating Brief

**What is working**

- The product deliberately avoids a generic dashboard.
- The brief focuses leadership on the current finding, why it matters, confidence and uncertainty, accepted intervention, commitments, evidence, decisions requiring attention, and reassessment.
- The sample finding already uses language close to Architecture v1.0: authority and information expectations have not evolved with cross-functional complexity.
- The brief excludes participant-level content and distinguishes delivery evidence, operating change, and capacity change.
- Decision history and review actions make the report an operating instrument rather than a static artifact.

**Material conflicts**

- The finding model ultimately inherits a primary old-domain constraint.
- The brief does not yet show the Complexity Profile, compensation burden, mechanism interaction, constraint map, cross-cutting conditions, or design cause.
- It cannot visibly distinguish reducing unnecessary complexity from building capacity for necessary complexity.
- It does not expose a governed “not a capacity problem” conclusion.

**Classification**

The Capacity Operating Brief concept and governance are **KEEP**. Its diagnostic content model is **MODIFY** after the underlying reasoning architecture changes.

### 6. Intervention and longitudinal learning

**What is working**

- A validated finding is required before an intervention can be proposed.
- Client acceptance is distinct from advisor synthesis approval.
- Platform-guided and advisor-guided interventions use one governed record and entitlement model.
- Commitments, learning requirements, evidence plans, reviews, advisor escalation, reassessment, and decision history are connected.
- The product distinguishes intervention delivery from operating change and capacity change.
- Reassessment avoids causal overclaiming and preserves method/protocol versions.

**Material conflicts**

- Intervention records do not explicitly identify whether they reduce unnecessary complexity, increase capacity for necessary complexity, or both.
- Design levers are not separated from the mechanisms they are intended to influence.
- Legacy action cycles bind intervention hypotheses to one of six constraint domain IDs.
- Existing longitudinal assessment deltas compare domain scores and can therefore perpetuate the old model indefinitely.
- Continuous Capacity Intelligence requires ongoing observation of complexity demand, mechanism interaction, compensation, and constraint movement; present reassessment is only a partial foundation.

**Classification**

The governance loop is **KEEP**. Intervention taxonomy, causal linkage, and comparison semantics are **MODIFY / REPLACE**.

### 7. AI Readiness, leadership, culture, and technology

**AI Readiness — MODIFY**

Current messaging correctly notes that AI amplifies the operating system beneath it. That principle aligns with Architecture v1.0. However, AI Readiness should not become a parallel capacity model. AI can increase volume, variety, interdependence, uncertainty, and rate of change; technology and data are inputs; automation or workflow redesign may be design levers.

**Leadership — RELOCATE**

Leadership load, executive escalation, ambiguity absorption, and attention displacement are valuable evidence. They often indicate Capacity Compensation. Leadership must remain central to diagnosis and intervention, but as a cross-cutting capacity-shaping force rather than a peer domain score.

**Culture and incentives — RELOCATE**

The current culture content captures rewarded and tolerated behavior. Architecture v1.0 requires these to be modeled as cross-cutting conditions that shape all mechanisms, with stated culture and formal policy compared against lived behavior.

**Technology — RELOCATE**

The current technology questions are useful because they examine workflow, information, ownership, and adoption. Those observations should be retained, but technology itself must be classified as an input or design lever rather than a capacity mechanism.

## Technical implementation inventory

The following current contracts encode the old architecture and therefore constitute one migration surface:

| Surface | Encoded assumption | Classification |
|---|---|---|
| `assessment.js` | Six domain definitions, 18 items, overall index, interpretation bands, lowest-domain constraint | **REPLACE** |
| `diagnostic-question-library.js` | Every question belongs to one old domain | **REPLACE** |
| `diagnostic-protocol-engine.js` | Valid protocol must cover all six domains | **REPLACE** |
| `diagnostic-evidence-engine.js` | Themes use old `domainIds`; hypotheses require singular `primaryDomainId` | **REPLACE** |
| `comparison-engine.js` and `organization-comparison-engine.js` | Change is expressed through six-domain deltas | **REPLACE** |
| `organization-aggregation-engine.js` and organization demo data | Organization view aggregates six scores and primary constraints | **REPLACE** |
| `workspace/workspace.js` | Workspace labels, hypotheses, prompts, and action-cycle controls use six domains | **REPLACE / MODIFY** |
| `schemas/saved-profile.schema.json` | Six required scores, overall index, constraint IDs, target domain IDs | **REPLACE with versioned migration** |
| Diagnostic JSON schemas | Current evidence/hypothesis shape lacks the canonical reasoning layers | **MODIFY / REPLACE** |
| `db/migrations/001_workspace_foundation.sql` | Submission records store domain scores and primary constraint IDs | **LEGACY / MIGRATION REQUIRED** |
| `db/migrations/005_shared_action_cycles.sql` | Database check restricts constraints to six domain IDs | **REPLACE through additive migration** |
| `db/migrations/008_diagnostic_platform_foundation.sql` | Flexible JSON payloads preserve useful infrastructure, but governed protocol fixes 15 questions | **KEEP / MODIFY** |
| Longitudinal evidence documentation and version registry | Compatibility is defined around domain membership and score deltas | **REPLACE / VERSION** |
| Public pages and demos | Six domains presented as the Capacity Lens and diagnostic coverage | **REPLACE** |

Database tenancy, RLS, identity separation, encrypted-response handling, evidence review, entitlements, intervention records, operating briefs, reassessment records, audit events, and POC governance do **not** depend conceptually on the six-domain theory and are **KEEP** foundations.

Existing persisted records must not be silently reinterpreted under Architecture v1.0. They need explicit legacy version identity. A future migration must decide whether old records are displayed as historical methodology, transformed only where defensible, or excluded from new-model comparisons. This is an architectural escalation, not an implementation detail.

## What changes when the product becomes a diagnostic system

A conventional assessment asks respondents to rate items, aggregates the ratings into component scores, identifies the lowest score, and recommends an action associated with that score. The present lightweight assessment largely follows that pattern, even though its copy is appropriately cautious.

Architecture v1.0 requires a different logic:

- The **assessment** gathers signals and structured evidence efficiently. It may indicate that the organization is probably experiencing certain friction or compensation patterns. It does not determine the constraint.
- The **diagnostic system** defines the complexity and execution demand, examines consequences and compensation, reasons across the five mechanisms, tests cross-cutting conditions and formal-versus-lived architecture, maps constraint relationships, preserves competing explanations, and determines whether the issue is a capacity problem.
- The **intervention** follows the diagnosis. It may reduce unnecessary complexity, build capacity for necessary complexity, or combine both through explicit design levers.
- **Continuous Capacity Intelligence** observes how demand, mechanisms, compensation, and constraint relationships change over time without treating activity or perception deltas as proof of capacity change.

The practical distinction is that scores may be evidence, but they are not the diagnosis. A domain label cannot be the causal conclusion. The product’s intelligence must live in governed reasoning over multiple forms of evidence.

## Architectural escalations requiring resolution before Product Architecture v2

These conflicts should remain explicit at the review gate:

1. **Assessment output:** Architecture v1.0 rejects independent mechanism scores as a representation of Capacity. The future role, if any, of simple quantitative indicators must be decided without reintroducing a five-score substitute for the six-domain model.
2. **Legacy comparability:** Existing profiles, organizational aggregates, and longitudinal records use six-domain scores. New-model comparison cannot claim continuity unless a defensible empirical bridge exists.
3. **Protocol length and coverage:** The current 15-question common protocol is operationally useful but theoretically coupled to six-domain coverage. The audit does not assume that 15 remains the correct number or that every evidence layer can be covered through one fixed interview.
4. **Automated diagnostic validity:** Automation can administer evidence collection and assist reasoning, but the required standard for accepting, escalating, or withholding a diagnostic conclusion must be defined—including the “not a capacity problem” route.
5. **Adaptive Capacity:** Architecture v1.0 names it as distinct and under-researched. Product v2 must decide what is claimable now, what is a research hypothesis, and what requires POC validation.
6. **Mechanism interaction:** A model is needed for interactions without collapsing them into five additive scores or producing an opaque AI conclusion.
7. **Design causes and design levers:** These require a governed taxonomy that remains distinct from mechanisms, inputs, conditions, and interventions.
8. **Public simplicity versus diagnostic rigor:** The Capacity Lens must remain understandable without teaching the entire internal reasoning architecture or exposing proprietary method.
9. **Evidence sufficiency:** Minimum participant counts protect confidentiality but do not alone establish diagnostic sufficiency. Coverage and evidence-quality standards require separate governance.
10. **Intellectual-property boundary:** The site and guided journey should explain what the system sees and why that matters while withholding the proprietary rules that convert evidence into a governed diagnosis.

## Sequencing constraints for the eventual migration

This audit does not prescribe Product Architecture v2, but it establishes constraints on safe sequencing:

- Do not rename the six domains to the five mechanisms while retaining the same scoring and lowest-score logic.
- Do not rewrite the public Capacity Lens before the assessment and diagnostic contracts have an agreed target architecture; otherwise the promise and product will diverge.
- Do not alter persisted six-domain data in place or compare it directly with new-model outputs without a declared compatibility policy.
- Preserve confidentiality, tenancy, evidence provenance, review gates, uncertainty, intervention governance, and reassessment throughout the migration.
- Version the intellectual architecture, assessment instrument, evidence model, diagnostic reasoning model, reports, and comparison rules independently but compatibly.
- Validate novel constructs—especially Adaptive Capacity, mechanism interaction, compensation inference, and automated diagnostic sufficiency—through the POC change-candidate and validation system already built.

## Phase 1 disposition

The existing product should not be discarded. Its most difficult operational foundations—privacy, evidence governance, route parity, leadership decision gates, intervention operations, and longitudinal learning—are already substantially aligned with the frozen architecture.

The product does require a real intellectual-architecture migration. The current six-domain ontology and every contract derived from it must be treated as legacy. Architecture v1.0 should become the governing source for the next product architecture, with the assessment repositioned as an evidence instrument and the diagnostic system becoming the locus of reasoning.

**Stop gate:** Phase 1 is complete upon stakeholder review of this audit. No Product Architecture v2 design or implementation should begin until the classifications, conflicts, and escalations above are accepted or amended.
