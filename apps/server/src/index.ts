import "dotenv/config";
import pg from "pg";
import { buildApp } from "./app.js";
import { ensureBucketExists } from "./services/storage.service.js";
import { migrateDb } from "./db/migrate.js";
import { seedDb } from "./db/seed.js";

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || "0.0.0.0";

async function runAutoMigrationAndSeed() {
  const databaseUrl =
    process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5434/chat_me";

  if (process.env.AUTO_MIGRATE === "true") {
    console.log("⚙️  AUTO_MIGRATE=true: applying database migrations...");
    const pool = new pg.Pool({ connectionString: databaseUrl, max: 2 });
    try {
      await migrateDb(pool);
      console.log("✅ Migrations applied successfully.");

      if (process.env.AUTO_SEED === "true") {
        console.log("🌱 AUTO_SEED=true: running demo database seed...");
        await seedDb(pool);
        console.log("✅ Database seeded successfully.");
      }
    } catch (err) {
      console.error("❌ Database migration/seed error:", err);
      throw err;
    } finally {
      await pool.end();
    }
  }
}

async function main() {
  await runAutoMigrationAndSeed();
  await ensureBucketExists().catch(() => {});
  const app = await buildApp();

  try {
    await app.listen({ port: PORT, host: HOST });
    console.log(`🚀 chat-me backend running on http://${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
