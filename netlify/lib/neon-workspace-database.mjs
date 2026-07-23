import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { withWorkspaceTransaction } from "../../workspace-tenant-boundary.js";

neonConfig.webSocketConstructor = ws;

export function createNeonWorkspaceDatabase(connectionString = process.env.NEON_DATABASE_URL) {
  if (typeof connectionString !== "string" || !connectionString.startsWith("postgres")) {
    throw new Error("NEON_DATABASE_URL is not configured.");
  }

  return {
    async transaction(operation) {
      const pool = new Pool({ connectionString, max: 1 });
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const result = await operation({
          query: (text, parameters = []) => client.query(text, parameters)
        });
        await client.query("COMMIT");
        return result;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
        await pool.end();
      }
    }
  };
}

export function withNeonWorkspaceTransaction(workspaceId, operation, connectionString) {
  return withWorkspaceTransaction(
    createNeonWorkspaceDatabase(connectionString),
    workspaceId,
    operation
  );
}

export async function resolveNeonWorkspaceId(clerkOrganizationId, connectionString) {
  if (typeof clerkOrganizationId !== "string" || !/^org_[A-Za-z0-9]+$/.test(clerkOrganizationId)) {
    throw new TypeError("A valid Clerk organization ID is required.");
  }

  const database = createNeonWorkspaceDatabase(connectionString);
  return database.transaction(async ({ query }) => {
    const result = await query(
      "SELECT app_identity.resolve_workspace($1) AS workspace_id",
      [clerkOrganizationId]
    );
    return result.rows[0]?.workspace_id || null;
  });
}
