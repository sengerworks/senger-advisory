# Platform Operations and POC Control Center

## Purpose

Platform Operations is the Senger Advisory control plane for establishing diagnostic engagements and monitoring POC readiness. It is separate from the client sponsor workspace, assigned-advisor console, and participant contribution experience.

The first implementation is intentionally tenant-bounded: the operator selects an active Clerk client organization, and every query runs inside that organization's Neon RLS transaction. Cross-client portfolio administration is a later platform-tenancy milestone.

## Authority

Access requires both:

1. an authenticated Clerk session with an active, mapped client organization; and
2. an exact Clerk user ID in the server-only `PLATFORM_OPERATOR_USER_IDS` allowlist.

A client `org:admin` role alone does not grant Platform Operations authority. The allowlist is never returned through browser configuration or session APIs.

## Current controls

- Create the versioned diagnostic engagement.
- Choose automated or advisor-led delivery.
- Establish a no-charge POC entitlement or pending paid entitlement.
- View minimized engagement state, participation completion counts, pending evidence-review volume, active advisor assignments, POC feedback counts, and change-candidate counts.

The control center never returns participant names, email addresses, response content, evidence excerpts, advisor notes, or individual scores.

## Role boundary

- **Platform operator:** establishes the engagement and entitlement and monitors operational readiness.
- **Client sponsor:** approves context, participation design, leadership validation, intervention acceptance, and the Capacity Operating Brief.
- **Assigned advisor:** reviews de-identified evidence, validates synthesis, designs intervention, and handles governed support.
- **Participant:** accesses only their own confidential contribution.

Diagnostic creation is no longer available through the client workspace API. Client administrators may list their own diagnostic engagements but cannot create one.

## Configuration

Set the server-only environment variable to one or more comma-separated Clerk user IDs:

```text
PLATFORM_OPERATOR_USER_IDS=user_example
```

The local console is available at `http://localhost:8888/workspace/operations.html`.

## Next operating slices

1. Platform-owned client-workspace provisioning without requiring pre-existing client membership.
2. Governed advisor assignment and revocation from Platform Operations. Implemented: operators grant a verified Clerk user ID purpose-bound access for 1–30 days and may revoke it immediately; the advisor console cannot self-assign.
3. Time-bounded POC start and target-completion dates.
4. Cross-client portfolio summaries that remain free of participant identity and content.
5. Production-grade operator administration, recovery, and step-up authentication.
