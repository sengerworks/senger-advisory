# Authenticated Workspace Deploy Preview

## Purpose

Use a Netlify Deploy Preview to verify the development Clerk organization, restricted Neon
runtime role, and authenticated workspace before enabling any production identity or data
collection.

The preview must use development resources only. Do not add the Neon branch-owner connection,
the production Neon branch, or Clerk production keys to Netlify.

## Netlify environment variables

Create these four site environment variables with **Functions** scope and a contextual value
for **Deploy Previews** only:

| Variable | Development value |
| --- | --- |
| `CLERK_PUBLISHABLE_KEY` | Clerk development publishable key |
| `CLERK_SECRET_KEY` | Clerk development secret key |
| `NEON_DATABASE_URL` | Pooled connection for the restricted `capacity_workspace_app` role on the Neon `development` branch |
| `CLERK_AUTHORIZED_PARTIES` | Exact Deploy Preview origin, with no path or trailing slash |

Do not add `NEON_MIGRATION_DATABASE_URL` to Netlify. It is an owner credential used locally
only for controlled migrations.

After adding or changing a value, retry the Deploy Preview so its functions receive the
current configuration.

## Validation gate

Use the exact Deploy Preview URL and verify:

1. `/workspace/` presents the Senger Advisory invitation-access screen.
2. The invited development Owner can sign in by email.
3. Clerk activates `Senger Advisory Development`.
4. The workspace displays the Owner landing state.
5. A signed-out browser cannot access the authenticated landing state.
6. Production at `sengeradvisory.com` continues to use no development credentials.

Passing this gate permits continued pilot-flow development. It does not authorize production
identity, live assessment collection, or migration of the Neon production branch.
