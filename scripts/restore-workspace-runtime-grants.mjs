import { readFile, readdir } from "node:fs/promises";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.NEON_MIGRATION_DATABASE_URL;
if (typeof connectionString !== "string" || !connectionString.startsWith("postgres")) {
  throw new Error("Set NEON_MIGRATION_DATABASE_URL to the direct branch owner connection.");
}
if (new URL(connectionString).hostname.includes("-pooler.")) {
  throw new Error("Use a direct Neon connection to restore runtime grants.");
}

const migrationsDirectory = new URL("../db/migrations/", import.meta.url);
const migrationFiles = (await readdir(migrationsDirectory))
  .filter((name) => /^\d{3}_[a-z0-9_]+\.sql$/.test(name) && !name.startsWith("040_"))
  .sort();

const pool = new Pool({ connectionString, max: 1 });
const client = await pool.connect();
let restoredStatements = 0;

try {
  for (const filename of migrationFiles) {
    const sql = await readFile(new URL(filename, migrationsDirectory), "utf8");
    for (const statement of sql.split(";")) {
      if (!/capacity_workspace_app/i.test(statement)) continue;
      await client.query(`${statement};`);
      restoredStatements += 1;
    }
  }
  console.log(`Restored ${restoredStatements} exact runtime grant statements.`);
} finally {
  client.release();
  await pool.end();
}
