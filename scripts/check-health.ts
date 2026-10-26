import pg from "pg";
import { Redis } from "ioredis";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";

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

  // 3. Check MinIO S3 (Read & Write probe)
  const s3Endpoint = process.env.S3_ENDPOINT || "http://localhost:9000";
  const s3Bucket = process.env.S3_BUCKET || "chat-media";
  const s3 = new S3Client({
    endpoint: s3Endpoint,
    region: process.env.S3_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || "minioadmin",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "minioadmin",
    },
    forcePathStyle: true,
  });

  try {
    // 3a. Verify endpoint is alive
    const res = await fetch(`${s3Endpoint}/minio/health/live`);
    if (!res.ok) {
      throw new Error(`Live probe returned HTTP ${res.status}`);
    }

    // 3b. Verify bucket exists or create it
    try {
      await s3.send(new HeadBucketCommand({ Bucket: s3Bucket }));
    } catch (headErr: any) {
      if (headErr.name === "NotFound" || headErr.$metadata?.httpStatusCode === 404) {
        await s3.send(new CreateBucketCommand({ Bucket: s3Bucket }));
      } else {
        throw headErr;
      }
    }

    // 3c. Probe write & delete permissions
    const probeKey = `.healthcheck-probe-${Date.now()}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: s3Bucket,
        Key: probeKey,
        Body: "probe",
        ContentType: "text/plain",
      })
    );
    await s3.send(
      new DeleteObjectCommand({
        Bucket: s3Bucket,
        Key: probeKey,
      })
    );

    console.log(`✅ MinIO S3 (port 9000): HEALTHY & WRITABLE (bucket: "${s3Bucket}")`);
  } catch (err: any) {
    allHealthy = false;
    if (err.name === "AccessDenied" || err.$metadata?.httpStatusCode === 403) {
      console.error(
        `❌ MinIO S3 (port 9000): ACCESS DENIED - MinIO container cannot write to /data. Run "docker compose exec -u 0 minio chmod -R 777 /data" to fix.`
      );
    } else {
      console.error(`❌ MinIO S3 (port 9000): UNREACHABLE - ${err.message}`);
    }
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
