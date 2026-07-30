# Security, Privacy, and Confidentiality Brief

## Purpose and status

This is the internal technical brief for the Senger Advisory Organizational Capacity Platform. It explains the control model, likely buyer questions, and the difference between protections implemented today, controls required before production, and longer-term assurance work.

The platform must not claim absolute anonymity, regulatory compliance, penetration-test results, or certification until those claims are independently supported. De-identification reduces disclosure risk; it cannot eliminate the possibility that a distinctive event, role, or phrase could be recognized.

## Core security promise

The platform is designed so organizational leaders can learn from a multi-perspective diagnostic without receiving individual interview content or attributed answers. Access to operate a workspace does not imply access to confidential evidence.

The control model combines tenant isolation; separation of identity, raw responses, de-identified evidence, findings, and commerce; least-privilege access; disclosure review; aggregation and release gates; auditability; retention and deletion controls; and bounded AI processing.

## Data boundaries

| Boundary | Examples | Authorized access | Excluded access |
| --- | --- | --- | --- |
| Identity and participation | Email, invitation, consent, completion | Authorized operations and designated logistics roles | Synthesis models and ordinary advisor evidence views |
| Raw confidential responses | Written interviews, consented transcripts | Restricted evidence service; exceptional authorized review | Client sponsor, facilitator, platform admin by default |
| De-identified evidence | Redacted excerpts, question reference, disclosure risk | Assigned advisor and protected synthesis service | Client sponsor before governed release |
| Diagnostic findings | Themes, uncertainty, hypothesis | Assigned advisor; authorized client leaders after validation | Participants and unrelated tenants |
| Commercial data | Offer, entitlement, payment-provider reference | Authorized commercial operations | Evidence and synthesis workflows |
| Intervention record | Commitments, measures, reviews | Authorized client and assigned advisor roles | Unrelated tenants and partners |

Raw interview records use opaque identifiers and exclude participant names, email addresses, account identifiers, and invitation identifiers. Operational systems can know that a person participated without retrieving that person’s answers through the same record.

## Implemented safeguards

The development platform currently implements or explicitly enforces:

- Clerk-authenticated organizational access and server-derived workspace identity;
- Postgres row-level security scoped to the active workspace;
- separate database schemas for identity, private evidence, shared findings, and operations;
- separated platform, sponsor, facilitator, participant, and advisor roles;
- explicit, time-bounded advisor assignments with purpose and audit history;
- participant access limited to the participant’s own interview workflow;
- no individual response content in sponsor participation-progress responses;
- de-identified evidence review before synthesis, with human review required for high-risk evidence;
- exclusion of pending or rejected evidence from synthesis;
- synthesis using only advisor-approved de-identified evidence;
- OpenAI Responses requests configured with `store: false` and constrained structured output;
- cross-origin checks, input validation, no-store response headers, and endpoint rate limits;
- audit events for material diagnostic operations; and
- client release blocked while a finding remains an AI-assisted advisor draft.
- a server-enforced POC release gate requiring advisor approval, resolved disclosure review,
  completion by every assigned perspective, and at least five completed perspectives;
- a minimized sponsor finding that excludes evidence identifiers, excerpts, participant
  identity, raw responses, and advisor-only notes.
- leadership-validator identity and response content stored separately from the governed
  diagnostic finding, with only a minimized decision state used by the client workflow.

Automated contracts cover these boundaries, including a live Postgres test of cross-workspace row-level-security isolation.

## Required before production

These are launch requirements, not current production claims:

- verify TLS and encryption-at-rest assurances for every provider;
- managed secret storage, rotation, environment separation, and removal of development bridges;
- retention schedules, customer deletion workflows, and verified backup deletion behavior;
- minimum-cohort and narrow-segment suppression rules informed by POC evidence;
- detection and human review of distinctive incidents, quotations, proper nouns, and small-group risk;
- paraphrase or suppression as the default quotation policy;
- access-history review, security logging, monitoring, and abuse controls;
- backup restoration testing, incident response, breach-notification responsibilities, and continuity plans;
- data-processing agreements, subprocessors, residency, and cross-border processing statements;
- co-branded partner security and privacy controls; and
- independent penetration testing before broad enterprise availability.

## AI processing position

AI assists with bounded de-identification and synthesis; it does not make an autonomous final diagnosis. Synthesis receives approved de-identified evidence rather than participant identity or commercial records. The current OpenAI request disables response storage with `store: false`. Structured constraints prohibit identity inference, individual diagnosis, invented facts, causal certainty, and final prescriptive claims.

An assigned advisor must review disclosure risk and validate synthesis before client leadership validation. Buyers should be told which provider and model are in use, what data is sent, configured retention behavior, and applicable subprocessors at contracting.

## Deductive-identification risk

The platform should use “confidential” and “de-identified,” not promise that every contribution is anonymous. Minimum participation alone is insufficient: a cohort of five can still expose an individual if only one person holds a role or describes a recognizable event.

Release policy must consider total participation; subgroup uniqueness; distinctive roles, locations, clients, projects, and events; quotations and writing style; minority signals; and combinations of details that enable inference. When risk conflicts with evidentiary value, material should be paraphrased, aggregated, generalized, restricted, or excluded.

## Standard diligence answers

**Can an executive see who said what?** No. Sponsor and facilitator views receive progress and governed organizational findings, not attributed answers or raw interview content.

**Can Senger Advisory see raw responses?** Platform administrators do not receive general response-content access. An assigned advisor normally receives de-identified evidence. Exceptional raw-content review must be separately authorized, purpose-bound, time-limited, and audited.

**Is information used to train AI models?** The configured synthesis request uses the API with storage disabled and sends approved de-identified evidence. Current provider terms must be verified before a customer-specific assurance.

**Is the platform SOC 2 certified?** Not currently. Readiness and independent assurance are future milestones and must not be implied.

**What if someone includes a name or identifiable incident?** Evidence preparation removes or generalizes identifying categories, records the transformation, assigns risk, and requires review. High-risk material requires a human decision.

**Can data be deleted?** The architecture requires deletion and retention controls, but production timelines and backup behavior must be finalized before launch.

**How are co-branded partners controlled?** Partners receive scoped assignments within their client engagements and cannot browse across clients. Branding or commercial authority does not expand evidence access.

## Assurance roadmap

1. Complete the control inventory, data map, threat model, and production-readiness checklist.
2. Validate confidentiality language and disclosure thresholds in POCs.
3. Complete production hardening, deletion, backup, monitoring, and incident response.
4. Obtain independent penetration testing and remediate findings.
5. Establish vendor-risk, access-review, and security-training routines.
6. Pursue SOC 2 when enterprise demand and operating maturity justify it.
