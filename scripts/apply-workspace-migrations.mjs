import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.NEON_MIGRATION_DATABASE_URL;
if (typeof connectionString !== "string" || !connectionString.startsWith("postgres")) {
  throw new Error("Set NEON_MIGRATION_DATABASE_URL to the development branch owner connection.");
}
if (new URL(connectionString).hostname.includes("-pooler.")) {
  throw new Error("Use a direct Neon connection, not a pooled connection, for migrations.");
}

const migrationsDirectory = new URL("../db/migrations/", import.meta.url);
const migrationFiles = (await readdir(migrationsDirectory))
  .filter((name) => /^\d{3}_[a-z0-9_]+\.sql$/.test(name))
  .sort();

const pool = new Pool({ connectionString, max: 1 });
const client = await pool.connect();

try {
  await client.query(`
    CREATE SCHEMA IF NOT EXISTS app_operations;
    CREATE TABLE IF NOT EXISTS app_operations.schema_migrations (
      filename text PRIMARY KEY,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const appliedResult = await client.query(
    "SELECT filename, checksum FROM app_operations.schema_migrations"
  );
  const applied = new Map(
    appliedResult.rows.map(({ filename, checksum }) => [filename, checksum])
  );

  for (const filename of migrationFiles) {
    const sql = await readFile(new URL(filename, migrationsDirectory), "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");

    if (applied.has(filename)) {
      if (applied.get(filename) !== checksum) {
        throw new Error(`Applied migration changed: ${filename}`);
      }
      console.log(`Already applied: ${filename}`);
      continue;
    }

    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query(
        "INSERT INTO app_operations.schema_migrations (filename, checksum) VALUES ($1, $2)",
        [filename, checksum]
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
    console.log(`Applied: ${filename}`);
  }
} finally {
  client.release();
  await pool.end();
}
