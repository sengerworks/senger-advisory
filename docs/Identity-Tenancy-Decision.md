# Identity and Tenancy Decision v0.1

## Decision

Use:

- **Clerk Organizations** for authentication, sessions, organization membership, roles, and
  invitation acceptance;
- **Neon Postgres** for transactional workspace, collection-round, submission, aggregate,
  consent, deletion, and audit data; and
- **Netlify Functions** as the only application-data gateway between the browser and Neon.

Status: selected for the development foundation. Production activation still requires vendor
accounts, environment configuration, a data-processing review, migration testing, and a
focused security review.

## Why this stack

### Clerk Organizations

The product is inherently organization-based. Clerk provides active-organization context,
organization invitations, passwordless authentication options, session management, and
server-verifiable roles rather than requiring Senger Advisory to build credential and account
security. The first two custom production roles are currently available without the enhanced
B2B add-on, which fits the required facilitator and participant roles alongside the built-in
administrator role.

Use three provider roles:

- `org:admin` → product Owner;
- `org:facilitator` → product Facilitator; and
- `org:participant` → product Participant.

The custom Participant role receives no Clerk system permission to read members. This is
necessary because Clerk's default Member role can read other organization members. The
application must not expose Clerk's general Organization Profile or Member List components to
participants.

### Neon Postgres

Workspace data has transactional relationships, concurrent updates, tenant-scoped queries,
retention jobs, and audit requirements that exceed the intended use of Netlify Blobs. Neon
provides serverless Postgres access documented for Netlify Functions, standard SQL,
branch-based development, scale-to-zero economics, backups, and a path to Postgres row-level
security.

Postgres avoids encoding the core organizational model in a proprietary document store. The
schema and migrations remain portable to another managed Postgres provider if operating,
residency, cost, or contractual requirements change.

### Netlify Functions as gateway

The browser will not query workspace tables directly in the first production release. Every
request will:

1. reach a same-origin Netlify Function;
2. validate method, origin, content type, and payload size;
3. authenticate the Clerk session with explicit authorized parties;
4. bind the request to the active Clerk organization;
5. authorize the product action using the server-side role matrix;
6. execute a parameterized, tenant-scoped Neon transaction; and
7. return only the minimum response permitted for that role and threshold state.

This keeps database credentials out of the browser and provides one place for rate limits,
audit events, threshold enforcement, schema validation, and safe errors. Neon Data API access
from the browser remains deferred.

## Alternatives considered

### Supabase Auth and Postgres

Supabase combines JWT authentication, passwordless sign-in, invitation APIs, Postgres, and
row-level security. It would reduce the vendor count and is a credible fallback. It does not,
however, supply the product's organization, membership, role, and organization-invitation
model as a first-class application primitive. Senger Advisory would own more identity-linked
tenancy code at the moment when authorization correctness matters most.

Select Supabase instead if Clerk's organization pricing, regional hosting limits, or role
model becomes unacceptable, or if operating one integrated platform becomes more important
than reducing custom identity logic.

### Netlify Blobs

Keep Blobs for ciphertext-only private saved results and existing evidence events. Do not use
it as the primary organization database. Membership joins, invitation revocation, concurrent
round closure, uniqueness, referential integrity, deletion cascades, and cross-tenant audits
need transactional guarantees and query controls.

### Auth0, WorkOS, or self-built authentication

Auth0 and WorkOS remain credible enterprise-SSO options, but they add cost or complexity
before the product has enterprise connection requirements. Self-built authentication is
rejected: credential, recovery, MFA, session, bot, and invitation security are not the
platform's differentiating work.

## Data boundaries

Clerk stores identity, account credentials, organization membership, roles, invitations, and
session state. It must never receive assessment answers, scores, outcomes, action-cycle
contents, research identifiers, or private saved-profile recovery material.

Neon stores the Clerk organization ID and user ID only where required for tenancy,
authorization, submission ownership, and deletion. Identity-linked tables and assessment
content use separate schemas and least-privilege database roles:

- `app_identity` — workspace mapping, invitation slot mapping, role/audit references;
- `app_private` — minimized individual organizational submissions;
- `app_shared` — threshold-qualified aggregates and shared action cycles; and
- `app_operations` — content-free audit and deletion events.

The aggregate service can read `app_private`; ordinary workspace report endpoints cannot.
Owners and facilitators receive completion state from identity records and aggregate content
from shared records, never a joined respondent-score result.

Existing stores remain separate:

- `capacity-saved-results` stays client-encrypted and recovery-link based;
- `assessment-evidence` stays anonymous and cross-sectional;
- `capacity-longitudinal-evidence` stays separately consented and pseudonymous; and
- none of those identifiers become Clerk or Neon workspace identifiers.

## Authorization model

`workspace-authorization.js` and `schemas/workspace-authorization.json` are the canonical
product-level permission contract. The system fails closed for an unknown role or action.

Important boundaries:

- all members may read basic workspace and round context;
- only owners and facilitators may manage invitations or see completion status;
- only the owner may update/delete the workspace or read the content-free audit log;
- every role may create and control only its own submission while a round is open;
- no role may list or read individual submissions;
- aggregates remain unavailable to every role until the threshold is met; and
- participant tokens carry no provider permission to list organization members.

Frontend visibility is never authorization. Every Netlify Function repeats the role,
organization, round-state, ownership, and threshold checks.

## Database access model

Initial functions use `@neondatabase/serverless` with a dedicated application database role:

- not a database owner;
- no `BYPASSRLS`;
- no schema creation rights;
- no direct access to unrelated schemas;
- parameterized queries only; and
- transactions for invitation, submission, closure, deletion, and aggregate updates.

Every tenant table carries an immutable `workspace_id`. Composite unique constraints include
`workspace_id` where appropriate. Foreign keys may not cross from one workspace to another.

Database row-level security is required before production and acts as defense in depth, not a
replacement for function authorization. Cross-tenant integration tests must attempt every
read and mutation using valid users from two workspaces.

## Session and request security

- Use Clerk's server request authentication and set `authorizedParties` to production,
  deploy-preview, and approved local origins.
- Prefer networkless JWT verification with the configured public key, while retaining a
  documented key-rotation path.
- Require an active organization claim for every workspace endpoint.
- Reject a URL workspace ID that does not equal the authorized organization mapping.
- Do not accept role, organization, user, membership, or threshold claims from request JSON.
- Use same-origin cookies or authorization headers according to Clerk's supported flow.
- Apply CSRF protections, request-size limits, rate limits, and generic authorization errors.
- Never log tokens, invitation links, assessment payloads, organization IDs paired with
  scores, or database connection strings.
- Require step-up authentication before workspace deletion or other future high-impact
  operations.

## Operational and vendor limitations

Clerk identity data is currently US-hosted and does not offer selectable regional residency.
This may be unacceptable for a future customer with strict localization requirements. Review
the DPA, subprocessors, residency needs, and customer contract before production collection.

Clerk pricing is currently favorable for an early pilot, but organization-member limits and
B2B add-ons must be checked before commercial commitments. Do not design the product around a
free-tier assumption.

Neon's free tier is appropriate for development, not an availability commitment. A production
workspace should use a paid plan with an appropriate restore window, autoscaling limits,
monitoring, and documented recovery tests.

Adding Clerk's browser SDK requires either a build step or remote scripts and new CSP
allowlists. Prefer an isolated bundled `/workspace/` application so the existing public site
and private recovery-link experience retain their current minimal dependency surface.

## Implementation sequence

### Slice 1 — Local tenancy foundation

- Add the canonical role/action authorization engine and tests.
- Define the relational schema and migrations with separate logical schemas.
- Add two-workspace fixtures and cross-tenant authorization tests.
- Add environment-variable contracts without real secrets.

### Slice 2 — Development identity connection

- Create Clerk development and Neon development projects.
- Configure `org:facilitator` and `org:participant` with the specified system permissions.
- Add an isolated bundled workspace application.
- Add a Netlify auth-check function using `authorizedParties`.
- Map one Clerk organization to one Neon workspace.

### Slice 3 — Workspace and round lifecycle

- Create/read/update/delete workspace metadata.
- Create and close collection rounds.
- Emit content-free audit events.
- Enforce tenant isolation in functions and database policies.

### Slice 4 — Invitations and participant notice

- Create, resend, revoke, accept, and expire Clerk organization invitations.
- Record versioned product notice acceptance separately from response content.
- Expose completion identity only to owner/facilitator roles.

### Slice 5 — Submission and threshold aggregation

- Accept one exact minimized submission per participant slot.
- Support replacement and deletion while open.
- Recompute and suppress aggregates transactionally.
- Return only the threshold-qualified organizational view.

## Acceptance criteria before real participant data

- Clerk and Neon DPAs and production settings reviewed;
- no secret committed or emitted to client code;
- provider role configuration matches the machine-readable contract;
- participants cannot list members through either product or Clerk frontend permissions;
- Netlify Functions reject missing, wrong-origin, wrong-organization, stale, and forged tokens;
- every tenant table and query is covered by cross-workspace denial tests;
- a database credential leak does not grant database-owner or RLS-bypass privileges;
- submission content is inaccessible to owner/facilitator report endpoints;
- deletion and threshold recomputation are transactional;
- backups and restore are exercised; and
- an independent security review is completed before a broad production rollout.
