# Organizational Capacity Platform v2

**Status:** Proposed product architecture for review

**Governing source:** Senger Advisory Architecture v1.0 (frozen)

**Predecessor:** Product Architecture Audit v1.0

**Implementation state:** Not yet implemented

## 1. Product proposition

The Organizational Capacity Platform helps an organization determine whether its operating system has the capacity required for the complexity it must carry, understand what is creating disproportionate friction or unsustainable effort, and choose what should change.

The platform does not diagnose an organization by finding its lowest survey score. It assembles and governs evidence, reasons across plausible explanations, maps interacting constraints, and supports a leadership decision about intervention.

The product trajectory remains:

**Assessment → Diagnostic System → Continuous Capacity Intelligence**

These are related products with different promises:

- The **Assessment** recognizes possible signals and helps a leader decide whether further investigation is warranted.
- The **Diagnostic System** determines what the organization is being asked to carry, whether Capacity is implicated, where the operating system is constrained, why, and what should change.
- **Continuous Capacity Intelligence** periodically or continuously observes changes in complexity demand, operating mechanisms, friction, compensation, and constraint movement.

## 2. Governing product principles

1. **Capacity is always relational.** Every material output must identify the execution demand against which Capacity is being considered.
2. **Evidence is not diagnosis.** Survey responses, interviews, operating data, and friction signals inform reasoning; none independently determines the finding.
3. **Mechanisms are not independent scores.** The five mechanisms organize evidence and reasoning but must not become a five-bar replacement for the former six-domain scorecard.
4. **Current performance may conceal fragility.** The product must look for Capacity Compensation as well as visible performance degradation.
5. **One symptom can have multiple causes.** Competing explanations and disconfirming evidence remain visible until resolved or explicitly retained as uncertainty.
6. **One organization can have interacting constraints.** The product must represent originating, propagated, and reinforcing relationships rather than require one root cause.
7. **Formal architecture and lived behavior are different evidence.** Both must be collected and compared.
8. **Diagnosis determines intervention.** Product recommendations cannot be reverse-engineered from Senger Advisory’s service catalog.
9. **“Not a capacity problem” is a valid outcome.** The system must protect the boundary of the discipline.
10. **Confidentiality is architectural.** Participant identity, raw response content, de-identified evidence, organizational findings, and leadership decisions remain separate records with separate access rules.
11. **Automation must preserve uncertainty.** AI may structure evidence and propose reasoning, but cannot manufacture confidence or bypass governed review.
12. **The method is versioned and testable.** Architecture defines the current model; product evidence pressure-tests it; approved architectural changes create new versions.

## 3. Target product architecture

The platform consists of seven connected product layers.

### Layer 1 — Entry and signal recognition

Purpose: help a leader recognize a possible complexity–capacity mismatch without claiming a diagnosis.

Components:

- public category narrative and Capacity Lens;
- signs and executive education;
- optional lightweight Assessment;
- private saved signal profile;
- invitation to begin a Diagnostic.

Primary output: **Capacity Signal Brief**.

The brief may say, for example:

> Your organization appears to be carrying increasing cross-functional interdependence through senior escalation and manual coordination. This may indicate a capacity constraint, but the assessment cannot determine whether the source is authority, information, capability, governance, or another cause.

It must not name a definitive constrained mechanism or prescribe an intervention.

### Layer 2 — Diagnostic framing

Purpose: define the decision, execution demand, and complexity the organization must carry.

Components:

- engagement and entitlement;
- sponsor discovery;
- Complexity Profile;
- diagnostic question and scope statement;
- participant/evidence plan;
- confidentiality and collection-readiness gates.

Primary output: **Diagnostic Frame**.

The frame answers:

- What must the organization execute?
- What decision must this diagnostic inform?
- What is changing in the demand?
- Which complexity is necessary, potentially unnecessary, or not yet classifiable?
- What evidence and perspectives are required?
- What is explicitly outside scope?

### Layer 3 — Evidence collection

Purpose: gather multiple forms of evidence without confusing the instrument with the diagnosis.

Components:

- sponsor evidence;
- participant written or live interviews;
- structured Operating Capacity evidence collection;
- friction and compensation evidence;
- formal architecture artifacts where available;
- selected organizational or operational data where proportionate;
- evidence de-identification and disclosure review.

Primary output: **Governed Evidence Set**.

### Layer 4 — Diagnostic reasoning

Purpose: reason backward from observed patterns to plausible operating-system constraints.

Components:

- signal and consequence synthesis;
- compensation analysis;
- mechanism evidence;
- cross-cutting conditions;
- formal-versus-lived comparison;
- alternative explanations;
- sufficiency and confidence evaluation;
- capacity-boundary test.

Primary output: **Diagnostic Finding Set**.

### Layer 5 — Constraint mapping and intervention architecture

Purpose: make the causal organizational story visible and determine what should change.

Components:

- constraint nodes and relationships;
- originating, propagated, and reinforcing classifications;
- design-cause hypotheses;
- necessary/unnecessary complexity decision;
- design-lever candidates;
- intervention options and rejected alternatives;
- leadership validation and acceptance.

Primary outputs: **Constraint Map** and **Intervention Architecture**.

### Layer 6 — Capacity Operating Brief

Purpose: turn the diagnostic into an active leadership decision and learning instrument.

Components:

- current complexity–capacity fit statement;
- governed finding and uncertainty;
- constraint map;
- accepted intervention;
- commitments and learning requirements;
- leading signs and evidence plan;
- decisions requiring attention;
- reviews, escalation, and decision history.

Primary output: **Capacity Operating Brief**.

### Layer 7 — Reassessment and Capacity Intelligence

Purpose: determine what changed and identify emerging mismatch before performance degradation becomes severe.

Components:

- bounded reassessment;
- complexity-change comparison;
- mechanism and compensation change evidence;
- constraint persistence/emergence;
- intervention learning;
- periodic monitoring, when evidence and product maturity permit.

Primary output initially: **Capacity Change Brief**.

Long-term output: **Continuous Capacity Intelligence**.

## 4. Revised information architecture

### Public website

The public experience should follow the category logic rather than the firm’s service menu:

1. **Organizational Capacity** — the phenomenon and executive relevance.
2. **The Capacity Lens** — the causal system and five executive questions.
3. **Signs of Strain** — friction and compensation leaders recognize.
4. **Assessment** — a lightweight Capacity Signal Brief.
5. **Diagnostic** — how governed evidence produces a defensible finding.
6. **Platform Journey** — a controlled demonstration of sponsor, participant, synthesis, report, and intervention experiences.
7. **Insights** — development of the category and evidence base.
8. **About Senger Advisory** — the firm behind the system.
9. **Connect** — assessment, diagnostic conversation, or guided demonstration.

AI Readiness, leadership, culture, technology, and coaching should appear as applications, evidence, conditions, or intervention possibilities—not as peer navigation categories that redefine Organizational Capacity.

### Authenticated platform

The sponsor experience should be organized around a progressing diagnostic decision:

1. **Current decision** — what leadership is trying to understand or decide.
2. **Diagnostic frame** — complexity profile, scope, evidence plan, and readiness.
3. **Evidence progress** — participation and review state, never participant content.
4. **Finding** — released only after confidentiality and sufficiency gates.
5. **Constraint map** — the governed causal story and uncertainty.
6. **Intervention decision** — options, rationale, fees, route, and acceptance.
7. **Operating brief** — commitments, evidence, reviews, and decisions.
8. **Capacity change** — reassessment and emerging demand.

Platform Operations, advisor review, commercial administration, partner configuration, and POC governance remain separate role-specific workspaces rather than temporary sponsor-dashboard sections.

## 5. Revised Capacity Lens and system visual

The Capacity Lens should no longer be a ring of six equal domains. It should depict a relationship and a flow.

### Public form of the Lens

The simplest public visual has four states:

**What the organization must carry**

Complexity required for execution

↓

**How the operating system carries it**

Five interacting executive questions

↓

**What happens when fit weakens**

Friction rises and people compensate

↓

**What leaders can change**

Reduce unnecessary complexity and/or increase capacity for necessary complexity

The five executive questions sit inside the operating-system layer:

- What matters?
- Who owns and decides?
- What do we know and understand?
- How do we work together?
- What do we have, and where does it go?

The visual must communicate interaction, not five independent health indicators. The mechanisms may be represented as an interconnected carrying system whose behavior changes under different complexity demands.

### Diagnostic form of the Lens

The authenticated diagnostic adds:

- complexity dimensions and necessary/unnecessary status;
- evidence strength around each mechanism interaction;
- cross-cutting leadership, culture, and incentive conditions;
- constraint relationships;
- compensation load;
- design causes and intervention levers.

This is a causal map, not a scorecard.

### Interaction behavior

The public visual should demonstrate one controlled causal sequence at a time. For example:

> Interdependence increases → authority remains concentrated → coordination demand rises → senior attention fragments → meetings and escalation compensate.

The user can explore alternate sequences, making visible that the same symptom can originate differently. This teaches the category without disclosing proprietary diagnostic rules.

## 6. Revised website narrative

### Governing story

Organizations are continually asked to carry more or different complexity. Growth is one source, alongside strategy, change, technology, AI, regulation, acquisitions, and increasing interdependence.

The question is not whether complexity exists. It is whether the operating system can carry the complexity required for execution without everything becoming disproportionately harder and slower.

When it cannot, friction rises. Decisions slow. Coordination expands. Leaders become bottlenecks. People build workarounds and compensate through extraordinary effort. Performance may hold for a time, concealing the constraint.

The Capacity Lens helps leaders see:

- what the organization is being asked to carry;
- where the operating system is struggling to carry it;
- where people are compensating;
- what is creating the mismatch; and
- what should change.

Senger Advisory built the Organizational Capacity Platform to turn that lens into governed evidence, a defensible diagnosis, and focused intervention.

### Narrative boundaries

Public copy should say:

- “possible capacity strain,” not “your capacity problem,” before diagnosis;
- “evidence suggests,” not “the score proves”;
- “capacity for the required execution demand,” not “more capacity” in the abstract;
- “reduce unnecessary complexity and/or strengthen the operating system,” not a universal capacity-building prescription;
- “leadership may shape or compensate for the system,” not “leadership is a capacity domain.”

## 7. Assessment v2 — Capacity Signal Assessment

### Purpose

The Assessment remains free, brief, reusable, and useful. It gives a leader a better way to recognize what the organization may be experiencing and whether a Diagnostic is warranted.

It is explicitly not a miniature Diagnostic.

### Evidence collected

The Assessment should gather a small amount of evidence across four lenses:

1. **Execution demand** — what the organization is being asked to accomplish and what is changing.
2. **Friction** — where work is becoming disproportionately harder, slower, or less reliable.
3. **Compensation** — where performance depends on escalation, heroics, workarounds, excess coordination, or key people.
4. **Operating-system signals** — observations relevant to the five mechanisms without treating them as causal scores.

### Output

The Capacity Signal Brief includes:

- the execution demand selected by the respondent;
- the demand driver, time horizon, and a bounded statement of why that context matters;
- a qualified possible operating pattern connecting likely friction, visible or latent compensation, and formal-versus-lived system drift without claiming causality;
- questions the evidence raises about the operating system;
- plausible alternative explanations;
- balanced decision risk covering both premature action and prolonged inaction;
- a lightweight action that does not depend on causal certainty;
- what the Diagnostic would need to investigate;
- a clear statement of the Assessment’s limits.

It should not include:

- an overall Capacity score;
- five mechanism scores;
- a definitive primary constraint;
- a prescriptive service recommendation;
- claims about the entire organization from one respondent.

The executive narrative should follow **Demand → Emerging pattern → Decision risk → Disciplined next move** and remain compact enough to function as a two-page printed brief.

### Multi-perspective use

If retained, organizational aggregation should identify convergence, divergence, and evidence gaps around demands, friction, and compensation. It must not average respondent perceptions into a Capacity score. Minimum-cell confidentiality rules remain unchanged.

## 8. Complexity Profile experience

The Complexity Profile establishes “capacity for what?” before the platform interprets operating evidence.

### Sponsor workflow

The sponsor identifies:

- the strategy, change, decision, or execution commitment at issue;
- the consequences of successful or failed execution;
- current and anticipated demand;
- material changes in volume, variety, interdependence, uncertainty, and rate of change;
- constraints imposed externally or deliberately by strategy;
- suspected internally generated complexity;
- the time horizon;
- what is explicitly out of scope.

### Complexity objects

Each material demand is recorded with:

- source;
- description;
- complexity dimensions affected;
- current/anticipated state;
- evidence;
- classification: necessary, unnecessary, mixed, or undetermined;
- confidence and rationale.

“Necessary” and “unnecessary” are diagnostic classifications, not sponsor declarations. Sponsor input begins the hypothesis; evidence may change it.

### Output

The Complexity Profile is a narrative and structured map of demand. It should avoid a single complexity score unless future evidence establishes that such a score is meaningful.

## 9. Operating Capacity evidence collection

The five mechanisms organize inquiry:

| Mechanism | Fundamental question | Evidence sought |
|---|---|---|
| Priority & Attention | What matters? | priority stability, tradeoffs, attention allocation, displacement, competing demand |
| Authority & Accountability | Who owns and decides? | ownership, thresholds, decision rights, escalation, accountability in practice |
| Information & Sensemaking | What do we know and understand? | information flow, interpretation, timeliness, trust, reconstruction, shared meaning |
| Coordination | How do we work together? | interdependence, handoffs, synchronization, forums, integration cost, repair |
| Resource & Capability Deployment | What do we have, and where does it go? | people, expertise, time, capital, technology, data, allocation, fit, bottlenecks |

Questions may map to multiple mechanisms, complexity dimensions, signals, compensation types, or alternative explanations. Protocol validity depends on evidence sufficiency for the diagnostic question—not equal question counts per mechanism.

Evidence can come from:

- sponsor discovery;
- structured participant interviews;
- short survey instruments;
- formal policies and organizational artifacts;
- workflow and operating data;
- prior intervention history;
- leadership validation;
- reassessment observations.

## 10. Adaptive Capacity treatment

Adaptive Capacity remains an explicit but research-limited construct.

For v2, the product should collect evidence about:

- recognition of changing demand;
- willingness to question the current operating model;
- ability to alter mechanisms intentionally;
- speed and quality of adaptation;
- learning from prior interventions;
- persistence of obsolete workarounds or design choices.

The product may report **adaptive-capacity observations** and associated uncertainty. It must not initially issue an Adaptive Capacity score or claim a settled causal relationship with the five mechanisms.

This limitation should be visible in the method version and POC validation plan.

## 11. Friction and Capacity Compensation detection

### Friction record

A friction observation includes:

- signal type;
- location in work or decision flow;
- frequency and duration;
- affected execution demand;
- performance consequence;
- perspectives observing it;
- supporting and weakening evidence;
- confidence.

### Compensation record

A compensation observation includes:

- compensation type: heroics, escalation, redundancy, manual system, excess coordination, key-person dependency, longer hours, shadow process, or other;
- what performance it preserves;
- which mechanism failure or demand it may be carrying;
- sustainability and concentration risk;
- whether leaders recognize it;
- supporting and weakening evidence;
- confidence.

The platform must distinguish:

- visible friction with degraded performance;
- visible compensation preserving performance;
- both occurring together; and
- insufficient evidence.

## 12. Diagnostic reasoning architecture

### Reasoning chain

Each material finding must traverse the governed chain where evidence permits:

1. **Observed signal**
2. **Performance consequence**
3. **Capacity Compensation**
4. **Complexity demand**
5. **Constrained mechanism interaction**
6. **Constraint relationship**
7. **Cross-cutting conditions**
8. **Underlying design cause**
9. **Intervention implication**

Missing links remain explicit. The system must not fill them with plausible-sounding AI prose.

### Diagnostic hypotheses

A hypothesis includes:

- a precise claim;
- the execution demand it affects;
- evidence supporting and weakening it;
- mechanisms implicated and their interaction;
- complexity involved;
- friction and compensation patterns;
- cross-cutting conditions;
- constraint relationships;
- plausible design causes;
- competing explanations;
- evidence still needed;
- confidence and confidence basis;
- boundary status.

### Boundary status

Every Diagnostic must end in one of four governed states:

- **Capacity constraint supported**
- **Capacity constraint plausible; more evidence required**
- **Capacity constraint not supported; another explanation is stronger**
- **Inconclusive**

The third state operationalizes “This isn’t a capacity problem” without pretending the platform has diagnosed the alternate discipline.

### AI role

AI may:

- structure and classify evidence;
- identify candidate patterns and contradictions;
- generate competing explanations;
- detect missing links;
- propose constraint maps;
- draft findings and intervention options;
- identify disclosure risk.

AI may not:

- access identity data unnecessarily;
- release raw or participant-attributable content;
- bypass confidentiality, sufficiency, advisor, or leadership gates;
- convert low evidence into high confidence;
- declare causality solely from correlation or language frequency;
- finalize a finding outside the governed method.

## 13. Constraint mapping

The Constraint Map is a directed evidence-backed graph.

### Node types

- complexity demand;
- constrained mechanism or mechanism interaction;
- friction;
- compensation;
- cross-cutting condition;
- design cause;
- performance consequence;
- external or non-capacity factor.

### Relationship types

- generates demand on;
- constrains;
- propagates to;
- reinforces;
- compensates for;
- conceals;
- degrades;
- enables;
- contradicts;
- remains uncertain.

### Constraint classifications

- **Originating:** evidence supports it as an upstream initiating constraint in the scoped causal story.
- **Propagated:** evidence supports it as a constraint produced downstream.
- **Reinforcing:** evidence supports reciprocal persistence among two or more constraints.
- **Unresolved:** relationship or direction is not sufficiently established.

“Primary constraint” may be used in executive language only when the evidence supports decision priority. It must not mean “lowest mechanism score” or imply that all other constraints are secondary effects.

## 14. Cross-cutting conditions

### Leadership

Leadership evidence is attached wherever leaders:

- shape priorities, authority, information, coordination, or deployment;
- compensate for weak mechanisms;
- create or reduce unnecessary complexity;
- reinforce or challenge formal architecture;
- enable or inhibit adaptation.

Leadership development is recommended only when a behavior or capability is materially implicated in the constraint map.

### Culture and incentives

Culture and incentives are recorded as conditions affecting the operation of mechanisms. Each finding should distinguish:

- formal expectation;
- observed behavior;
- reward or consequence;
- divergence between formal and lived architecture;
- effect on the constraint.

### Technology and AI

Technology, AI, and data are recorded in one or more roles:

- complexity generator;
- resource/input;
- source of friction;
- source of information or capability;
- design lever;
- external or technical failure outside the Capacity discipline.

The platform should never infer that an AI or technology problem is a Capacity problem without evidence of a material operating-system constraint.

## 15. Design-lever and intervention logic

### Intervention fork

Every accepted intervention must state whether it intends to:

- reduce unnecessary complexity;
- increase capacity for necessary complexity; or
- do both.

### Design levers

Candidate levers include:

- structure;
- roles;
- governance;
- processes;
- technology;
- talent and capability;
- decision rules;
- operating cadence;
- incentives;
- leadership behavior and development.

The lever is not the intervention by itself. The intervention record must state:

- diagnosed constraint and demand;
- design cause being tested;
- selected lever and why it fits;
- alternatives considered and rejected;
- expected mechanism change;
- expected reduction in friction or compensation;
- commitments and owner;
- evidence plan;
- risks and possible unintended complexity;
- review and stop/adjust/escalate criteria;
- route and commercial terms.

Automated and advisor-guided routes use the same logic. The difference is facilitation and service delivery, not diagnostic rigor.

## 16. Executive reporting

The Capacity Operating Brief remains the central sponsor experience. It should answer, in order:

1. **What are we being asked to carry?**
2. **What is happening now?**
3. **How is performance being affected or preserved through compensation?**
4. **What does the evidence support?**
5. **How do the constraints interact?**
6. **What remains uncertain or could explain the pattern differently?**
7. **Is this a capacity problem?**
8. **What should change, and why this intervention?**
9. **What must leadership decide now?**
10. **What evidence will tell us whether the intervention is working?**

The default visual hierarchy is:

- one current complexity–capacity fit statement;
- one constraint map;
- one confidence and uncertainty panel;
- one accepted intervention hypothesis;
- current commitments and decisions requiring attention;
- evidence movement since the last review.

No participant-level answers, excerpts, small-cell breakdowns, or individual scores appear.

## 17. Evidence and data architecture

### Canonical evidence layers

1. **Complexity Profile**
2. **Operating Capacity Evidence**
3. **Friction & Compensation Evidence**
4. **Diagnostic Reasoning**
5. **Constraint Map**
6. **Intervention Architecture**
7. **Longitudinal Capacity Evidence**

### Core records

The target data model introduces versioned records for:

- `execution_demands`
- `complexity_observations`
- `mechanism_evidence`
- `friction_observations`
- `compensation_observations`
- `formal_architecture_evidence`
- `lived_behavior_evidence`
- `cross_cutting_conditions`
- `diagnostic_hypotheses`
- `constraint_nodes`
- `constraint_edges`
- `diagnostic_boundary_decisions`
- `design_cause_hypotheses`
- `intervention_options`
- `capacity_change_findings`

Each derived claim requires evidence references, method version, confidence, confidence basis, review state, and audit history.

### Data separation

The existing separation remains:

- **Identity:** workspace, membership, participant slot, invitations.
- **Private source:** encrypted response content and attributable source data.
- **Governed evidence:** de-identified reviewed evidence.
- **Shared organizational finding:** threshold-qualified, participant-free diagnostic records.
- **Operational decision:** interventions, commitments, reviews, entitlements, and history.
- **Research:** separately consented and de-identified product-method evidence.

### Scores and indicators

Quantitative indicators may be used for evidence quality, observation frequency, confidence calibration, participation, or operational measures. They must not be presented as an absolute Organizational Capacity score unless future research validates such a construct.

## 18. Capacity Engine trajectory

The Capacity Engine is a staged capability, not a near-term feature label.

### Stage 1 — Governed point-in-time Diagnostic

- structured Complexity Profile;
- multi-source evidence;
- diagnostic reasoning;
- constraint map;
- intervention architecture;
- Capacity Operating Brief.

### Stage 2 — Bounded Capacity Change Intelligence

- planned reassessment;
- changed complexity demand;
- friction and compensation movement;
- constraint persistence, propagation, or resolution;
- intervention learning;
- no causal overclaiming.

### Stage 3 — Periodic Capacity Intelligence

- scheduled pulse evidence;
- selected operating-data integrations;
- emerging-friction and compensation signals;
- leadership review thresholds;
- versioned trend interpretation.

### Stage 4 — Continuous Capacity Intelligence

- near-continuous demand and operating signals where justified;
- early mismatch detection;
- dynamic constraint hypotheses;
- proactive evidence requests;
- decision support before material degradation.

Progression requires demonstrated validity, confidentiality, buyer value, and sustainable data access. The platform must not call ordinary dashboards or generic pulse surveys a Capacity Engine.

## 19. Migration from the current platform

### Preserve intact

- Clerk identity and workspace tenancy;
- Postgres RLS and role boundaries;
- invitation and participant-slot model;
- confidentiality threshold;
- encrypted response handling;
- de-identification and disclosure review;
- advisor evidence review;
- leadership validation;
- automated/advisor-led route parity;
- entitlement and payment boundary;
- intervention acceptance;
- Capacity Operating Brief workflow;
- evidence journal, reviews, check-ins, escalation, and decision history;
- reassessment governance;
- POC scorecard and change-candidate ledger;
- co-branding and partner-commercial boundary.

### Retire as legacy

- the six-domain ontology;
- six-domain public Capacity Lens;
- overall Capacity Index;
- lowest-domain primary constraint;
- six-domain aggregation and comparison;
- required six-domain protocol coverage;
- theme `domainIds` and hypothesis `primaryDomainId` as the diagnostic causal model;
- action-cycle constraints tied to old domain IDs.

### Compatibility policy

- Existing results retain their original assessment, scoring, schema, and report versions.
- Legacy records are never relabeled as five-mechanism evidence.
- Old and new results are not numerically compared.
- A user with a legacy profile may view the historical report and begin a new-model baseline.
- Organizational workspaces may preserve legacy findings as historical methodology with a clear boundary.
- Database change is additive first: new tables/fields and new method versions precede removal of old code paths.
- Removal occurs only after active legacy workflows are enumerated, migration behavior is tested, and product owners approve the deprecation state.

## 20. Smallest coherent release sequence

### Release A — Intellectual coherence at the public boundary

- revise the governing website narrative;
- replace the six-domain Lens with the complexity–mechanism–fit story;
- remove public claims that six domains determine Capacity;
- retain current calls to action while clearly distinguishing signal from diagnosis.

This release changes public explanation, not diagnostic records.

### Release B — Capacity Signal Assessment v2

- introduce execution demand, friction, compensation, and operating-system signal evidence;
- replace overall/domain scores with the Capacity Signal Brief;
- version private saving and aggregation;
- preserve legacy report access without cross-version scoring comparisons.

### Release C — Diagnostic Frame and evidence model v2

- introduce structured Complexity Profile;
- replace six-domain protocol coverage;
- add mechanism, friction, compensation, formal/lived, and cross-cutting evidence records;
- preserve current routes, participation, privacy, and review gates.

### Release D — Diagnostic reasoning and Constraint Map v2

- introduce typed reasoning chain;
- add constraint nodes/edges and boundary decisions;
- update automated synthesis and advisor validation;
- release the governed finding and map through existing leadership gates.

### Release E — Intervention Architecture and Operating Brief v2

- connect findings to necessary/unnecessary complexity and design levers;
- update intervention options and acceptance;
- revise the Capacity Operating Brief around fit, constraints, compensation, uncertainty, and evidence movement.

### Release F — Capacity Change Intelligence

- replace six-domain reassessment comparisons;
- compare demand, evidence, compensation, constraints, and operating change;
- validate periodic Capacity Intelligence through POCs before expanding data integrations.

## 21. POC and evidence agenda

The existing POC Operating Protocol and change-candidate ledger should test:

- whether sponsors can define a meaningful execution demand;
- whether participants understand questions without seeing the internal model;
- whether friction and compensation can be distinguished reliably;
- whether evidence supports mechanism-interaction claims;
- whether formal-versus-lived divergence improves diagnostic accuracy;
- whether automated reasoning preserves plausible alternatives;
- whether reviewers agree on constraint classifications;
- whether the non-capacity outcome is usable and commercially credible;
- whether the Constraint Map improves executive understanding and intervention choice;
- whether intervention evidence distinguishes delivery, operating change, and capacity change;
- whether adaptive-capacity observations prove useful without overstating the construct;
- willingness to pay for the Diagnostic and separately for intervention support.

Approved product changes remain explicit, traceable candidates rather than silent method drift.

## 22. Architectural escalations

Product Architecture v2 does not resolve the following frozen-architecture questions:

1. Whether any valid composite measure of Organizational Capacity can eventually exist.
2. How mechanism interaction should be formally represented beyond an evidence-backed causal graph.
3. The exact relationship between Adaptive Capacity and the five Operating Capacity Mechanisms.
4. The validity and reliability standard required for automated diagnostic conclusions.
5. Whether Complexity dimensions can or should be quantitatively combined.
6. How to distinguish an originating constraint from a high-leverage intervention point when causal direction remains uncertain.
7. The minimum evidence required for each diagnostic boundary state across different organization sizes and contexts.
8. Which operating-data integrations add diagnostic validity rather than merely more data.
9. Whether Capacity Compensation can be measured consistently across cultures, roles, and operating models.
10. The empirical compatibility, if any, between legacy six-domain evidence and Architecture v1.0.

These issues return to Integration & Architecture and the POC evidence process. Product must expose the uncertainty rather than establish new theory implicitly.

## 23. Review standard and implementation gate

Product Architecture v2 is ready for implementation planning only if reviewers agree that:

- it instantiates Architecture v1.0 without redefining it;
- it preserves the strongest existing platform foundations;
- it does not replace six independent scores with five independent scores;
- the Assessment remains useful without claiming diagnosis;
- the Diagnostic can represent complexity, compensation, interacting constraints, and uncertainty;
- leadership, culture, incentives, technology, and AI occupy their correct architectural roles;
- intervention follows diagnosis and includes the complexity-reduction/capacity-increase fork;
- legacy data is preserved without false comparability;
- the release sequence creates intellectual coherence before pursuing continuous intelligence.

**Stop gate:** No substantive Product Architecture v2 implementation should begin until this target architecture is reviewed and accepted or amended.
