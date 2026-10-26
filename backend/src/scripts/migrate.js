
import "dotenv/config";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { pool } from "../db.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(here, "../..");
const MIGRATION_LOCK_KEY = 72419031;

// Safety guard: this runner is currently restricted to the verified
// ComplyTrack restore-test endpoint. Change this deliberately only when
// preparing a separately reviewed deployment procedure.
const EXPECTED_TEST_HOST =
  "ep-divine-dust-b6wat14v.c-2.sa-east-1.aws.neon.tech";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing.");
  }

  const databaseHost = new URL(databaseUrl).hostname;

  if (databaseHost !== EXPECTED_TEST_HOST) {
    throw new Error(
      "Migration blocked: DATABASE_URL does not point to the approved " +
        "complytrack-restore-test endpoint.",
    );
  }

  const client = await pool.connect();
  let lockAcquired = false;

  try {
    const connectionInfo = await client.query(`
      SELECT current_database() AS database_name,
             current_user AS database_role
    `);

    if (connectionInfo.rows[0]?.database_name !== "neondb") {
      throw new Error(
        "Migration blocked: the connected database is not neondb.",
      );
    }

    const lockResult = await client.query(
      "SELECT pg_try_advisory_lock($1) AS locked",
      [MIGRATION_LOCK_KEY],
    );

    lockAcquired = lockResult.rows[0]?.locked === true;

    if (!lockAcquired) {
      throw new Error(
        "Another ComplyTrack migration process is already running.",
      );
    }

    // Initialize the original base schema atomically.
    const baseSchema = await readFile(
      path.join(backendRoot, "schema.sql"),
      "utf8",
    );

    console.log("Initializing base schema...");

    await client.query("BEGIN");

    try {
      await client.query(baseSchema);

      await client.query(`
        CREATE TABLE IF NOT EXISTS complytrack_schema_migrations (
          name TEXT PRIMARY KEY,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await client.query("COMMIT");
      console.log("Base schema initialized.");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw new Error(
        `Base schema initialization failed: ${error.message}`,
      );
    }

    const migrationDir = path.join(backendRoot, "migrations");

    const migrations = (await readdir(migrationDir))
      .filter((name) => /^\d+_[a-zA-Z0-9_-]+\.sql$/.test(name))
      .sort();

    for (const name of migrations) {
      await client.query("BEGIN");

      try {
        const existing = await client.query(
          `SELECT 1
           FROM complytrack_schema_migrations
           WHERE name = $1`,
          [name],
        );

        if (existing.rowCount > 0) {
          await client.query("COMMIT");
          console.log(`Skipping already-applied ${name}.`);
          continue;
        }

        console.log(`Applying ${name}...`);

        const migrationSql = await readFile(
          path.join(migrationDir, name),
          "utf8",
        );

        // Migration SQL must not contain its own outer BEGIN/COMMIT.
        await client.query(migrationSql);

        await client.query(
          `INSERT INTO complytrack_schema_migrations (name)
           VALUES ($1)`,
          [name],
        );

        await client.query("COMMIT");
        console.log(`Applied ${name}.`);
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw new Error(`Migration ${name} failed: ${error.message}`);
      }
    }

    console.log("Database schema and migrations applied successfully.");
  } finally {
    if (lockAcquired) {
      await client
        .query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK_KEY])
        .catch((error) => {
          console.error(
            "Could not release migration lock:",
            error.message,
          );
        });
    }

    client.release();
  }
}

try {
  await main();
} catch (error) {
  console.error("Database migration failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
