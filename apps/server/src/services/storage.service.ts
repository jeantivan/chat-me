import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export function isLocalStorageMode(): boolean {
  if (process.env.STORAGE_MODE === "local") {
    return true;
  }
  // When running in production or explicit non-s3 mode, fallback to local storage if S3_ENDPOINT is not set
  if (process.env.NODE_ENV === "production" && !process.env.S3_ENDPOINT) {
    return true;
  }
  if (!process.env.S3_ENDPOINT && process.env.NODE_ENV !== "test") {
    return true;
  }
  return false;
}

const endpoint = process.env.S3_ENDPOINT || "http://localhost:9000";
const region = process.env.S3_REGION || "us-east-1";
const accessKeyId = process.env.S3_ACCESS_KEY_ID || "minioadmin";
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || "minioadmin";
export const s3Bucket = process.env.S3_BUCKET || "chat-media";
export const s3PublicBaseUrl =
  process.env.S3_PUBLIC_URL || `${endpoint.replace(/\/$/, "")}/${s3Bucket}`;

export const s3Client = new S3Client({
  endpoint,
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  forcePathStyle: true,
});

export const localStorageDir =
  process.env.STORAGE_LOCAL_DIR || path.resolve(process.cwd(), "uploads");

const signingSecret =
  process.env.STORAGE_SECRET ||
  process.env.JWT_SECRET ||
  process.env.COOKIE_SECRET ||
  "chat-me-local-storage-secret";

export function signStorageKey(key: string, expiresAtMs: number): string {
  const payload = `${key}:${expiresAtMs}`;
  return crypto.createHmac("sha256", signingSecret).update(payload).digest("hex");
}

export function verifyStorageSignature(
  key: string,
  expiresAtMs: number,
  signature: string
): boolean {
  if (Date.now() > expiresAtMs) {
    return false;
  }
  const expected = signStorageKey(key, expiresAtMs);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

export async function saveLocalObject(key: string, data: Buffer): Promise<void> {
  const resolved = path.resolve(localStorageDir, key);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  await fs.promises.writeFile(resolved, data);
}

export async function readLocalObject(key: string): Promise<Buffer | null> {
  const resolved = path.resolve(localStorageDir, key);
  try {
    return await fs.promises.readFile(resolved);
  } catch {
    return null;
  }
}

export async function ensureBucketExists(): Promise<void> {
  if (isLocalStorageMode()) {
    fs.mkdirSync(localStorageDir, { recursive: true });
    return;
  }

  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: s3Bucket }));
  } catch (err: any) {
    if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
      try {
        await s3Client.send(new CreateBucketCommand({ Bucket: s3Bucket }));
      } catch {
        // ignore if already created
      }
    }
  }

  try {
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${s3Bucket}/*`],
        },
      ],
    };
    await s3Client.send(
      new PutBucketPolicyCommand({
        Bucket: s3Bucket,
        Policy: JSON.stringify(policy),
      })
    );
  } catch {
    // ignore if policy setting is unsupported on custom S3 provider
  }
}

export async function generatePresignedUploadUrl(params: {
  key: string;
  mimeType: string;
  sizeBytes: number;
  expiresInSeconds?: number;
}): Promise<{ uploadUrl: string; publicUrl: string; expiresAt: Date }> {
  const expiresIn = params.expiresInSeconds || 900; // 15 minutes
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  if (isLocalStorageMode()) {
    const signature = signStorageKey(params.key, expiresAt.getTime());
    const publicUrl = `/api/v1/media/storage/${params.key}`;
    const uploadUrl = `/api/v1/media/storage/${params.key}?exp=${expiresAt.getTime()}&sig=${signature}`;
    return { uploadUrl, publicUrl, expiresAt };
  }

  const command = new PutObjectCommand({
    Bucket: s3Bucket,
    Key: params.key,
    ContentType: params.mimeType,
    ContentLength: params.sizeBytes,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
  const publicUrl = `${s3PublicBaseUrl.replace(/\/$/, "")}/${params.key}`;

  return { uploadUrl, publicUrl, expiresAt };
}
