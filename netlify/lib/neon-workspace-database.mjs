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
