# Diagnostic Frame and Evidence Model v2

## Purpose

Release C converts the approved Organizational Capacity architecture into governed, machine-readable diagnostic foundations. It does not replace the active v1 collection workflow yet. The v2 model runs in parallel until its storage, workspace, synthesis, and migration paths are separately approved and validated.

The central question is no longer whether an organization is generically “healthy.” It is:

> Does this organization have the capacity to carry the complexity required by a specific execution demand—and where does its operating system create avoidable load?

## 1. Diagnostic Frame

Every v2 diagnostic begins with an approved frame. The frame establishes:

- the execution commitment the organization must carry;
- what success and failure mean in observable terms;
- the leadership decision the diagnostic must inform;
- the relevant time horizon and performance consequences;
- current and anticipated complexity across volume, variety, interdependence, uncertainty, and rate of change;
- provisional hypotheses about necessary, unnecessary, mixed, or undetermined complexity;
- participant, artifact, operating-data, and validation evidence plans;
- explicit exclusions, sensitivities, and accepted evidence gaps.

The sponsor may help form the initial classification, but sponsor belief is not treated as a finding. Classification remains provisional until it is tested against de-identified participant evidence and other available sources.

## 2. Evidence protocol

The shared core protocol contains 12–18 governed questions selected and contextualized for the approved frame. It is not forced into equal question counts by mechanism. Approval is based on evidence sufficiency:

- complexity and execution demand;
- necessary-versus-unnecessary complexity hypotheses;
- observable signals and consequences;
- all five operating mechanisms;
- interaction among mechanisms;
- compensating effort;
- formal-versus-lived behavior;
- leadership, culture, incentives, and other cross-cutting conditions;
- counterexamples and competing non-capacity explanations;
- prior intervention history and unresolved evidence gaps.

Adaptive prompts may improve specificity and trace operating sequences, but they do not alter the shared core protocol. Adaptive Capacity remains a research observation in this release and does not produce a score.

## 3. Typed evidence

Approved, de-identified evidence can be transformed into five typed records:

| Evidence type | What it represents |
| --- | --- |
| Mechanism evidence | How one or more operating mechanisms behave under the framed demand |
| Friction observation | Where work becomes harder, slower, less reliable, or more expensive |
| Compensation observation | How heroics, escalation, redundancy, manual systems, or excess coordination preserve performance |
| Formal-versus-lived evidence | Where official intent differs from what people can or are rewarded to do |
| Cross-cutting condition | How leadership, culture, incentives, governance, risk, or external conditions shape mechanisms |

Each record preserves supporting and weakening source references, the perspective pattern, performance consequence, confidence, and confidence basis. Only approved de-identified v1 evidence may be referenced. This maintains the existing identity/content separation and disclosure-review boundary.

Leadership, culture, and technology are not modeled as standalone mechanisms. They are conditions, inputs, or capabilities that influence how the operating system functions.

## 4. Release boundary

Release C adds versioned domain logic, contracts, tests, and method documentation only.

It does **not**:

- mutate existing diagnostic records;
- change the current sponsor or participant workspace;
- expose participant-level content to workspace roles;
- publish v2 findings or interventions;
- change production database tables;
- claim anonymity or produce mechanism, capacity, or Adaptive Capacity scores.

The next integration slice should add tenant-isolated v2 persistence and an advisor-facing Diagnostic Frame workflow. That change should retain server-enforced minimum-cohort, confidentiality, evidence-review, and release-readiness gates before any organizational finding is visible.
