# Clerk Development Identity

## Verified configuration

The Clerk development instance for Senger Advisory Organizational Capacity is configured with:

- email authentication enabled;
- social, phone, username, and enterprise providers deferred;
- Organization membership required;
- user-created Organizations disabled;
- automatic first-Organization creation disabled;
- Verified Domains disabled; and
- one manually provisioned `Senger Advisory Development` Organization.

The pre-launch application uses Clerk's two standard Organization roles:

| Product role | Clerk role | Clerk system permissions |
| --- | --- | --- |
| Owner | `org:admin` | Built-in creator permissions |
| Participant | `org:member` | Standard membership; the application exposes no member directory |

Client Facilitator access is deferred until after POC validation. Senger Platform Admin and
Assigned Advisor access are governed by application-level assignments rather than client
Organization roles. The workspace does not mount Clerk's general Organization Profile or
Member List components and provides no participant-facing member-list endpoint.

The first development Owner invitation has been accepted. A real email sign-in, active
Organization session, server-side session verification, workspace resolution, and role-aware
Owner landing state have been completed successfully at the local `/workspace/` route.

## Provider-to-database boundary

Migration `003_workspace_resolution.sql` adds a narrowly granted, `SECURITY DEFINER`
resolution function. It accepts only the Clerk Organization ID from a server-verified session
and returns the active internal workspace ID. It returns no label, membership, submission,
score, invitation, or aggregate data.

The `Senger Advisory Development` Clerk Organization is mapped to one workspace record in the
Neon `development` branch. The production Clerk instance and Neon production branch remain
unconfigured and untouched.

`netlify/lib/clerk-workspace-auth.mjs`:

1. verifies a Clerk session token;
2. restricts the token's authorized party to configured application origins;
3. requires an active Organization;
4. permits only the two POC Organization roles;
5. resolves the Organization to an internal workspace; and
6. fails closed for signed-out, personal-account, unknown-role, and unmapped sessions.

`/api/workspace/session` returns only authentication readiness and the canonical role. It does
not return provider IDs, internal workspace IDs, user IDs, member lists, or private content.

## Remaining development steps

- Keep the isolated `/workspace/` browser application and Clerk UI bundle version pinned.
- Follow `Netlify-Deploy-Preview-Setup.md` to configure explicit preview-only variables and
  verify the same Owner session in a Deploy Preview.
- Use standard Clerk roles during POC validation; revisit enhanced B2B roles only after the
  client-facilitator use case and commercial demand are proven.
