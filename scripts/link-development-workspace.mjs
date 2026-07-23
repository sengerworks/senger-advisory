import { randomUUID } from "node:crypto";
import { createClerkClient } from "@clerk/backend";
import {
  resolveNeonWorkspaceId,
  withNeonWorkspaceTransaction
} from "../netlify/lib/neon-workspace-database.mjs";

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const organizations = await clerk.organizations.getOrganizationList({ limit: 100 });
const matches = organizations.data.filter(
  ({ name }) => name === "Senger Advisory Development"
);

if (matches.length !== 1) {
  throw new Error(`Expected one Senger Advisory Development organization; found ${matches.length}.`);
}

const organization = matches[0];
let workspaceId = await resolveNeonWorkspaceId(organization.id);

if (!workspaceId) {
  workspaceId = randomUUID();
  await withNeonWorkspaceTransaction(workspaceId, async ({ query }) => {
    await query(
      `INSERT INTO app_identity.workspaces
        (id, clerk_organization_id, display_label, created_by_clerk_user_id)
       VALUES ($1, $2, $3, $4)`,
      [workspaceId, organization.id, organization.name, "clerk-dashboard"]
    );
  });
  console.log("Created development workspace mapping.");
} else {
  console.log("Development workspace mapping already exists.");
}
