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

The application has three Organization roles:

| Product role | Clerk role | Clerk system permissions |
| --- | --- | --- |
| Owner | `org:admin` | Built-in creator permissions |
| Facilitator | `org:facilitator` | Manage members; Read members |
| Participant | `org:participant` | None |

`org:participant` is the new-member default in the Default Role Set. Clerk's built-in
`org:member` role has been deleted so it cannot accidentally expose the Organization member
directory to a participant.

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
4. permits only the three canonical Organization roles;
5. resolves the Organization to an internal workspace; and
6. fails closed for signed-out, personal-account, unknown-role, and unmapped sessions.

`/api/workspace/session` returns only authentication readiness and the canonical role. It does
not return provider IDs, internal workspace IDs, user IDs, member lists, or private content.

## Remaining development steps

- Add the isolated browser workspace application and Clerk frontend SDK.
- Configure explicit local and Netlify authorized-party origins.
- Invite the first development Owner and complete the email sign-up flow.
- Verify a real browser session against `/api/workspace/session`.
- Add Clerk and Neon runtime secrets only to the appropriate Netlify development/deploy
  contexts before testing a deployed function.
- Keep the production Clerk instance inactive until the full pilot flow and security review
  pass.
