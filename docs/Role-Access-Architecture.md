# Role and Access Architecture

## Decision

The product separates client authority, engagement delivery, platform operations, and
confidential participation. A role’s ability to operate the platform never implies access to
diagnostic response content.

| Product role | Scope | Primary responsibilities | Confidential response boundary |
| --- | --- | --- | --- |
| Senger Platform Admin | Platform, partner, and tenant operations | Provisioning, billing, entitlements, method versions, support, audit oversight | No response-content access |
| Assigned Advisor | One client engagement for a defined period | Discovery, participant design, protocol governance, de-identified evidence review, synthesis facilitation, intervention delivery | Governed evidence review only; no general attributed-response browsing |
| Client Sponsor | One client workspace | Progress, organizational findings, decisions, intervention acceptance, outcomes | No individual response content |
| Client Facilitator | One client workspace | Invitations, scheduling, reminders, collection logistics | Completion state only; no response content |
| Participant | Own invitation and interview | Notice acceptance, confidential contribution, withdrawal where permitted | Own interview only |

## POC bridge

The development Clerk organization currently has `org:admin`, `org:facilitator`, and
`org:participant`. For end-to-end POC testing, `org:admin` temporarily exposes diagnostic
discovery, participant design, and protocol approval. In the final model, `org:admin` maps to
Client Sponsor and those method controls move to the Senger/Advisor operating console.

This bridge must not be expanded into a permanent super-admin design.

## Required final enforcement

- Platform Admin access is platform-scoped and grants no response-content capability.
- Advisor access is represented by an explicit engagement assignment with start, expiry,
  revocation, purpose, client workspace, and audit history.
- One person acting as both Platform Admin and Advisor receives two distinguishable grants.
- Client Sponsor and Facilitator endpoints return progress and organizational outputs only.
- Interview content remains private; de-identification and disclosure review occur before
  evidence enters advisor synthesis.
- Co-branded partners receive the same scoped advisor model and cannot browse across clients.
