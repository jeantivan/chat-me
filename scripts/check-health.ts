import pg from "pg";
import { Redis } from "ioredis";

async function checkHealth() {
  console.log("🔍 Checking local infrastructure health...");
  let allHealthy = true;

  // 1. Check PostgreSQL
  const pgPort = process.env.POSTGRES_PORT || 5434;
  const pool = new pg.Pool({
    connectionString: `postgres://postgres:postgres@localhost:${pgPort}/chat_me`,
    connectionTimeoutMillis: 3000,
  });

  try {
    const client = await pool.connect();
    const res = await client.query("SELECT version()");
    client.release();
    await pool.end();
    console.log(`✅ PostgreSQL (port ${pgPort}): REACHABLE (${res.rows[0].version.split(",")[0]})`);
  } catch (err: any) {
    allHealthy = false;
    console.error(`❌ PostgreSQL (port ${pgPort}): UNREACHABLE - ${err.message}`);
  }

  // 2. Check Redis
  const redis = new Redis("redis://localhost:6379", {
    connectTimeout: 3000,
    maxRetriesPerRequest: 1,
  });

  try {
    const pong = await redis.ping();
    redis.disconnect();
    console.log(`✅ Redis (port 6379): REACHABLE (${pong})`);
  } catch (err: any) {
    allHealthy = false;
    console.error(`❌ Redis (port 6379): UNREACHABLE - ${err.message}`);
  }

  // 3. Check MinIO
  try {
    const res = await fetch("http://localhost:9000/minio/health/live");
    if (res.ok) {
      console.log(`✅ MinIO S3 (port 9000): REACHABLE (status ${res.status})`);
    } else {
      allHealthy = false;
      console.error(`❌ MinIO S3 (port 9000): HTTP ${res.status}`);
    }
  } catch (err: any) {
    allHealthy = false;
    console.error(`❌ MinIO S3 (port 9000): UNREACHABLE - ${err.message}`);
  }

  if (!allHealthy) {
    console.error("\n💥 Some infrastructure services are unhealthy!");
    process.exit(1);
  } else {
    console.log("\n🎉 All infrastructure services are HEALTHY and ready!");
    process.exit(0);
  }
}

checkHealth();
