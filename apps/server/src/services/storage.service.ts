import {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

export async function ensureBucketExists(): Promise<void> {
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
  const command = new PutObjectCommand({
    Bucket: s3Bucket,
    Key: params.key,
    ContentType: params.mimeType,
    ContentLength: params.sizeBytes,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
  const publicUrl = `${s3PublicBaseUrl.replace(/\/$/, "")}/${params.key}`;
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  return { uploadUrl, publicUrl, expiresAt };
}
