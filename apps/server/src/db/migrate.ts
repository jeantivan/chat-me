import { migrate } from "drizzle-orm/node-postgres/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import type pg from "pg";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function migrateDb(pool: pg.Pool) {
  const db = drizzle(pool);
  const migrationsFolder = path.resolve(__dirname, "../../drizzle");
  await migrate(db, { migrationsFolder });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { Pool } = await import("pg");
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5434/chat_me",
  });
  try {
    console.log("Running migrations...");
    await migrateDb(pool);
    console.log("Migrations applied successfully.");
  } finally {
    await pool.end();
  }
}
